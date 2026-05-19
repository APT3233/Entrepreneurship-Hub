import { logger } from "app/core/logger/index.js";
import { sanitizeLogMeta } from "app/core/logger/redact.js";

const SKIP_PATHS = ["/health", "/favicon.ico"];

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip;
};

const getRequestLogMeta = (req) => {
  const meta = {
    trace_id: req.requestId,
    user_id: req.user?.id ?? req.user?.user_id ?? null,
    session_id: null,
    http_method: req.method,
    http_path: req.originalUrl,
    client_ip: getClientIp(req),
  };

  return sanitizeLogMeta(meta);
};

/**
 * Request logger middleware
 * Emits structured start/finish events without raw body, cookies, or auth headers.
 */
export const requestLogger = (req, res, next) => {
  if (SKIP_PATHS.includes(req.path)) return next();

  logger.info("HTTP request started", getRequestLogMeta(req));

  res.on("finish", () => {
    const ms = Date.now() - req.startTime;
    const logFn =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[logFn]("HTTP request completed", {
      ...getRequestLogMeta(req),
      http_status: res.statusCode,
      duration_ms: ms,
    });
  });

  next();
};
