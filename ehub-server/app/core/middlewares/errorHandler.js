import { logger } from "app/core/logger/index.js";

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode ?? 500;
  const isDev = process.env.NODE_ENV !== "production";

  // chỉ log 500+ errors hoặc non-operational, hoặc lỗi validation để debug
  if (statusCode >= 500 || statusCode === 400 || !err.isOperational) {
    logger.error(`${err.message} (${statusCode})`, {
      err,
      details: err.details,
      req: { method: req.method, url: req.originalUrl, ip: req.ip },
      requestId: req.requestId,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.isOperational ? err.message : "Internal server error",
      ...(err.errorCode && { code: err.errorCode }),
      ...(err.details && { details: err.details }),
      ...(isDev && !err.isOperational && { stack: err.stack }),
    },
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`,
      code: "ROUTE_NOT_FOUND",
    },
  });
};
