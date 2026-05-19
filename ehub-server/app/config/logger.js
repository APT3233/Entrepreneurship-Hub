import { optional } from "./validate.js";

const isDev = process.env.NODE_ENV !== "production";

export const loggerConfig = Object.freeze({
  level: optional("LOG_LEVEL", "info"),
  service: optional("LOG_SERVICE", "ehub-server"),
  format: optional("LOG_FORMAT", "json"), // json | pretty
  prettyPrint: optional("LOG_FORMAT", "json") === "pretty",
  includeStack: optional("LOG_ERROR_STACK", isDev ? "true" : "false") === "true",
  transport: optional("LOG_TRANSPORT", "console"), // console | file | both
  file: {
    dir: optional("LOG_DIR", "logs"),
    maxSize: "20m",
    maxFiles: "14d",
    filename: "app-%DATE%.log",
  },
});
