import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { appConfig } from "app/config/index.js";
import { requestContext } from "app/core/middlewares/requestContext.js";
import { requestLogger } from "app/core/middlewares/requestLogger.js";
import {
  errorHandler,
  notFoundHandler,
} from "app/core/middlewares/errorHandler.js";

export const loadExpress = (app) => {
  // security
  app.use(helmet());
  app.use(cors({ origin: appConfig.corsOrigins, credentials: true }));

  // parsing
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // request id + timing
  app.use(requestContext);

  // health check
  app.get("/health", (_req, res) =>
    res.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }),
  );

  // request/response logging
  app.use(requestLogger);

  // gzip
  app.use(compression());

  return app;
};

export const loadErrorHandlers = (app) => {
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
