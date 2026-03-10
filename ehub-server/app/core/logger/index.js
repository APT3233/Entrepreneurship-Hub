import { createLogger, format, transports } from "winston";
import { loggerConfig } from "app/config/logger.js";
import fs from "fs";
import path from "path";
import { AsyncLocalStorage } from "node:async_hooks";
import { getLocalDateString } from "app/core/utils/time.js";

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
  format.timestamp(),
  format.errors({ stack: true }),
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

logger.fatal = (message, meta = {}) => {
  logger.error(`[FATAL] ${message}`, meta);
};

export const createAppLogger = (moduleName) => ({
  info: (msg, meta = {}) => logger.info(`[${moduleName}] ${msg}`, meta),
  warn: (msg, meta = {}) => logger.warn(`[${moduleName}] ${msg}`, meta),
  error: (msg, meta = {}) => logger.error(`[${moduleName}] ${msg}`, meta),
  debug: (msg, meta = {}) => logger.debug(`[${moduleName}] ${msg}`, meta),
  fatal: (msg, meta = {}) => logger.fatal(`[${moduleName}] ${msg}`, meta),
});
