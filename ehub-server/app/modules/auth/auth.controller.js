import {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";
import { appConfig } from "app/config/app.js";
import {
  AUTH_COOKIE_ACCESS_TOKEN,
  AUTH_COOKIE_REFRESH_TOKEN,
} from "app/core/constants/authHttp.js";

/**
 * Lấy host thực từ request (tunnel/proxy gửi X-Forwarded-Host)
 */
const getRequestHost = (req) => {
  const raw = req.get("x-forwarded-host") || req.get("host") || "";
  return raw.split(":")[0].toLowerCase();
};

/**
 * Cookie options — chỉ set domain khi request tới đúng domain public (tránh localhost bị set domain → F5 mất cookie)
 */
const getCookieOpts = (req) => {
  const cookieDomain = appConfig.cookieDomain?.trim() || undefined;
  const host = getRequestHost(req);
  const isPublicHost =
    cookieDomain &&
    (host === cookieDomain.toLowerCase() || host.endsWith("." + cookieDomain.toLowerCase()));
  const useDomain = isPublicHost ? cookieDomain : undefined;
  const useSecure = !!useDomain || process.env.NODE_ENV === "production";
  const base = {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecure,
    path: "/",
    ...(useDomain && { domain: useDomain }),
  };
  return {
    access: { ...base, maxAge: 15 * 60 * 1000 },
    refresh: { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 },
  };
};

const setTokenCookies = (res, tokens, req) => {
  const opts = getCookieOpts(req);
  res.cookie(AUTH_COOKIE_ACCESS_TOKEN, tokens.accessToken, opts.access);
  res.cookie(AUTH_COOKIE_REFRESH_TOKEN, tokens.refreshToken, opts.refresh);
};

const getClearCookieOpts = (req) => {
  const cookieDomain = appConfig.cookieDomain?.trim() || undefined;
  const host = getRequestHost(req);
  const isPublicHost =
    cookieDomain &&
    (host === cookieDomain.toLowerCase() || host.endsWith("." + cookieDomain.toLowerCase()));
  const domain = isPublicHost ? cookieDomain : undefined;
  return { httpOnly: true, sameSite: "lax", path: "/", ...(domain && { domain }) };
};

const clearTokenCookies = (res, req) => {
  const base = getClearCookieOpts(req);
  res.clearCookie(AUTH_COOKIE_ACCESS_TOKEN, base);
  res.clearCookie(AUTH_COOKIE_REFRESH_TOKEN, base);
};

export const createAuthController = ({ authService }) => {
  const getDeviceInfo = (req) => ({
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers["user-agent"] || "Unknown",
    requestId: req.requestId,
    startTime: req.startTime,
  });

  const login = catchAsync(async (req, res) => {
    const deviceInfo = getDeviceInfo(req);
    const result = await authService.login(req.body, deviceInfo);
    setTokenCookies(res, result.tokens, req);
    return sendSuccess(res, {
      data: { user: result.user },
      message: "Login successful",
    });
  });

  const register = catchAsync(async (req, res) => {
    const deviceInfo = getDeviceInfo(req);
    const result = await authService.register(req.body, deviceInfo);
    setTokenCookies(res, result.tokens, req);
    return sendCreated(res, {
      data: { user: result.user },
      message: "User registered successfully",
    });
  });

  const refresh = catchAsync(async (req, res) => {
    const refreshToken = req.cookies?.[AUTH_COOKIE_REFRESH_TOKEN];
    const deviceInfo = getDeviceInfo(req);
    const tokens = await authService.refresh(refreshToken, deviceInfo);
    setTokenCookies(res, tokens, req);
    return sendSuccess(res, { message: "Tokens refreshed successfully" });
  });

  const logout = catchAsync(async (req, res) => {
    const refreshToken = req.cookies?.[AUTH_COOKIE_REFRESH_TOKEN];
    const deviceInfo = getDeviceInfo(req);
    if (refreshToken) {
      await authService.logout(refreshToken, deviceInfo);
    }
    clearTokenCookies(res, req);
    return sendNoContent(res);
  });

  const logoutAll = catchAsync(async (req, res) => {
    const deviceInfo = getDeviceInfo(req);
    await authService.logoutAll(req.user.id, deviceInfo);
    clearTokenCookies(res, req);
    return sendNoContent(res);
  });

  const getProfile = catchAsync(async (req, res) => {
    const profile = await authService.getProfile(req.user.id);
    return sendSuccess(res, {
      data: profile,
      message: "Profile retrieved successfully",
    });
  });

  const redirectToGoogle = catchAsync(async (_req, res) => {
    let url;
    try {
      url = await authService.getGoogleAuthUrl();
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        error: { message: err.message || "Google login is not configured" },
      });
    }
    if (typeof url !== "string" || !url) {
      return res.status(400).json({
        success: false,
        error: { message: "Google login is not configured (GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI)" },
      });
    }
    return res.redirect(302, url);
  });

  /** OAuth callback: luôn redirect về SPA (không trả JSON) để hiện modal/lỗi trên /auth/login */
  const authorizeGoogle = async (req, res) => {
    const base = String(appConfig.google.frontendUrl || "http://localhost:5173").replace(/\/$/, "");
    const toLogin = (qs) => res.redirect(302, `${base}/auth/login?${qs}`);
    try {
      const { code } = req.query;
      if (!code) return toLogin("error=missing_code");
      const deviceInfo = getDeviceInfo(req);
      const result = await authService.loginWithGoogle(code, deviceInfo);
      setTokenCookies(res, result.tokens, req);
      return res.redirect(302, `${base}?google_login=success`);
    } catch (err) {
      const apiCode = err?.errorCode;
      if (err?.isOperational && apiCode) return toLogin(`google_error=${encodeURIComponent(apiCode)}`);
      return toLogin(`google_error=${encodeURIComponent("GEN")}`);
    }
  };

  const getActivatePreview = catchAsync(async (req, res) => {
    const data = await authService.getActivatePreview(req.query.token);
    return sendSuccess(res, { data, message: "Invite valid" });
  });

  const postActivate = catchAsync(async (req, res) => {
    const deviceInfo = getDeviceInfo(req);
    const result = await authService.activateWithInvite(req.body, deviceInfo);
    setTokenCookies(res, result.tokens, req);
    return sendCreated(res, {
      data: { user: result.user },
      message: "Account activated successfully",
    });
  });

  return { login, register, refresh, logout, logoutAll, getProfile, redirectToGoogle, authorizeGoogle, getActivatePreview, postActivate };
};
