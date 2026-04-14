import { optional, toInt, toList, toBool } from "./validate.js";

export const appConfig = Object.freeze({
  name: optional("APP_NAME", "ims-server"),
  port: toInt(optional("PORT", "7777"), 7777),
  host: optional("HOST", "0.0.0.0"),
  apiPrefix: optional("API_PREFIX", "/api/v1"),
  corsOrigins: toList(process.env.CORS_ORIGINS, ["*"]),
  rateLimit: {
    windowMs: toInt(optional("RATE_LIMIT_WINDOW_MS", "900000"), 900_000),
    max: toInt(optional("RATE_LIMIT_MAX", "100"), 100),
  },
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  },
  cookieDomain: optional("COOKIE_DOMAIN", ""),
  google: {
    clientId: optional("GOOGLE_CLIENT_ID", ""),
    clientSecret: optional("GOOGLE_CLIENT_SECRET", ""),
    redirectUri: optional(
      "GOOGLE_REDIRECT_URI",
      `http://localhost:${toInt(optional("PORT", "7777"), 7777)}${optional("API_PREFIX", "/api/v1")}/auth/authorize/google`
    ),
    frontendUrl: optional("FRONTEND_URL", "http://localhost:5173"),
  },
  invite: {
    expiryDays: toInt(optional("INVITE_EXPIRY_DAYS", "7"), 7),
  },
  mail: {
    enabled: toBool(optional("MAIL_ENABLED", "true"), true),
    from: optional("MAIL_FROM", "noreply@ehub.edu.vn"),
    smtp: {
      host: optional("SMTP_HOST", ""),
      port: toInt(optional("SMTP_PORT", "587"), 587),
      secure: toBool(optional("SMTP_SECURE", "false"), false),
      user: optional("SMTP_USER", ""),
      pass: optional("SMTP_PASS", ""),
      pool: toBool(optional("SMTP_POOL", "true"), true),
      maxConnections: toInt(optional("SMTP_MAX_CONNECTIONS", "5"), 5),
      maxMessages: toInt(optional("SMTP_MAX_MESSAGES", "100"), 100),
    },
  },
  outbox: {
    workerEnabled: toBool(optional("OUTBOX_WORKER_ENABLED", "true"), true),
    workerInApi: toBool(optional("OUTBOX_WORKER_IN_API", "true"), true),
    pollMs: toInt(optional("OUTBOX_POLL_MS", "1000"), 1000),
    maxRowsPerTick: toInt(optional("OUTBOX_MAX_ROWS_PER_TICK", "5"), 5),
    staleProcessingMinutes: toInt(optional("OUTBOX_STALE_PROCESSING_MINUTES", "15"), 15),
    maxAttemptsPerInvite: toInt(optional("MAIL_INVITE_MAX_ATTEMPTS", "5"), 5),
    mailInviteConcurrency: toInt(optional("MAIL_INVITE_CONCURRENCY", "10"), 10),
    workerShutdownGraceMs: toInt(optional("OUTBOX_WORKER_SHUTDOWN_GRACE_MS", "25000"), 25_000),
    inviteChunkSize: Math.min(500, Math.max(1, toInt(optional("OUTBOX_INVITE_CHUNK_SIZE", "75"), 75))),
    redisPollLockTtlSec: toInt(optional("OUTBOX_REDIS_POLL_LOCK_TTL_SEC", "90"), 90),
  },
});
