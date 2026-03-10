import { HttpStatus } from "../constants/httpStatus.js";

export const sendSuccess = (
  res,
  { data = null, message = "Success", statusCode = HttpStatus.OK, meta = null },
) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
  });

export const sendCreated = (
  res,
  { data = null, message = "Created successfully" },
) =>
  res.status(HttpStatus.CREATED).json({
    success: true,
    message,
    data,
  });

export const sendNoContent = (res) => res.status(HttpStatus.NO_CONTENT).end();

export const sendPaginated = (
  res,
  { data, page, limit, total, message = "Success" },
) =>
  res.status(HttpStatus.OK).json({
    success: true,
    message,
    data,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });

export const sendError = (
  res,
  {
    message = "Error",
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode = null,
    details = null,
  },
) =>
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(errorCode && { code: errorCode }),
      ...(details && { details }),
    },
  });
