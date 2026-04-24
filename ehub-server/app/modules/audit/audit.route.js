import { Router } from "express";
import { authenticate } from "app/core/middlewares/authMiddleware.js";

export const createAuditRouter = (container) => {
  const { auditController } = container.cradle;
  const router = Router();

  /**
   * GET /api/v1/audit/me — Lấy hoạt động của chính mình
   */
  router.get("/me", authenticate, auditController.getMyActivities);

  return router;
};
