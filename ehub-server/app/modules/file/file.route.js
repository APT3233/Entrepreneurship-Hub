import { Router } from "express";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { createRateLimiters } from "app/core/middlewares/rateLimiter.js";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import Joi from "joi";

const initiateUploadSchema = {
  body: Joi.object({
    file: Joi.object({
      name: Joi.string().max(255).required(),
      size: Joi.number().integer().min(1).required(),
      type: Joi.string().max(100).required(),
    }).required(),
    purpose: Joi.string().valid("avatar", "general").default("general"),
  }),
};

const confirmUploadSchema = {
  body: Joi.object({
    upload_token: Joi.string().required(),
  }),
};

/**
 * File Router
 * Prefix: /api/v1/files
 */
export const createFileRouter = (container) => {
  const { fileController } = container.cradle;
  const router = Router();
  const limiters = createRateLimiters(container);

  /** 
   * Tải file qua proxy: GET /api/v1/files/download?path=...&name=...
   * Yêu cầu đăng nhập và kiểm quyền theo resource chứa file.
   */
  router.get("/download", authenticate, fileController.download);

  /**
   * Upload file chung (avatar, file đính kèm...)
   * POST /api/v1/files/initiate-upload
   * POST /api/v1/files/confirm-upload
   * Mọi user đã đăng nhập đều có thể upload.
   */
  router.post("/initiate-upload", authenticate, limiters.upload, validateRequest(initiateUploadSchema), fileController.initiateUpload);
  router.post("/confirm-upload", authenticate, limiters.upload, validateRequest(confirmUploadSchema), fileController.confirmUpload);

  return router;
};
