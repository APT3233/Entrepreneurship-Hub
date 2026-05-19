const SECRET_KEY_PARTS = [
  "password",
  "passwd",
  "token",
  "secret",
  "authorization",
  "cookie",
  "session",
  "upload_token",
  "access_token",
  "refresh_token",
  "api_key",
  "private_key",
];

const PII_KEY_PARTS = [
  "email",
  "phone",
  "fullname",
  "full_name",
  "student_code",
  "studentcode",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_TEXT_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /^\+?[0-9][0-9\s().-]{7,}[0-9]$/;
const IP_RE = /^(?:(?:\d{1,3}\.){3}\d{1,3}|(?=.*:)[0-9a-f:.]+)$/i;
const BEARER_TEXT_RE = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;

const lower = (value) => String(value).toLowerCase();
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const includesAny = (key, parts) => {
  const normalized = lower(key);
  return parts.some((part) => normalized.includes(part));
};

const isIpKey = (key) => ["client_ip", "ip_address", "ip"].includes(lower(key));

const maskEmail = (value) => {
  const [local, domain] = String(value).split("@");
  if (!local || !domain) return "***";
  return `${local.slice(0, 1)}***@${domain}`;
};

const maskPhone = (value) => {
  const raw = String(value);
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `***${digits.slice(-2)}`;
};

const redactKeyedValues = (value, keys) => {
  const keyPattern = keys.map(escapeRegex).join("|");
  const re = new RegExp(
    `(["']?)\\b(${keyPattern})\\b\\1(\\s*[:=]\\s*)(["']?)([^"',\\s;&}]+)(["']?)`,
    "gi",
  );

  return value.replace(
    re,
    (_match, keyQuote, key, separator, valueQuote, _rawValue, endQuote) =>
      `${keyQuote}${key}${keyQuote}${separator}${valueQuote}***${endQuote}`,
  );
};

const maskStringValue = (value, key = "") => {
  let masked = String(value).replace(EMAIL_TEXT_RE, (match) => maskEmail(match));
  masked = masked.replace(BEARER_TEXT_RE, "Bearer ***");
  masked = redactKeyedValues(masked, SECRET_KEY_PARTS);
  masked = redactKeyedValues(masked, PII_KEY_PARTS);
  if (EMAIL_RE.test(masked)) return maskEmail(masked);
  if (!isIpKey(key) && !IP_RE.test(masked) && PHONE_RE.test(masked)) return maskPhone(masked);
  return masked;
};

export const serializeError = (err, { includeStack = true } = {}) => {
  if (!err || typeof err !== "object") return {};

  const serialized = {
    error_name: err.name ?? "Error",
    error_message: maskStringValue(err.message ?? String(err)),
  };

  if (includeStack && err.stack) {
    serialized.error_stack = err.stack;
  }

  if (err.code) serialized.error_code = err.code;
  if (err.statusCode) serialized.error_status_code = err.statusCode;
  if (err.errorCode) serialized.error_app_code = err.errorCode;

  return serialized;
};

export const sanitizeLogValue = (value, key = "") => {
  if (value == null) return value;

  if (includesAny(key, SECRET_KEY_PARTS)) return "***";
  if (includesAny(key, PII_KEY_PARTS)) return "***";

  if (value instanceof Error) return serializeError(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item, key));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        sanitizeLogValue(entryValue, entryKey),
      ]),
    );
  }

  if (typeof value === "string") return maskStringValue(value, key);

  return value;
};

export const sanitizeLogMeta = (meta = {}) => sanitizeLogValue(meta) ?? {};
