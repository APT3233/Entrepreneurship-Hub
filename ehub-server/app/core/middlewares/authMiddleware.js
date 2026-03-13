import jwt from "jsonwebtoken";
import { jwtConfig } from "app/config/index.js";
import {
  TokenExpired,
  TokenInvalid,
  Forbidden,
} from "../errors/errorFactory.js";
import { hasMinRole } from "../constants/roles.js";
import { blacklistKey } from "../cache/keys.js";

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

/**
 * Gọi hàm này sau khi DI container loaded để bật check blacklist
 */
export const setAuthRedis = (redis) => {
  _redis = redis;
};

/**
 * Verify JWT access token — async để hỗ trợ Redis blacklist check
 */
export const authenticate = async (req, _res, next) => {
  // 1. Try Authorization header first (Bearer token)
  // 2. Fall back to access_token cookie (httpOnly)
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
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
  if (authHeader?.startsWith("Bearer ")) token = authHeader.slice(7);
  else if (req.cookies?.access_token) token = req.cookies.access_token;
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
