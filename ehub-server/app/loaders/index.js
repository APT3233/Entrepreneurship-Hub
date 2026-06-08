import express from "express";
import { loadExpress, loadErrorHandlers } from "./express.loader.js";
import { loadDatabase } from "./database.loader.js";
import { loadRedis } from "./redis.loader.js";
import { loadMinio } from "./minio.loader.js";
import { loadRoutes } from "./routes.loader.js";
import { loadContainer } from "./container.loader.js";
import { setAuthRedis, setAuthUserStatusLoader } from "app/core/middlewares/authMiddleware.js";
import { logger } from "app/core/logger/index.js";
import { appConfig } from "app/config/app.js";
import { aiConfig } from "app/config/ai.js";
import { closeAiEvaluationQueue } from "app/core/queues/aiEvaluation.queue.js";
import { startOutboxMailWorker } from "app/core/workers/outboxMail.worker.js";
import { forkMailOutboxWorker } from "app/workers/forkMailOutboxWorker.js";
import { startUploadCleanupWorker } from "../core/workers/uploadCleanup.worker.js";
import { startAiEvaluationWorker } from "app/workers/aiEvaluation.worker.js";
import dns from "node:dns";

export const bootstrap = async () => {
  dns.setDefaultResultOrder("ipv4first");

  const app = express();

  // Express middlewares
  loadExpress(app);

  // Infra services (parallel)
  const [db, redis, minio] = await Promise.all([loadDatabase(), loadRedis(), loadMinio()]);

  // DI Container
  const container = await loadContainer({ db, redis, minio });
  logger.info("[Bootstrap] DI container oke");

  setAuthRedis(redis);
  setAuthUserStatusLoader(async (userId) => {
    const user = await container.cradle.userRepository.findById(userId);
    return user?.status || null;
  });

  // Routes
  loadRoutes(app, container);

  const ob = appConfig.outbox;
  let stopOutboxMailWorker = async () => {};
  if (ob.workerEnabled && ob.workerInApi) {
    stopOutboxMailWorker = startOutboxMailWorker({ db, redis, container });
  } else if (ob.workerEnabled && !ob.workerInApi) {
    stopOutboxMailWorker = forkMailOutboxWorker();
  }

  // Start upload cleanup worker
  const stopUploadCleanupWorker = startUploadCleanupWorker({ db, minio, container });
  let stopAiEvaluationWorker = closeAiEvaluationQueue;
  if (aiConfig.worker.enabled) {
    const stopWorker = startAiEvaluationWorker({ container });
    stopAiEvaluationWorker = async () => {
      await Promise.allSettled([stopWorker(), closeAiEvaluationQueue()]);
    };
  }

  // Error handlers
  loadErrorHandlers(app);

  logger.info("[Bootstrap] App oke");

  return { app, db, redis, minio, container, stopOutboxMailWorker, stopUploadCleanupWorker, stopAiEvaluationWorker };
};
