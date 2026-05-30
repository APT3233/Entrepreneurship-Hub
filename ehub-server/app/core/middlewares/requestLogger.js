import { logger } from "app/core/logger/index.js";
import { sanitizeLogMeta } from "app/core/logger/redact.js";
import { getPool } from "app/loaders/database.loader.js";

const SKIP_PATHS = ["/health", "/favicon.ico", "/api/v1/admin/logs/api-access", "/api/v1/auth/me", "/api/v1/auth/refresh-token"];

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
    user_id: req.user?.id ?? req.user?.user_id ?? req.userId ?? null,
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
 * Also logs all API access requests to the api_access_logs database table for full auditable tracing.
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

    // Write to api_access_logs table in database to allow full tracing
    try {
      const pool = getPool();
      const sql = `
        INSERT INTO api_access_logs 
        (request_id, method, path, ip_address, user_id, status_code, response_time, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      pool.execute(sql, [
        req.requestId || null,
        req.method,
        req.originalUrl ? req.originalUrl.substring(0, 500) : req.path.substring(0, 500),
        getClientIp(req)?.substring(0, 45) || null,
        req.user?.id ?? req.user?.user_id ?? req.userId ?? null,
        res.statusCode,
        ms,
        req.headers["user-agent"] ? req.headers["user-agent"].substring(0, 1000) : null,
      ]).catch((err) => {
        logger.error("[RequestLogger] Failed to write API access log to database", err);
      });
    } catch (dbErr) {
      logger.error("[RequestLogger] Failed to get database pool for access log", dbErr);
    }
  });

  next();
};
