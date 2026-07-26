import "app/core/utils/timezone.js";
import { loadDatabase, destroyDatabase } from "app/loaders/database.loader.js";
import { loadRedis, disconnectRedis } from "app/loaders/redis.loader.js";
import { loadMinio } from "app/loaders/minio.loader.js";
import { loadContainer } from "app/loaders/container.loader.js";
import { registerAppModules } from "app/loaders/routes.loader.js";
import { aiConfig } from "app/config/ai.js";
import { logger } from "app/core/logger/index.js";
import { closeAiEvaluationQueue } from "app/core/queues/aiEvaluation.queue.js";
import { startAiEvaluationWorker } from "./aiEvaluation.worker.js";

const main = async () => {
  if (!aiConfig.worker.enabled) {
    logger.info("[AiEvaluationWorkerEntry] AI_WORKER_ENABLED=false — exit");
    process.exit(0);
  }

  const [db, redis, minio] = await Promise.all([loadDatabase(), loadRedis(), loadMinio()]);
  const container = await loadContainer({ db, redis, minio });
  registerAppModules(container);

  const stopWorker = startAiEvaluationWorker({ container });
  logger.info("[AiEvaluationWorkerEntry] running");

  const shutdown = async (signal) => {
    logger.info(`[AiEvaluationWorkerEntry] ${signal} — graceful stop`);
    await Promise.allSettled([stopWorker(), closeAiEvaluationQueue()]);
    await Promise.allSettled([destroyDatabase(), disconnectRedis()]);
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

main().catch((err) => {
  logger.fatal({ err }, "[AiEvaluationWorkerEntry] fatal");
  process.exit(1);
});
