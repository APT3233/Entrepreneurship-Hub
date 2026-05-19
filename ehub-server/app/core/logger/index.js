import { createLogger, format, transports } from "winston";
import { loggerConfig } from "app/config/logger.js";
import fs from "fs";
import path from "path";
import { AsyncLocalStorage } from "node:async_hooks";
import { getLocalDateString } from "app/core/utils/time.js";
import { sanitizeLogMeta, serializeError } from "./redact.js";

export const loggerContext = new AsyncLocalStorage();
export const getLoggerContext = () => loggerContext.getStore() || {};

// Đảm bảo thư mục log tồn tại
if (loggerConfig.transport === "file" || loggerConfig.transport === "both") {
  if (!fs.existsSync(loggerConfig.file.dir)) {
    fs.mkdirSync(loggerConfig.file.dir, { recursive: true });
  }
}

const dateStr = getLocalDateString();
const logFileName = loggerConfig.file.filename.replace("%DATE%", dateStr);
const logFilePath = path.join(loggerConfig.file.dir, logFileName);

const addContextFormat = format((info) => {
  const ctx = getLoggerContext();
  return { ...ctx, ...info };
});

const normalizeJsonFormat = format((info) => {
  const { requestId, err, error, stack, ...rest } = info;
  const normalized = {
    ...rest,
    level: String(info.level).toUpperCase(),
    service: loggerConfig.service,
  };

  if (requestId && !normalized.trace_id) normalized.trace_id = requestId;

  const errorSource = err instanceof Error ? err : error instanceof Error ? error : null;
  if (errorSource) {
    Object.assign(
      normalized,
      serializeError(errorSource, { includeStack: loggerConfig.includeStack }),
    );
  } else if (stack && loggerConfig.includeStack) {
    normalized.error_stack = stack;
  }

  return sanitizeLogMeta(normalized);
});

const baseFormat = format.combine(
  addContextFormat(),
  format.timestamp({ format: "HH:mm:ss" }),
  format.errors({ stack: true }),
  format.printf((info) => {
    const { timestamp, level, message, err, stack, ...meta } = info;

    const msg = typeof message === "object" ? JSON.stringify(message) : message;

    const errorDetail = stack || (err && (err.stack || err.message)) || "";
    const errStr = errorDetail ? `\n${errorDetail}` : "";

    const metaStr = Object.keys(meta).length
      ? ` | meta: ${JSON.stringify(meta)}`
      : "";

    return `${timestamp} [${level}]: ${msg}${errStr}${metaStr}`;
  }),
);

const prodFormat = format.combine(
  addContextFormat(),
  format.timestamp(),
  format.errors({ stack: true }),
  normalizeJsonFormat(),
  format.json(),
);

const appTransports = [
  new transports.Console({
    format: loggerConfig.prettyPrint
      ? format.combine(format.colorize(), baseFormat)
      : prodFormat,
  }),
];

if (
  loggerConfig.transport === "file" ||
  loggerConfig.transport === "both" ||
  process.env.LOG_TRANSPORT === "file"
) {
  appTransports.push(
    new transports.File({
      filename: logFilePath,
      format: loggerConfig.prettyPrint ? baseFormat : prodFormat,
    }),
  );
}

export const logger = createLogger({
  level: loggerConfig.level,
  transports: appTransports,
});

const normalizeLogArgs = (messageOrMeta, metaOrMessage = {}) => {
  if (messageOrMeta instanceof Error) {
    return { message: messageOrMeta.message, meta: { err: messageOrMeta } };
  }

  if (
    messageOrMeta &&
    typeof messageOrMeta === "object" &&
    typeof metaOrMessage === "string"
  ) {
    return { message: metaOrMessage, meta: messageOrMeta };
  }

  if (typeof messageOrMeta === "string") {
    return {
      message: messageOrMeta,
      meta:
        metaOrMessage instanceof Error
          ? { err: metaOrMessage }
          : metaOrMessage && typeof metaOrMessage === "object"
            ? metaOrMessage
            : {},
    };
  }

  if (messageOrMeta && typeof messageOrMeta === "object") {
    return {
      message: messageOrMeta.message ?? "Log event",
      meta: messageOrMeta,
    };
  }

  return { message: String(messageOrMeta), meta: {} };
};

const rawLog = logger.log.bind(logger);
const logWithNormalizedArgs = (level, messageOrMeta, metaOrMessage) => {
  const { message, meta } = normalizeLogArgs(messageOrMeta, metaOrMessage);
  rawLog(level, message, meta);
};

for (const level of ["error", "warn", "info", "debug"]) {
  logger[level] = (messageOrMeta, metaOrMessage) =>
    logWithNormalizedArgs(level, messageOrMeta, metaOrMessage);
}

logger.fatal = (messageOrMeta, metaOrMessage = {}) => {
  const { message, meta } = normalizeLogArgs(messageOrMeta, metaOrMessage);
  logWithNormalizedArgs("error", message, { ...meta, fatal: true });
};

export const createAppLogger = (moduleName) => ({
  info: (msg, meta = {}) => logger.info(`[${moduleName}] ${msg}`, meta),
  warn: (msg, meta = {}) => logger.warn(`[${moduleName}] ${msg}`, meta),
  error: (msg, meta = {}) => logger.error(`[${moduleName}] ${msg}`, meta),
  debug: (msg, meta = {}) => logger.debug(`[${moduleName}] ${msg}`, meta),
  fatal: (msg, meta = {}) => logger.fatal(`[${moduleName}] ${msg}`, meta),
});
