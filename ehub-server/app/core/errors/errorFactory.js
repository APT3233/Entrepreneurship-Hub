import AppError from "./AppError.js";
import { ErrorTypes } from "./errorTypes.js";

// ─── 400 ────────────────────────────────────────────
export const BadRequest = (message = "Bad request", details = null) =>
  AppError(message, 400, ErrorTypes.BAD_REQUEST, details);

export const ValidationError = (details) =>
  AppError("Validation failed", 400, ErrorTypes.VALIDATION_ERROR, details);

// ─── 401 ────────────────────────────────────────────
export const InvalidCredentials = (message = "Invalid credentials") =>
  AppError(message, 401, ErrorTypes.INVALID_CREDENTIALS);

export const TokenExpired = () =>
  AppError("Token has expired", 401, ErrorTypes.TOKEN_EXPIRED);

export const TokenInvalid = () =>
  AppError("Token is invalid", 401, ErrorTypes.TOKEN_INVALID);

// ─── 403 ────────────────────────────────────────────
export const Forbidden = (message = "Forbidden") =>
  AppError(message, 403, ErrorTypes.INSUFFICIENT_PERMISSION);

export const AccountLocked = () =>
  AppError("Account is locked", 403, ErrorTypes.ACCOUNT_LOCKED);

// ─── 404 ────────────────────────────────────────────
export const NotFound = (resource = "Resource") =>
  AppError(`${resource} not found`, 404, ErrorTypes.NOT_FOUND);

// ─── 409 ────────────────────────────────────────────
export const AlreadyExists = (resource = "Resource") =>
  AppError(`${resource} already exists`, 409, ErrorTypes.ALREADY_EXISTS);

export const Conflict = (message = "Conflict") =>
  AppError(message, 409, ErrorTypes.CONFLICT);

// ─── 429 ────────────────────────────────────────────
export const RateLimitExceeded = (retryAfter = 60) =>
  AppError("Too many requests", 429, ErrorTypes.RATE_LIMIT_EXCEEDED, {
    retryAfter,
  });

// ─── 500 ────────────────────────────────────────────
export const InternalError = (message = "Internal server error") =>
  AppError(message, 500, ErrorTypes.INTERNAL_ERROR);

export const DatabaseError = (message = "Database error") =>
  AppError(message, 500, ErrorTypes.DB_ERROR);

export const ServiceUnavailable = (service = "Service") =>
  AppError(`${service} is unavailable`, 503, ErrorTypes.SERVICE_UNAVAILABLE);
