import bcrypt from "bcryptjs";
import {
  InvalidCredentials,
  AlreadyExists,
  BadRequest,
} from "app/core/errors/errorFactory.js";
import { withLogging } from "app/core/services/baseService.js";
import { appConfig } from "app/config/app.js";

/**
 * Auth Service — xử lý business logic: login, register, refresh, logout
 * Tuân thủ SRP: chỉ orchestrate, delegate token logic cho tokenService
 */
export const createAuthService = ({
  userRepository,
  tokenService,
  accessLogRepository,
}) => {
  /**
   * Login: verify credentials → generate token pair + Log
   */
  const login = async ({ username, password }, deviceInfo = {}) => {
    const user = await userRepository.findByUsername(username);
    if (!user) throw InvalidCredentials("Username or password incorrect");

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

    const { password: _, ...userInfo } = user;
    return { user: userInfo, tokens };
  };

  /**
   * Register: validate uniqueness → hash password → create user → auto-login + Log
   */
  const register = async (data, deviceInfo = {}) => {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw AlreadyExists("User with this email");

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

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw BadRequest("Google token exchange failed");
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) throw BadRequest("Google did not return access token");

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userInfoRes.ok) throw BadRequest("Failed to fetch Google user info");
    const googleUser = await userInfoRes.json();
    const { id: googleId, email, name, picture } = googleUser;
    if (!googleId || !email) throw BadRequest("Google profile missing id or email");

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

    const { password: _, ...userInfo } = user;
    return { user: userInfo, tokens };
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

  const service = { login, register, refresh, logout, logoutAll, getGoogleAuthUrl, loginWithGoogle };

  return withLogging(service, "AuthService");
};
