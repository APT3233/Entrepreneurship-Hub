import AppError from "app/core/errors/AppError.js";

export const AiErrorCodes = Object.freeze({
  DISABLED: "ai_disabled",
  PROVIDER_NOT_FOUND: "ai_provider_not_found",
  PROVIDER_DISABLED: "ai_provider_disabled",
  API_KEY_MISSING: "ai_api_key_missing",
  MISSING_API_KEY: "ai_api_key_missing",
  MISSING_SECRET_ENCRYPTION_KEY: "missing_ai_secret_encryption_key",
  SECRET_DECRYPTION_FAILED: "ai_secret_decryption_failed",
  TIMEOUT: "ai_timeout",
  UNAUTHORIZED: "ai_provider_unauthorized",
  NOT_FOUND: "ai_provider_not_found",
  PROVIDER_UNAVAILABLE: "ai_provider_unavailable",
  MODEL_NOT_FOUND: "ai_model_not_found_or_not_loaded",
  PROVIDER_ERROR: "ai_provider_error",
  MALFORMED_STREAM: "ai_stream_parse_failed",
  STREAM_PARSE_FAILED: "ai_stream_parse_failed",
  EMPTY_RESPONSE: "ai_empty_response",
  INVALID_RESPONSE: "ai_invalid_response",
  INVALID_JSON: "invalid_ai_json",
  NETWORK_ERROR: "ai_provider_network_error",
  EXTRACTION_FAILED: "extraction_failed",
  UNSUPPORTED_FILE_TYPE: "unsupported_file_type",
  FILE_NOT_FOUND: "file_not_found",
  FILE_TOO_LARGE: "file_too_large",
});

export const createAiError = (code, message, statusCode = 502, details = null) => {
  const err = AppError(message, statusCode, code, details);
  err.aiCode = code;
  return err;
};

export const publicAiError = (err) => ({
  code: err?.aiCode || err?.errorCode || AiErrorCodes.PROVIDER_ERROR,
  message: err?.message || "AI provider error",
  details: err?.details || null,
});
