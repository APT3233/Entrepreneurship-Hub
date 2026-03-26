import express from "express";
import { loadExpress, loadErrorHandlers } from "./express.loader.js";
import { loadDatabase } from "./database.loader.js";
import { loadRedis } from "./redis.loader.js";
import { loadMinio } from "./minio.loader.js";
import { loadRoutes } from "./routes.loader.js";
import { loadContainer } from "./container.loader.js";
import { setAuthRedis } from "app/core/middlewares/authMiddleware.js";
import { logger } from "app/core/logger/index.js";

export const bootstrap = async () => {
  const app = express();

  // Express middlewares
  loadExpress(app);

  // Infra services (parallel)
  const [db, redis, minio] = await Promise.all([loadDatabase(), loadRedis(), loadMinio()]);

  // DI Container
  const container = await loadContainer({ db, redis, minio });
  logger.info("[Bootstrap] DI container oke");

  setAuthRedis(redis);

  // Routes
  loadRoutes(app, container);

  // Error handlers
  loadErrorHandlers(app);

  logger.info("[Bootstrap] App oke");

  return { app, db, redis, minio, container };
};
