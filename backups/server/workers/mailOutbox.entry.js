/**
 * Child process entry: outbox mail worker only (no HTTP).
 * Env must be provided by parent (e.g. shell `source .env.linux` before `node server.js`, Docker env, systemd).
 */
import { loadDatabase } from "app/loaders/database.loader.js";
import { loadRedis } from "app/loaders/redis.loader.js";
import { loadMinio } from "app/loaders/minio.loader.js";
import { loadContainer } from "app/loaders/container.loader.js";
import { registerAppModules } from "app/loaders/routes.loader.js";
import { startOutboxMailWorker } from "app/core/workers/outboxMail.worker.js";
import { appConfig } from "app/config/app.js";
import { logger } from "app/core/logger/index.js";

const main = async () => {
  const ob = appConfig.outbox;
  if (!ob.workerEnabled) {
    logger.info("[mailOutboxChild] OUTBOX_WORKER_ENABLED=false — exit");
    process.exit(0);
  }

  const [db, redis, minio] = await Promise.all([loadDatabase(), loadRedis(), loadMinio()]);
  const container = await loadContainer({ db, redis, minio });
  registerAppModules(container);
  const stopOutboxMailWorker = startOutboxMailWorker({ db, redis, container });
  logger.info("[mailOutboxChild] running (forked from API)");

  const shutdown = async (signal) => {
    logger.info(`[mailOutboxChild] ${signal} — graceful stop`);
    await stopOutboxMailWorker();
    const { destroyDatabase } = await import("app/loaders/database.loader.js");
    const { disconnectRedis } = await import("app/loaders/redis.loader.js");
    await Promise.allSettled([destroyDatabase(), disconnectRedis()]);
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

main().catch((err) => {
  logger.fatal({ err }, "[mailOutboxChild] fatal");
  process.exit(1);
});
