import {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";
import { appConfig } from "app/config/app.js";

/**
 * Cookie options for token storage
 * httpOnly:  JS cannot read it (XSS-safe)
 * sameSite:  "lax" works cross-port on localhost; use "none"+secure for cross-domain+HTTPS
 */
const ACCESS_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const setTokenCookies = (res, tokens) => {
  res.cookie("access_token", tokens.accessToken, ACCESS_COOKIE_OPTS);
  res.cookie("refresh_token", tokens.refreshToken, REFRESH_COOKIE_OPTS);
};

const clearTokenCookies = (res) => {
  res.clearCookie("access_token", { httpOnly: true, sameSite: "lax" });
  res.clearCookie("refresh_token", { httpOnly: true, sameSite: "lax" });
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
    setTokenCookies(res, result.tokens);
    return sendSuccess(res, {
      data: { user: result.user },
      message: "Login successful",
    });
  });

  const register = catchAsync(async (req, res) => {
    const deviceInfo = getDeviceInfo(req);
    const result = await authService.register(req.body, deviceInfo);
    setTokenCookies(res, result.tokens);
    return sendCreated(res, {
      data: { user: result.user },
      message: "User registered successfully",
    });
  });

  const refresh = catchAsync(async (req, res) => {
    const refreshToken = req.cookies?.refresh_token;
    const deviceInfo = getDeviceInfo(req);
    const tokens = await authService.refresh(refreshToken, deviceInfo);
    setTokenCookies(res, tokens);
    return sendSuccess(res, { message: "Tokens refreshed successfully" });
  });

  const logout = catchAsync(async (req, res) => {
    const refreshToken = req.cookies?.refresh_token;
    const deviceInfo = getDeviceInfo(req);
    if (refreshToken) {
      await authService.logout(refreshToken, deviceInfo);
    }
    clearTokenCookies(res);
    return sendNoContent(res);
  });

  const logoutAll = catchAsync(async (req, res) => {
    const deviceInfo = getDeviceInfo(req);
    await authService.logoutAll(req.user.id, deviceInfo);
    clearTokenCookies(res);
    return sendNoContent(res);
  });

  const getProfile = catchAsync(async (req, res) => {
    return sendSuccess(res, {
      data: req.user,
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

  const authorizeGoogle = catchAsync(async (req, res) => {
    const { code } = req.query;
    const frontendUrl = appConfig.google.frontendUrl || "http://localhost:5173";
    if (!code) {
      return res.redirect(302, `${frontendUrl}?error=missing_code`);
    }
    const deviceInfo = getDeviceInfo(req);
    const result = await authService.loginWithGoogle(code, deviceInfo);
    setTokenCookies(res, result.tokens);
    return res.redirect(302, `${frontendUrl}?google_login=success`);
  });

  return { login, register, refresh, logout, logoutAll, getProfile, redirectToGoogle, authorizeGoogle };
};
