import bcrypt from "bcryptjs";
import {
  InvalidCredentials,
  AlreadyExists,
  BadRequest,
  Forbidden,
  Conflict,
  ServiceUnavailable,
  NotFound,
  StudentNotInRoster,
} from "app/core/errors/errorFactory.js";
import { isWellFormedStudentCode } from "app/core/utils/studentCode.js";
import { withLogging } from "app/core/services/baseService.js";
import { appConfig } from "app/config/app.js";
import { maskEmail } from "app/core/utils/maskEmail.js";
import { logger } from "app/core/logger/index.js";
import { AUTH_HEADER_BEARER_PREFIX } from "app/core/constants/authHttp.js";

/**
 * Auth Service — xử lý business logic: login, register, refresh, logout
 * Tuân thủ SRP: chỉ orchestrate, delegate token logic cho tokenService
 */
const INVITE_INVALID = "Liên kết không hợp lệ hoặc đã hết hạn.";

/** fetch tới Google OAuth; TypeError: fetch failed → lỗi mạng/DNS/TLS, không phải logic auth. */
const googleFetch = async (url, init, phase) => {
  try {
    return await fetch(url, init);
  } catch (err) {
    const c = err?.cause;
    const diagnostic = [c?.code, c?.syscall, c?.message, err?.message].filter(Boolean).join(" | ");
    logger.error(`[Auth] Google OAuth fetch failed (${phase})`, { diagnostic, err });
    const devHint = process.env.NODE_ENV !== "production" && diagnostic ? ` (${diagnostic})` : "";
    throw ServiceUnavailable(
      `Không kết nối được tới Google (đăng nhập OAuth). Kiểm tra internet, firewall, VPN và DNS trên máy chạy backend.${devHint}`,
      process.env.NODE_ENV !== "production" ? { phase, diagnostic } : null
    );
  }
};

export const createAuthService = ({
  userRepository,
  studentRepository,
  tokenService,
  accessLogRepository,
  inviteRepository,
  auditService,
  transaction,
}) => {
  /**
   * Thông tin hiển thị profile (sau login /me) — có full_name, không trả password.
   */
  const getProfile = async (userId) => {
    const row = await userRepository.findProfileById(userId);
    if (!row) throw NotFound("User");
    const { password: _, ...userInfo } = row;
    return userInfo;
  };

  /**
   * Cập nhật thông tin profile (Full name, Avatar, Phone, Campus)
   */
  const updateProfile = async (userId, data) => {
    const user = await userRepository.findById(userId);
    if (!user) throw NotFound("User");

    const { full_name, avatar_url, phone, campus } = data;

    // Lấy dữ liệu cũ để ghi log
    const oldUser = await getProfile(userId);

    await transaction.run(async (conn) => {
      // 1. Cập nhật bảng users (full_name, avatar_url, phone, campus)
      const userUpdates = {};
      if (full_name !== undefined) userUpdates.full_name = full_name;
      if (avatar_url !== undefined) userUpdates.avatar_url = avatar_url;
      if (phone !== undefined) userUpdates.phone = phone;
      if (campus !== undefined) userUpdates.campus = campus;

      if (Object.keys(userUpdates).length > 0) {
        await userRepository.updateWithConn(conn, userId, {
          ...userUpdates,
          updated_at: new Date(),
        });
      }

      // 2. Nếu là sinh viên, cập nhật bảng students (phone, campus) để đồng bộ
      const student = await studentRepository.findByUserId(userId);
      if (student) {
        const studentUpdates = {};
        if (phone !== undefined) studentUpdates.phone = phone;
        if (campus !== undefined) studentUpdates.campus = campus;

        if (Object.keys(studentUpdates).length > 0) {
          await studentRepository.updateWithConn(conn, student.id, {
            ...studentUpdates,
            updated_at: new Date(),
          });
        }
      }
    });

    // 3. Ghi log hoạt động sau khi transaction thành công
    const newValues = {};
    const oldValues = {};
    if (full_name !== undefined && full_name !== oldUser.full_name) {
      newValues.full_name = full_name;
      oldValues.full_name = oldUser.full_name;
    }
    if (avatar_url !== undefined && avatar_url !== oldUser.avatar_url) {
      newValues.avatar_url = avatar_url;
      oldValues.avatar_url = oldUser.avatar_url;
    }
    if (phone !== undefined && phone !== oldUser.phone) {
      newValues.phone = phone;
      oldValues.phone = oldUser.phone;
    }
    if (campus !== undefined && campus !== oldUser.campus) {
      newValues.campus = campus;
      oldValues.campus = oldUser.campus;
    }

    if (Object.keys(newValues).length > 0) {
      await auditService.log({
        userId,
        action: "update_profile",
        tableName: "users",
        recordId: userId,
        title: full_name || oldUser.full_name,
        oldValues,
        newValues,
      });
    }

    return getProfile(userId);
  };

  /**
   * Login: verify credentials → generate token pair + Log
   */
  const login = async ({ username, password }, deviceInfo = {}) => {
    const trimmedUser = String(username ?? "").trim();
    const user = await userRepository.findByUsername(trimmedUser);
    if (!user) {
      if (isWellFormedStudentCode(trimmedUser)) {
        const stu = await studentRepository.findActiveByStudentCode(trimmedUser);
        if (!stu) throw StudentNotInRoster();
      }
      throw InvalidCredentials("Username or password incorrect");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const responseTime = deviceInfo.startTime ? Date.now() - deviceInfo.startTime : 0;
      accessLogRepository.logAction({
        userId: user.id,
        action: "LOGIN",
        ipAddress: deviceInfo.ip,
        userAgent: deviceInfo.userAgent,
        requestId: deviceInfo.requestId,
        responseTime,
        status: "FAILED",
        failureReason: "Invalid password",
      });
      throw InvalidCredentials("Username or password incorrect");
    }

    const tokens = await tokenService.generateTokenPair(user, deviceInfo);

    const responseTime = deviceInfo.startTime ? Date.now() - deviceInfo.startTime : 0;
    accessLogRepository.logAction({
      userId: user.id,
      action: "LOGIN",
      ipAddress: deviceInfo.ip,
      userAgent: deviceInfo.userAgent,
      requestId: deviceInfo.requestId,
      responseTime,
      status: "SUCCESS",
    });

    // Ghi log vào bảng audit_logs để hiển thị ở Profile
    await auditService.log({
      userId: user.id,
      action: "login",
      tableName: "users",
      recordId: user.id,
      title: user.username,
      ipAddress: deviceInfo.ip,
      userAgent: deviceInfo.userAgent,
    });

    const { password: _, ...userInfo } = user;
    return { user: userInfo, tokens };
  };

  /**
   * Register: validate uniqueness → hash password → create user → auto-login + Log
   */
  const register = async (data, deviceInfo = {}) => {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw AlreadyExists("User with this email");

    const pendingStudent = await studentRepository.findByEmail(data.email);
    if (pendingStudent && !pendingStudent.user_id && String(pendingStudent.status) === "pending") {
      throw BadRequest("Vui lòng kích hoạt tài khoản qua liên kết trong email mời lớp học.");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const newUser = await userRepository.create({
      full_name: data.fullname,
      email: data.email,
      username: data.email.split("@")[0],
      password: hashedPassword,
      role: data.role || "student",
    });

    const tokens = await tokenService.generateTokenPair(newUser, deviceInfo);

    const responseTime = deviceInfo.startTime ? Date.now() - deviceInfo.startTime : 0;
    accessLogRepository.logAction({
      userId: newUser.id,
      action: "REGISTER",
      ipAddress: deviceInfo.ip,
      userAgent: deviceInfo.userAgent,
      requestId: deviceInfo.requestId,
      responseTime,
      status: "SUCCESS",
    });

    const { password: _, ...userInfo } = newUser;

    // Ghi log vào bảng audit_logs
    await auditService.log({
      userId: newUser.id,
      action: "register",
      tableName: "users",
      recordId: newUser.id,
      title: newUser.username,
      ipAddress: deviceInfo.ip,
      userAgent: deviceInfo.userAgent,
    });

    return { user: userInfo, tokens };
  };

  /**
   * Refresh: rotate refresh token → cấp cặp mới + Log
   */
  const refresh = async (refreshToken, deviceInfo = {}) => {
    try {
      const tokens = await tokenService.refreshTokens(refreshToken, deviceInfo);
      const jwt = await import("jsonwebtoken");
      const decoded = jwt.decode(refreshToken);
      const userId = decoded?.sub;

      if (userId) {
        const responseTime = deviceInfo.startTime ? Date.now() - deviceInfo.startTime : 0;
        accessLogRepository.logAction({
          userId: userId,
          action: "REFRESH",
          ipAddress: deviceInfo.ip,
          userAgent: deviceInfo.userAgent,
          requestId: deviceInfo.requestId,
          responseTime,
          status: "SUCCESS",
        });
      }
      return tokens;
    } catch (error) {
      const jwt = await import("jsonwebtoken");
      const decoded = jwt.decode(refreshToken);
      const userId = decoded?.sub;
      if (userId) {
        const responseTime = deviceInfo.startTime ? Date.now() - deviceInfo.startTime : 0;
        accessLogRepository.logAction({
          userId: userId,
          action: "REFRESH",
          ipAddress: deviceInfo.ip,
          userAgent: deviceInfo.userAgent,
          requestId: deviceInfo.requestId,
          responseTime,
          status: "FAILED",
          failureReason: error.message,
        });
      }
      throw error;
    }
  };

  /**
   * Logout: revoke refresh token + blacklist access token hiện tại + Log
   */
  const logout = async (refreshToken, deviceInfo = {}) => {
    const jwt = await import("jsonwebtoken");
    const decoded = jwt.decode(refreshToken);
    const userId = decoded?.sub;

    await tokenService.revokeToken(refreshToken);

    if (userId) {
      const responseTime = deviceInfo.startTime ? Date.now() - deviceInfo.startTime : 0;
      accessLogRepository.logAction({
        userId: userId,
        action: "LOGOUT",
        ipAddress: deviceInfo.ip,
        userAgent: deviceInfo.userAgent,
        requestId: deviceInfo.requestId,
        responseTime,
        status: "SUCCESS",
      });
    }
  };

  /**
   * Logout all devices: revoke ALL refresh tokens của user
   */
  /**
   * Trả về URL để redirect user sang Google OAuth consent screen
   */
  const getGoogleAuthUrl = () => {
    const { clientId, redirectUri } = appConfig.google;
    if (!clientId || !redirectUri) throw BadRequest("Google login is not configured (GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI)");
    const scope = encodeURIComponent("openid email profile");
    const state = Buffer.from(Date.now().toString()).toString("base64url");
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;
  };

  /**
   * Đổi authorization code (từ callback) lấy access_token, lấy thông tin Google user,
   * find or create user trong DB, gán role mặc định, trả về user + tokens
   */
  const loginWithGoogle = async (code, deviceInfo = {}) => {
    const { clientId, clientSecret, redirectUri } = appConfig.google;
    if (!clientId || !clientSecret) throw BadRequest("Google login is not configured");

    const tokenRes = await googleFetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      },
      "token_exchange"
    );
    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      logger.warn("[Auth] Google token exchange rejected", { status: tokenRes.status, body: body.slice(0, 500) });
      throw BadRequest(
        "Google từ chối đổi mã đăng nhập. Kiểm tra GOOGLE_CLIENT_ID/SECRET và GOOGLE_REDIRECT_URI trùng khớp Google Cloud Console (kể cả http/https và cổng)."
      );
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) throw BadRequest("Google did not return access token");

    const userInfoRes = await googleFetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `${AUTH_HEADER_BEARER_PREFIX}${accessToken}` },
    }, "userinfo");
    if (!userInfoRes.ok) throw BadRequest("Failed to fetch Google user info");
    const googleUser = await userInfoRes.json();
    const { id: googleId, email, name, picture } = googleUser;
    if (!googleId || !email) throw BadRequest("Google profile missing id or email");

    // --- KIỂM TRA WHITE-LIST ---
    // Chỉ cho phép nếu đã có account User hoặc email nằm trong danh sách Student
    const existingUserMatch = (await userRepository.findByGoogleId(googleId)) || (await userRepository.findByEmail(email));
    const studentMatch = await studentRepository.findByEmail(email);

    if (!existingUserMatch && !studentMatch) {
      throw Forbidden("Tài khoản của bạn không có trong danh sách được phép truy cập. Vui lòng liên hệ quản trị viên.");
    }
    // ---------------------------

    // --- YÊU CẦU SET PASSWORD (NẾU LÀ SINH VIÊN MỚI TỪ ROSTER) ---
    if (!existingUserMatch && studentMatch) {
      // Sinh viên có trong roster nhưng chưa có account -> Bắt buộc qua trang set password
      const setupToken = tokenService.signPayload({
        googleId,
        email,
        name: name || email,
        picture: picture || null,
        studentCode: studentMatch.student_code,
        studentId: studentMatch.id,
        type: "google_setup",
      });
      return { setup_required: true, setup_token: setupToken };
    }
    // -------------------------------------------------------------

    let user = await userRepository.findByGoogleId(googleId);
    if (user) {
      // Đã có user với google_id → cập nhật avatar & last_login_at (dùng rawQuery để tránh lỗi placeholder)
      await userRepository.rawQuery(
        "UPDATE users SET avatar_url = ?, last_login_at = ?, updated_at = ? WHERE id = ?",
        [picture || user.avatar_url, new Date(), new Date(), user.id],
      );
      user = await userRepository.findByGoogleId(googleId);
    } else {
      const existingByEmail = await userRepository.findByEmail(email);
      if (existingByEmail) {
        // Link tài khoản: user đăng ký email trước đó, gắn Google
        await userRepository.rawQuery(
          "UPDATE users SET google_id = ?, auth_provider = 'google', avatar_url = ?, last_login_at = ?, updated_at = ? WHERE id = ?",
          [
            googleId,
            picture || existingByEmail.avatar_url,
            new Date(),
            new Date(),
            existingByEmail.id,
          ],
        );
        user = await userRepository.findByGoogleId(googleId);
      } else {
        // Đây thường là Lecturer hoặc User tự do (nếu whitelist cho phép) -> tạo local account không pass
        const base = email.replace(/@.*$/, "").replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 45) || `user_${String(googleId).slice(0, 8)}`;
        let candidate = base;
        let n = 0;
        while (await userRepository.exists({ username: candidate })) {
          candidate = `${base}_${++n}`;
        }
        const newUser = await userRepository.create({
          username: candidate,
          email,
          full_name: name || email,
          password: null,
          avatar_url: picture || null,
          google_id: googleId,
          auth_provider: "google",
          status: "active",
        });
        await userRepository.assignRole(newUser.id, "student");
        user = await userRepository.findByGoogleId(googleId);
      }
    }

    // --- Đồng bộ với bảng students ---
    const student = await studentRepository.findByEmail(email);
    if (student) {
      // Liên kết Student với User
      await userRepository.rawQuery(
        "UPDATE students SET user_id = ?, status = 'active', updated_at = ? WHERE id = ?",
        [user.id, new Date(), student.id]
      );
      // Đảm bảo user có role student (nếu chưa có)
      if (!user.roles || !user.roles.includes("student")) {
        await userRepository.assignRole(user.id, "student");
      }
      // Cập nhật lại user info để phản ánh role mới (nếu có)
      user = await userRepository.findByGoogleId(googleId);
    }
    // ---------------------------------

    const tokens = await tokenService.generateTokenPair(user, deviceInfo);
    const responseTime = deviceInfo.startTime ? Date.now() - deviceInfo.startTime : 0;
    if (user?.id) {
      accessLogRepository.logAction({
        userId: user.id,
        action: "LOGIN",
        ipAddress: deviceInfo.ip,
        userAgent: deviceInfo.userAgent,
        requestId: deviceInfo.requestId,
        responseTime,
        status: "SUCCESS",
      });
    }

    const { password: _, ...userInfo } = user;
    return { user: userInfo, tokens };
  };

  /**
   * Hoàn tất thiết lập tài khoản Google cho sinh viên mới (Set password + Link MSSV)
   */
  const completeGoogleSetup = async ({ token, password }, deviceInfo = {}) => {
    const data = tokenService.verifyPayload(token);
    if (data.type !== "google_setup") throw BadRequest("Token không hợp lệ.");

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await transaction.run(async (conn) => {
      // Kiểm tra lần cuối xem email đã bị đăng ký bởi ai khác chưa (race condition)
      const [existing] = await conn.execute(
        "SELECT id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1 FOR UPDATE",
        [data.email]
      );
      if (existing.length) throw Conflict("Email đã được đăng ký.");

      // Username = student_code (MSSV)
      const username = String(data.studentCode || "").trim();
      if (!username) throw BadRequest("Không tìm thấy mã số sinh viên trong thông tin lớp học.");

      const [userIns] = await conn.execute(
        `INSERT INTO users (username, email, password, full_name, avatar_url, google_id, auth_provider, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'google', 'active', NOW(), NOW())`,
        [username, data.email, hashedPassword, data.name, data.picture, data.googleId]
      );
      const uid = userIns.insertId;

      // Gán role student
      const [[roleRow]] = await conn.execute("SELECT id FROM roles WHERE role_code = 'student' LIMIT 1");
      if (roleRow) {
        await conn.execute("INSERT IGNORE INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, NOW())", [uid, roleRow.id]);
      }

      // Link bảng students
      await conn.execute("UPDATE students SET user_id = ?, status = 'active', updated_at = NOW() WHERE id = ?", [uid, data.studentId]);

      return uid;
    });

    const user = await userRepository.findProfileById(result);
    const tokens = await tokenService.generateTokenPair(user, deviceInfo);

    const responseTime = deviceInfo.startTime ? Date.now() - deviceInfo.startTime : 0;
    if (user?.id) {
      accessLogRepository.logAction({
        userId: user.id,
        action: "REGISTER",
        ipAddress: deviceInfo.ip,
        userAgent: deviceInfo.userAgent,
        requestId: deviceInfo.requestId,
        responseTime,
        status: "SUCCESS",
      });
    }

    const { password: _, ...userInfo } = user;
    return { user: userInfo, tokens };
  };

  /**
   * Xem trước thông tin từ setup token (dùng cho frontend hiển thị tên/MSSV)
   */
  const getGoogleSetupPreview = async (token) => {
    const data = tokenService.verifyPayload(token);
    if (data.type !== "google_setup") throw BadRequest("Token không hợp lệ.");
    return {
      name: data.name,
      email: data.email,
      studentCode: data.studentCode,
      picture: data.picture,
    };
  };

  const logoutAll = async (userId, deviceInfo = {}) => {
    await tokenService.revokeAllTokens(userId);

    const responseTime = deviceInfo.startTime ? Date.now() - deviceInfo.startTime : 0;
    accessLogRepository.logAction({
      userId: userId,
      action: "LOGOUT",
      ipAddress: deviceInfo.ip,
      userAgent: deviceInfo.userAgent,
      requestId: deviceInfo.requestId,
      responseTime,
      status: "SUCCESS",
      failureReason: "Logout All Devices",
    });
  };

  /** Public: validate invite token before showing password form. */
  const getActivatePreview = async (token) => {
    const row = await inviteRepository.findByTokenWithClass(token);
    if (!row || row.used || new Date(row.expires_at) <= new Date()) {
      throw BadRequest(INVITE_INVALID);
    }
    return {
      classCode: row.class_code,
      emailMasked: maskEmail(row.email),
    };
  };

  /** Create local user, link student, mark invite used — single DB transaction. */
  const activateWithInvite = async ({ token, password }, deviceInfo = {}) => {
    const hashedPassword = await bcrypt.hash(password, 12);

    const { uid: newUserId, username: createdUsername } = await transaction.run(async (conn) => {
      const row = await inviteRepository.findByTokenForUpdate(conn, token);
      if (!row || row.used || new Date(row.expires_at) <= new Date()) {
        throw BadRequest(INVITE_INVALID);
      }
      if (row.student_user_id) throw BadRequest("Tài khoản đã được kích hoạt.");
      if (String(row.student_status) !== "pending") {
        throw BadRequest("Không thể kích hoạt với trạng thái sinh viên hiện tại.");
      }

      const [emailDup] = await conn.execute(
        "SELECT id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1 FOR UPDATE",
        [row.email]
      );
      if (emailDup.length) throw Conflict("Email đã được đăng ký.");

      // Username = MSSV (student_code) để SV đăng nhập bằng mã; hoa/thường khi đăng nhập đều được (LOWER ở findByUsername).
      const codeRaw = String(row.student_code ?? "").trim();
      const base = (codeRaw || `stu_${row.student_id}`).slice(0, 50);
      let candidate = base;
      let n = 0;
      for (;;) {
        const [urows] = await conn.execute(
          "SELECT id FROM users WHERE LOWER(TRIM(username)) = LOWER(TRIM(?)) AND deleted_at IS NULL LIMIT 1",
          [candidate]
        );
        if (!urows.length) break;
        const suffix = `_${++n}`;
        candidate = `${base.slice(0, Math.max(1, 50 - suffix.length))}${suffix}`;
      }

      const [ins] = await conn.execute(
        `INSERT INTO users (username, email, password, full_name, auth_provider, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'local', 'active', NOW(), NOW())`,
        [candidate, row.email, hashedPassword, row.student_full_name || row.email]
      );
      const uid = ins.insertId;

      const [[roleRow]] = await conn.execute("SELECT id FROM roles WHERE role_code = ? LIMIT 1", ["student"]);
      if (roleRow) {
        await conn.execute(
          "INSERT IGNORE INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, NOW())",
          [uid, roleRow.id]
        );
      }

      const [stRes] = await conn.execute(
        "UPDATE students SET user_id = ?, status = 'active', updated_at = NOW() WHERE id = ? AND user_id IS NULL",
        [uid, row.student_id]
      );
      if (stRes.affectedRows !== 1) throw Conflict("Dữ liệu sinh viên đã thay đổi; vui lòng thử lại.");

      const marked = await inviteRepository.markUsed(conn, row.id);
      if (!marked) throw BadRequest(INVITE_INVALID);

      return { uid, username: candidate };
    });

    const user = await userRepository.findByUsername(createdUsername);
    if (!user) throw BadRequest("Không tạo được tài khoản.");

    const tokens = await tokenService.generateTokenPair(user, deviceInfo);
    const responseTime = deviceInfo.startTime ? Date.now() - deviceInfo.startTime : 0;
    accessLogRepository.logAction({
      userId: user.id,
      action: "REGISTER",
      ipAddress: deviceInfo.ip,
      userAgent: deviceInfo.userAgent,
      requestId: deviceInfo.requestId,
      responseTime,
      status: "SUCCESS",
    });

    const { password: _, ...userInfo } = user;
    return { user: userInfo, tokens };
  };

  /**
   * Đổi mật khẩu người dùng
   */
  const changePassword = async (userId, { old_password, new_password }) => {
    const user = await userRepository.findById(userId);
    if (!user) throw NotFound("User");

    // 1. Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch) {
      throw BadRequest("Mật khẩu cũ không chính xác");
    }

    // 2. Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(new_password, 12);

    // 3. Cập nhật database
    await userRepository.update(userId, {
      password: hashedPassword,
      updated_at: new Date(),
    });

    // 4. Ghi log audit
    await auditService.log({
      userId,
      action: "change_password",
      tableName: "users",
      recordId: userId,
      title: "Thay đổi mật khẩu",
      oldValues: { password: "[HIDDEN]" },
      newValues: { password: "[HIDDEN]" },
    });

    return true;
  };

  const service = {
    login,
    register,
    refresh,
    logout,
    logoutAll,
    getProfile,
    updateProfile,
    changePassword,
    getGoogleAuthUrl,
    loginWithGoogle,
    completeGoogleSetup,
    getGoogleSetupPreview,
    getActivatePreview,
    activateWithInvite,
  };

  return withLogging(service, "AuthService");
};
