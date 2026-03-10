import { appConfig } from "./app.js";
import { dbConfig } from "./database.js";
import { redisConfig } from "./redis.js";
import { jwtConfig } from "./jwt.js";
import { loggerConfig } from "./logger.js";
import { storageConfig } from "./storage.js";
import { mailConfig } from "./mail.js";

const env = process.env.NODE_ENV ?? "development";

export const pctu_config = Object.freeze({
  env,
  isDev: env === "development",
  isProd: env === "production",
  isTest: env === "test",
  app: appConfig,
  db: dbConfig,
  redis: redisConfig,
  jwt: jwtConfig,
  logger: loggerConfig,
  storage: storageConfig,
  mail: mailConfig,
});

export { appConfig, dbConfig, redisConfig };
export { jwtConfig, loggerConfig, storageConfig, mailConfig };
