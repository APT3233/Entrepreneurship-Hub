import { optional, toBool, toInt } from "./validate.js";

const isRateLimitEnabled = (name = "") => {
  const globalEnabled = toBool(optional("RATE_LIMIT_ENABLED", "true"), true);
  if (!globalEnabled) return false;
  if (!name) return true;
  return toBool(optional(`RATE_LIMIT_${name}_ENABLED`, "true"), true);
};

const withToggle = (name, config) => ({
  enabled: isRateLimitEnabled(name),
  ...config,
});

export const rateLimitConfig = Object.freeze({
  enabled: isRateLimitEnabled(),
  api: withToggle("API", {
    windowMs: toInt(optional("RATE_LIMIT_API_WINDOW_MS", "900000"), 900_000),
    max: toInt(optional("RATE_LIMIT_API_MAX", "1000"), 1000),
    keyPrefix: optional("RATE_LIMIT_API_KEY_PREFIX", "rl:api"),
  }),
  mutation: withToggle("MUTATION", {
    windowMs: toInt(optional("RATE_LIMIT_MUTATION_WINDOW_MS", "900000"), 900_000),
    max: toInt(optional("RATE_LIMIT_MUTATION_MAX", "300"), 300),
    keyPrefix: optional("RATE_LIMIT_MUTATION_KEY_PREFIX", "rl:mutation"),
    methods: ["POST", "PUT", "PATCH", "DELETE"],
  }),
  default: withToggle("DEFAULT", {
    windowMs: toInt(optional("RATE_LIMIT_WINDOW_MS", "900000"), 900_000),
    max: toInt(optional("RATE_LIMIT_MAX", "100"), 100),
    keyPrefix: optional("RATE_LIMIT_KEY_PREFIX", "rl:default"),
  }),
  login: withToggle("LOGIN", {
    windowMs: toInt(optional("RATE_LIMIT_LOGIN_WINDOW_MS", "900000"), 900_000),
    max: toInt(optional("RATE_LIMIT_LOGIN_MAX", "10"), 10),
    keyPrefix: optional("RATE_LIMIT_LOGIN_KEY_PREFIX", "rl:login"),
  }),
  loginIp: withToggle("LOGIN_IP", {
    windowMs: toInt(optional("RATE_LIMIT_LOGIN_IP_WINDOW_MS", "900000"), 900_000),
    max: toInt(optional("RATE_LIMIT_LOGIN_IP_MAX", "50"), 50),
    keyPrefix: optional("RATE_LIMIT_LOGIN_IP_KEY_PREFIX", "rl:login-ip"),
  }),
  upload: withToggle("UPLOAD", {
    windowMs: toInt(optional("RATE_LIMIT_UPLOAD_WINDOW_MS", "600000"), 600_000),
    max: toInt(optional("RATE_LIMIT_UPLOAD_MAX", "60"), 60),
    keyPrefix: optional("RATE_LIMIT_UPLOAD_KEY_PREFIX", "rl:upload"),
  }),
  ai: withToggle("AI", {
    windowMs: toInt(optional("RATE_LIMIT_AI_WINDOW_MS", "900000"), 900_000),
    max: toInt(optional("RATE_LIMIT_AI_MAX", "200"), 200),
    keyPrefix: optional("RATE_LIMIT_AI_KEY_PREFIX", "rl:ai"),
  }),
});
