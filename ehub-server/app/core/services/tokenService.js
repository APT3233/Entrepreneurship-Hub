import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { jwtConfig } from "app/config/index.js";
import {
  refreshTokenKey,
  refreshTokenPattern,
  blacklistKey,
} from "../cache/keys.js";
import { TokenExpired, TokenInvalid } from "../errors/errorFactory.js";

/**
 * Token Service — Single Responsibility: chỉ quản lý JWT + Redis token lifecycle
 */
export const createTokenService = ({ redis }) => {
  // ── Helpers ────────────────────────────────────────────

  const parseExpiry = (expiresIn) => {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const value = Number(match[1]);
    const unit = match[2];
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * (multipliers[unit] || 60);
  };

  const accessTTL = parseExpiry(jwtConfig.expiresIn);
  const refreshTTL = parseExpiry(jwtConfig.refreshIn);

  /**
   * Tạo sha256 hash từ IP và User-Agent để chống trộm token (Device Binding)
   */
  const generateFingerprint = (ip, userAgent) => {
    if (!ip || !userAgent) return null;
    return crypto
      .createHash("sha256")
      .update(`${ip}|${userAgent}`)
      .digest("hex");
  };

  // ── Core Methods ───────────────────────────────────────

  /**
   * Tạo cặp access + refresh token cho user
   * @param {{ id, email, role }} user
   * @param {{ ip, userAgent }} fingerprintParams
   */
  const generateTokenPair = async (user, fingerprintParams = {}) => {
    const jti = uuidv4();
    const tokenId = uuidv4();
    const fingerprintHash = generateFingerprint(
      fingerprintParams.ip,
      fingerprintParams.userAgent,
    );

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles || [],
    };

    const accessToken = jwt.sign({ ...payload, jti }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
      issuer: jwtConfig.issuer,
      algorithm: jwtConfig.algorithm,
    });

    const refreshToken = jwt.sign(
      { ...payload, jti: tokenId, type: "refresh" },
      jwtConfig.refreshSecret,
      {
        expiresIn: jwtConfig.refreshIn,
        issuer: jwtConfig.issuer,
        algorithm: jwtConfig.algorithm,
      },
    );

    const key = refreshTokenKey(user.id, tokenId);
    await redis.set(
      key,
      JSON.stringify({
        userId: user.id,
        email: user.email,
        roles: user.roles || [],
        jti,
        fingerprintHash,
        createdAt: Date.now(),
      }),
      "EX",
      refreshTTL,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTTL,
    };
  };

  /**
   * Refresh: verify refresh token → revoke cũ → cấp cặp mới
   */
  const refreshTokens = async (token, currentFingerprintParams = {}) => {
    let decoded;
    try {
      decoded = jwt.verify(token, jwtConfig.refreshSecret, {
        issuer: jwtConfig.issuer,
        algorithms: [jwtConfig.algorithm],
      });
    } catch (err) {
      if (err.name === "TokenExpiredError") throw TokenExpired();
      throw TokenInvalid();
    }

    if (decoded.type !== "refresh") throw TokenInvalid();

    const tokenId = decoded.jti;
    const userId = decoded.sub;

    const key = refreshTokenKey(userId, tokenId);
    const stored = await redis.get(key);

    if (!stored) {
      // Reuse detection
      await revokeAllTokens(userId);
      throw TokenInvalid();
    }

    const data = JSON.parse(stored);

    // --- Fingerprint Verification ---
    const currentHash = generateFingerprint(
      currentFingerprintParams.ip,
      currentFingerprintParams.userAgent,
    );
    if (
      data.fingerprintHash &&
      currentHash &&
      data.fingerprintHash !== currentHash
    ) {
      // Bị trộm token sang máy khác!
      console.warn(
        `[Security] Fingerprint mismatch for user ${userId}. Revoking all tokens.`,
      );
      await revokeAllTokens(userId);
      throw TokenInvalid(
        "Thiết bị không hợp lệ hoặc phiên đăng nhập đã bị đánh cắp.",
      );
    }

    // Xóa RT cũ
    await redis.del(key);

    if (data.jti) {
      await blacklistAccessToken(data.jti);
    }

    return generateTokenPair(
      {
        id: userId,
        email: decoded.email,
        roles: decoded.roles || [],
      },
      currentFingerprintParams,
    );
  };

  /**
   * Revoke một refresh token cụ thể + blacklist access token tương ứng
   */
  const revokeToken = async (token) => {
    let decoded;
    try {
      decoded = jwt.verify(token, jwtConfig.refreshSecret, {
        issuer: jwtConfig.issuer,
        algorithms: [jwtConfig.algorithm],
        ignoreExpiration: true, // cho phép revoke cả token đã hết hạn
      });
    } catch {
      return; // token invalid → bỏ qua, coi như đã revoke
    }

    if (decoded.type !== "refresh") return;

    const key = refreshTokenKey(decoded.sub, decoded.jti);
    const stored = await redis.get(key);

    if (stored) {
      const data = JSON.parse(stored);
      await redis.del(key);

      // Blacklist access token tương ứng
      if (data.jti) {
        await blacklistAccessToken(data.jti);
      }
    }
  };

  /**
   * Revoke ALL refresh tokens của user (đổi mật khẩu, bị hack, etc.)
   */
  const revokeAllTokens = async (userId) => {
    const pattern = refreshTokenPattern(userId);
    let cursor = "0";

    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );
      cursor = nextCursor;

      if (keys.length) {
        // Lấy data để blacklist access tokens
        const pipeline = redis.pipeline();
        keys.forEach((k) => pipeline.get(k));
        const results = await pipeline.exec();

        // Blacklist tất cả access tokens tương ứng
        const blacklistPipeline = redis.pipeline();
        for (const [err, val] of results) {
          if (!err && val) {
            try {
              const data = JSON.parse(val);
              if (data.jti) {
                blacklistPipeline.set(
                  blacklistKey(data.jti),
                  "1",
                  "EX",
                  accessTTL,
                );
              }
            } catch {
              /* ignore parse errors */
            }
          }
        }
        await blacklistPipeline.exec();

        // Xóa tất cả refresh tokens
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  };

  /**
   * Blacklist một access token (đặt TTL = thời gian còn lại của access token)
   */
  const blacklistAccessToken = async (jti) => {
    await redis.set(blacklistKey(jti), "1", "EX", accessTTL);
  };

  /**
   * Kiểm tra access token có bị blacklist không
   */
  const isBlacklisted = async (jti) => {
    const result = await redis.get(blacklistKey(jti));
    return result !== null;
  };

  /**
   * Verify access token + check blacklist
   */
  const verifyAccessToken = async (token) => {
    let decoded;
    try {
      decoded = jwt.verify(token, jwtConfig.secret, {
        issuer: jwtConfig.issuer,
        algorithms: [jwtConfig.algorithm],
      });
    } catch (err) {
      if (err.name === "TokenExpiredError") throw TokenExpired();
      throw TokenInvalid();
    }

    // Check blacklist
    if (decoded.jti && (await isBlacklisted(decoded.jti))) {
      throw TokenInvalid();
    }

    return decoded;
  };

  /**
   * Ký một payload bất kỳ với thời hạn ngắn (dùng cho setup password, etc.)
   */
  const signPayload = (payload, expiresIn = "15m") => {
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn,
      issuer: jwtConfig.issuer,
    });
  };

  /**
   * Verify một payload
   */
  const verifyPayload = (token) => {
    try {
      return jwt.verify(token, jwtConfig.secret, {
        issuer: jwtConfig.issuer,
      });
    } catch (err) {
      if (err.name === "TokenExpiredError") throw TokenExpired("Liên kết đã hết hạn.");
      throw TokenInvalid("Liên kết không hợp lệ.");
    }
  };

  return {
    generateTokenPair,
    refreshTokens,
    revokeToken,
    revokeAllTokens,
    verifyAccessToken,
    isBlacklisted,
    signPayload,
    verifyPayload,
  };
};
