import { logger } from "app/core/logger/index.js";

const SENSITIVE_FIELDS = ["password", "token", "secret", "authorization"];
const SKIP_PATHS = ["/health", "/favicon.ico"];
/**
 * Mask sensitive fields in an object before logging
 */
const maskSensitive = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitive);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      SENSITIVE_FIELDS.some((f) => k.toLowerCase().includes(f))
        ? "***"
        : maskSensitive(v),
    ]),
  );
};

/**
 * Request logger middleware
 * Logs on every incoming request and on response finish.
 *
 * Example output:
 *   → POST /api/v1/auth/login  body:{email:"a@b.com",password:"***"}  cookies:{refresh_token:"***"}
 *   ← POST /api/v1/auth/login  200  45ms
 */
export const requestLogger = (req, res, next) => {
  if (SKIP_PATHS.includes(req.path)) return next();
  const rid = req.requestId;
  const { method, originalUrl, body, cookies, headers } = req;

  // Log incoming request
  const meta = { requestId: rid };
  if (body && Object.keys(body).length) meta.body = maskSensitive(body);
  if (cookies && Object.keys(cookies).length)
    meta.cookies = maskSensitive(cookies);

  const authHeader = headers.authorization;
  if (authHeader)
    meta.auth = authHeader.startsWith("Bearer ") ? "Bearer ***" : "***";

  logger.info(`→ ${method} ${originalUrl}`, meta);

  const startTime = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - req.startTime;
    const logFn =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[logFn](`← ${method} ${originalUrl}  ${res.statusCode}  ${ms}ms`, {
      requestId: rid,
    });
  });

  next();
};
