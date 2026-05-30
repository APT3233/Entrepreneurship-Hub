import jwt from "jsonwebtoken";
import { jwtConfig } from "app/config/index.js";
import {
  TokenExpired,
  TokenInvalid,
  Forbidden,
  AccountLocked,
} from "../errors/errorFactory.js";
import { hasMinRole } from "../constants/roles.js";
import { blacklistKey } from "../cache/keys.js";
import {
  AUTH_COOKIE_ACCESS_TOKEN,
  AUTH_HEADER_BEARER_PREFIX,
} from "../constants/authHttp.js";

/**
 * authenticate middleware — factory version
 * Có 2 chế độ:
 *  1. Stateless (không cần redis) — verify JWT chỉ bằng signature
 *  2. Smart (có redis) — verify JWT + check blacklist trong Redis
 *
 * Khi bootstrap, container/redis có thể chưa sẵn sàng → dùng stateless.
 * Sau khi container loaded, gọi setRedis(redis) để bật smart mode.
 */
let _redis = null;
/** @type {((userId: number) => Promise<string|null>)|null} */
let _loadUserStatus = null;

/**
 * Gọi hàm này sau khi DI container loaded để bật check blacklist
 */
export const setAuthRedis = (redis) => {
  _redis = redis;
};

/** Gọi sau bootstrap để kiểm tra users.status trên mọi request có JWT. */
export const setAuthUserStatusLoader = (loader) => {
  _loadUserStatus = loader;
};

const assertRequestUserStatus = async (userId) => {
  if (!_loadUserStatus || !userId) return;
  const status = String(await _loadUserStatus(userId) || "active").toLowerCase();
  if (status === "locked") throw AccountLocked();
  if (status === "inactive") {
    throw Forbidden("Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
  }
};

/**
 * Verify JWT access token — async để hỗ trợ Redis blacklist check
 */
export const authenticate = async (req, _res, next) => {
  // 1. Try Authorization header first (Bearer token)
  // 2. Fall back to access_token cookie (httpOnly)
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader?.startsWith(AUTH_HEADER_BEARER_PREFIX)) {
    token = authHeader.slice(AUTH_HEADER_BEARER_PREFIX.length);
  } else if (req.cookies?.[AUTH_COOKIE_ACCESS_TOKEN]) {
    token = req.cookies[AUTH_COOKIE_ACCESS_TOKEN];
  }

  if (!token) return next(TokenInvalid());

  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      algorithms: [jwtConfig.algorithm],
    });

    // Check blacklist nếu Redis đã sẵn sàng
    if (_redis && decoded.jti) {
      const isBlacklisted = await _redis.get(blacklistKey(decoded.jti));
      if (isBlacklisted) return next(TokenInvalid());
    }

    await assertRequestUserStatus(decoded.sub);

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      roles: decoded.roles || [],
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") return next(TokenExpired());
    if (err.isOperational) return next(err); // re-throw AppError from blacklist check
    next(TokenInvalid());
  }
};

/** Optional auth: populate req.user if token present, never fail (for routes supporting lecturerScope=mine) */
export const optionalAuthenticate = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader?.startsWith(AUTH_HEADER_BEARER_PREFIX))
    token = authHeader.slice(AUTH_HEADER_BEARER_PREFIX.length);
  else if (req.cookies?.[AUTH_COOKIE_ACCESS_TOKEN])
    token = req.cookies[AUTH_COOKIE_ACCESS_TOKEN];
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, jwtConfig.secret, { issuer: jwtConfig.issuer, algorithms: [jwtConfig.algorithm] });
    if (_redis && decoded.jti) {
      const isBlacklisted = await _redis.get(blacklistKey(decoded.jti));
      if (isBlacklisted) return next();
    }
    req.user = { id: decoded.sub, email: decoded.email, roles: decoded.roles || [] };
  } catch (_) { /* ignore */ }
  next();
};

/**
 * Role-based authorization
 * authorize('admin') — user phải có role >= admin
 */
export const authorize = (requiredRole) => (req, _res, next) => {
  if (!req.user) return next(TokenInvalid());
  const userRoles = req.user.roles || [];
  const hasPermission = userRoles.some(role => hasMinRole(role, requiredRole));
  if (!hasPermission) {
    return next(Forbidden("Insufficient permissions"));
  }
  next();
};
