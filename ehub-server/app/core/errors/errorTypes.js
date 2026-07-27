/**
 * Enum error codes — dùng cho client parse lỗi
 */
export const ErrorTypes = Object.freeze({
  // Auth
  INVALID_CREDENTIALS: "AUTH_001",
  TOKEN_EXPIRED: "AUTH_002",
  TOKEN_INVALID: "AUTH_003",
  INSUFFICIENT_PERMISSION: "AUTH_004",
  ACCOUNT_LOCKED: "AUTH_005",
  /** MSSV đúng format nhưng chưa có bản ghi sinh viên (chưa được GV import) */
  STUDENT_NOT_IN_ROSTER: "AUTH_006",
  /** Hồ sơ mentor chưa được duyệt hoặc đã bị vô hiệu hóa */
  MENTOR_PROFILE_NOT_ACTIVE: "AUTH_007",

  // Validation
  VALIDATION_ERROR: "VAL_001",
  INVALID_INPUT: "VAL_002",
  MISSING_FIELD: "VAL_003",

  // Resource
  NOT_FOUND: "RES_001",
  ALREADY_EXISTS: "RES_002",
  CONFLICT: "RES_003",
  GONE: "RES_004",

  // Database
  DB_ERROR: "DB_001",
  DB_CONSTRAINT: "DB_002",
  DB_DEADLOCK: "DB_003",

  // External
  SERVICE_UNAVAILABLE: "EXT_001",
  MESSAGE_ERROR: "EXT_002",
  REDIS_ERROR: "EXT_003",
  MAIL_ERROR: "EXT_004",

  // Rate limit
  RATE_LIMIT_EXCEEDED: "RATE_001",

  // General
  INTERNAL_ERROR: "GEN_001",
  BAD_REQUEST: "GEN_002",
});
