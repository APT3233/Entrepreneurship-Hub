import { Router } from "express";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { createRateLimiters } from "app/core/middlewares/rateLimiter.js";
import { loginSchema, activatePreviewSchema, activateBodySchema, updateProfileSchema, changePasswordSchema } from "./auth.validation.js";

/**
 * Auth Router — inject authController từ DI Container
 *
 * POST /login          — đăng nhập
 * POST /refresh-token  — làm mới access token
 * POST /logout         — đăng xuất (revoke refresh token)
 * POST /logout-all     — đăng xuất tất cả thiết bị (cần auth)
 * GET  /me             — lấy thông tin profile (cần auth)
 */
export const createAuthRouter = (container) => {
  const { authController } = container.cradle;
  const router = Router();
  const limiters = createRateLimiters(container);

  // ── Public routes ──────────────────────────────────────
  router.post("/login", limiters.loginIp, limiters.login, validateRequest(loginSchema), authController.login);
  router.get("/activate", validateRequest(activatePreviewSchema), authController.getActivatePreview);
  router.post("/activate", validateRequest(activateBodySchema), authController.postActivate);
  router.post("/refresh-token", authController.refresh);
  router.post("/logout", authController.logout);

  // ── Google OAuth ──────────────────────────────────────
  // GET /google           → redirect sang Google consent screen
  // GET /authorize/google → callback từ Google (code), đổi code lấy token, tạo/ghép user, set cookie, redirect frontend
  router.get("/google", authController.redirectToGoogle);
  router.get("/authorize/google", authController.authorizeGoogle);
  router.get("/google/setup-preview", authController.getGoogleSetupPreview);
  router.post("/google/complete-setup", authController.postGoogleSetup);

  // ── Authenticated routes ───────────────────────────────
  router.post("/logout-all", authenticate, authController.logoutAll);
  router.get("/me", authenticate, authController.getProfile);
  router.put("/me", authenticate, validateRequest(updateProfileSchema), authController.updateProfile);
  router.put("/change-password", authenticate, validateRequest(changePasswordSchema), authController.changePassword);

  return router;
};
