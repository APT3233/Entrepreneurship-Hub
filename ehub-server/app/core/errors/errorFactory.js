import AppError from "./AppError.js";
import { ErrorTypes } from "./errorTypes.js";

// ─── 400 ────────────────────────────────────────────
export const BadRequest = (message = "Yêu cầu không hợp lệ", details = null) =>
  AppError(message, 400, ErrorTypes.BAD_REQUEST, details);

export const ValidationError = (details) =>
  AppError("Dữ liệu xác thực không hợp lệ", 400, ErrorTypes.VALIDATION_ERROR, details);

// ─── 401 ────────────────────────────────────────────
export const InvalidCredentials = (message = "Thông tin đăng nhập không chính xác") =>
  AppError(message, 401, ErrorTypes.INVALID_CREDENTIALS);

export const TokenExpired = () =>
  AppError("Phiên đăng nhập đã hết hạn", 401, ErrorTypes.TOKEN_EXPIRED);

export const TokenInvalid = () =>
  AppError("Mã xác thực không hợp lệ", 401, ErrorTypes.TOKEN_INVALID);

// ─── 403 ────────────────────────────────────────────
export const Forbidden = (message = "Bạn không có quyền thực hiện hành động này") =>
  AppError(message, 403, ErrorTypes.INSUFFICIENT_PERMISSION);

export const AccountLocked = () =>
  AppError("Tài khoản đã bị khóa", 403, ErrorTypes.ACCOUNT_LOCKED);

export const StudentNotInRoster = (
  message = "MSSV của bạn chưa được giảng viên thêm vào hệ thống. Vui lòng liên hệ giảng viên để được cấp quyền."
) => AppError(message, 403, ErrorTypes.STUDENT_NOT_IN_ROSTER);

export const MentorProfileNotActive = (
  message = "Hồ sơ mentor của bạn chưa được duyệt. Vui lòng hoàn thiện hồ sơ và chờ quản trị viên phê duyệt."
) => AppError(message, 403, ErrorTypes.MENTOR_PROFILE_NOT_ACTIVE);

// ─── 404 ────────────────────────────────────────────
export const NotFound = (resource = "Tài nguyên") =>
  AppError(`${resource} không tồn tại`, 404, ErrorTypes.NOT_FOUND);

// ─── 409 ────────────────────────────────────────────
export const AlreadyExists = (resource = "Resource") =>
  AppError(`${resource}`, 409, ErrorTypes.ALREADY_EXISTS);

export const Conflict = (message = "Xung đột dữ liệu") =>
  AppError(message, 409, ErrorTypes.CONFLICT);

// ─── 429 ────────────────────────────────────────────
export const RateLimitExceeded = (retryAfter = 60, retryAt = null) =>
  AppError("Quá nhiều yêu cầu, vui lòng thử lại sau", 429, ErrorTypes.RATE_LIMIT_EXCEEDED, {
    retryAfter,
    retryAt,
  });

// ─── 500 ────────────────────────────────────────────
export const InternalError = (message = "Lỗi hệ thống nội bộ") =>
  AppError(message, 500, ErrorTypes.INTERNAL_ERROR);

export const DatabaseError = (message = "Lỗi cơ sở dữ liệu") =>
  AppError(message, 500, ErrorTypes.DB_ERROR);

export const ServiceUnavailable = (message = "Dịch vụ hiện không khả dụng", details = null) =>
  AppError(message, 503, ErrorTypes.SERVICE_UNAVAILABLE, details);
