import { optional } from "./validate.js";

const isDev = process.env.NODE_ENV !== "production";

export const loggerConfig = Object.freeze({
  level: optional("LOG_LEVEL", "info"),
  prettyPrint: isDev,
  transport: optional("LOG_TRANSPORT", "console"), // console | file | both
  file: {
    dir: optional("LOG_DIR", "logs"),
    maxSize: "20m",
    maxFiles: "14d",
    filename: "app-%DATE%.log",
  },
});
