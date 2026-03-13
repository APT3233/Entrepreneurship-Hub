import { optional, toInt, toList } from "./validate.js";

export const appConfig = Object.freeze({
  name: optional("APP_NAME", "ims-server"),
  port: toInt(optional("PORT", "7777"), 7777),
  host: optional("HOST", "0.0.0.0"),
  apiPrefix: optional("API_PREFIX", "/api/v1"),
  corsOrigins: toList(process.env.CORS_ORIGINS, ["*"]),
  rateLimit: {
    windowMs: toInt(optional("RATE_LIMIT_WINDOW_MS", "900000"), 900_000),
    max: toInt(optional("RATE_LIMIT_MAX", "100"), 100),
  },
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  },
  /** Khi chạy qua tunnel/domain công khai (vd: ehub.apt3233.id.vn): set để cookie gửi đúng domain + Secure */
  cookieDomain: optional("COOKIE_DOMAIN", ""),
  google: {
    clientId: optional("GOOGLE_CLIENT_ID", ""),
    clientSecret: optional("GOOGLE_CLIENT_SECRET", ""),
    redirectUri: optional(
      "GOOGLE_REDIRECT_URI",
      `http://localhost:${toInt(optional("PORT", "7777"), 7777)}${optional("API_PREFIX", "/api/v1")}/auth/authorize/google`
    ),
    frontendUrl: optional("FRONTEND_URL", "http://localhost:5173"),
  },
});
