import { Router } from "express";
import { authenticate } from "app/core/middlewares/authMiddleware.js";

/**
 * File Router
 * Prefix: /api/v1/files
 */
export const createFileRouter = (container) => {
  const { fileController } = container.cradle;
  const router = Router();

  /** 
   * Tải file qua proxy: GET /api/v1/files/download?path=...&name=...
   * Yêu cầu đăng nhập và kiểm quyền theo resource chứa file.
   */
  router.get("/download", authenticate, fileController.download);

  return router;
};
