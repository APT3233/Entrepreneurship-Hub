import { Router } from "express";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { loginSchema, registerSchema, activatePreviewSchema, activateBodySchema } from "./auth.validation.js";

/**
 * Auth Router — inject authController từ DI Container
 *
 * POST /login          — đăng nhập
 * POST /register       — đăng ký (auto-login)
 * POST /refresh-token  — làm mới access token
 * POST /logout         — đăng xuất (revoke refresh token)
 * POST /logout-all     — đăng xuất tất cả thiết bị (cần auth)
 * GET  /me             — lấy thông tin profile (cần auth)
 */
export const createAuthRouter = (container) => {
  const { authController } = container.cradle;
  const router = Router();

  // ── Public routes ──────────────────────────────────────
  router.post("/login", validateRequest(loginSchema), authController.login);
  router.post("/register", validateRequest(registerSchema), authController.register);
  router.get("/activate", validateRequest(activatePreviewSchema), authController.getActivatePreview);
  router.post("/activate", validateRequest(activateBodySchema), authController.postActivate);
  router.post("/refresh-token", authController.refresh);
  router.post("/logout", authController.logout);

  // ── Google OAuth ──────────────────────────────────────
  // GET /google           → redirect sang Google consent screen
  // GET /authorize/google → callback từ Google (code), đổi code lấy token, tạo/ghép user, set cookie, redirect frontend
  router.get("/google", authController.redirectToGoogle);
  router.get("/authorize/google", authController.authorizeGoogle);

  // ── Authenticated routes ───────────────────────────────
  router.post("/logout-all", authenticate, authController.logoutAll);
  router.get("/me", authenticate, authController.getProfile);

  return router;
};
