import "app/core/utils/timezone.js";
import { bootstrap } from "app/loaders/index.js";
import { appConfig } from "app/config/app.js";
import { logger } from "app/core/logger/index.js";

const start = async () => {
  const { app, stopOutboxMailWorker, stopAiEvaluationWorker } = await bootstrap();

  const server = app.listen(appConfig.port, appConfig.host, () => {
    logger.info(
      `🚀 ${appConfig.name} running → http://${appConfig.host}:${appConfig.port}`,
    );
    logger.info(`📋 Environment: ${process.env.NODE_ENV ?? "development"}`);
  });

  // graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);

    server.close(async () => {
      if (typeof stopOutboxMailWorker === "function") await stopOutboxMailWorker();
      if (typeof stopAiEvaluationWorker === "function") await stopAiEvaluationWorker();
      const { destroyDatabase } = await import("app/loaders/database.loader.js");
      const { disconnectRedis } = await import("app/loaders/redis.loader.js");

      await Promise.allSettled([destroyDatabase(), disconnectRedis()]);

      logger.info("👋 All connections closed");
      process.exit(0);
    });

    // force kill after 10s
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.fatal({ err: reason }, "Unhandled Rejection");
    process.exit(1);
  });

  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught Exception");
    process.exit(1);
  });
};

start();
