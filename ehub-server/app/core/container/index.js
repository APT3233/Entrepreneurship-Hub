import {
  createContainer as createAwilixContainer,
  InjectionMode,
  asValue,
} from "awilix";
import { eventBus } from "app/core/events/index.js";
import { createTransactionManager } from "app/core/database/transaction.js";
import { createEmailService } from "app/core/services/email.service.js";
import { createStorageService } from "app/core/services/storage.service.js";
import { appConfig } from "app/config/app.js";

/**
 * Enterprise DI Container using Awilix — Proxy Mode
 * Tiêm db (mysql2 pool) + redis vào mỗi module bằng asValue
 */
export const createContainer = ({ db, redis, minio }) => {
  // Tạo container mới của awilix, sử dụng PROXY mode (khuyên dùng)
  const container = createAwilixContainer({
    injectionMode: InjectionMode.PROXY,
  });

  // Đăng ký các dependencies có sẵn
  container.register({
    db: asValue(db),
    redis: asValue(redis),
    minio: asValue(minio),
    eventBus: asValue(eventBus),
    transaction: asValue(createTransactionManager(db)),
    storageService: asValue(createStorageService({ minio })),
    email: asValue(
      createEmailService({
        driver:
          process.env.EMAIL_DRIVER ||
          (process.env.NODE_ENV === "production" ? "smtp" : "console"),
        enabled: appConfig.mail.enabled,
        from: appConfig.mail.from,
        smtp: appConfig.mail.smtp,
      }),
    ),
  });

  // Initialize core services
  container.resolve("storageService").init().catch(err => {
     console.error("[Container] Failed to init storageService:", err);
  });

  return container;
};
