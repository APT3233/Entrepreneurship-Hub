import { Router } from "express";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import { createRateLimiters } from "app/core/middlewares/rateLimiter.js";
import {
  createCheckpointSchema,
  bulkCreateCheckpointSchema,
  updateCheckpointSchema,
  listCheckpointSchema,
  checkpointParamsSchema,
  initiateUploadSchema,
  confirmUploadSchema,
} from "./checkpoint.validation.js";

/**
 * Checkpoint Router
 * Following Rule: router always on 1 row
 */
export const createCheckpointRouter = (container) => {
  const { checkpointController } = container.cradle;
  const router = Router();
  const limiters = createRateLimiters(container);

  const commonRoles = roleGuard("admin", "department_head", "lecturer");
  const studentRoles = roleGuard("admin", "department_head", "lecturer", "student");

  router.get("/mine", authenticate, studentRoles, checkpointController.getStudentCheckpoints);
  router.post("/:id/upload", authenticate, limiters.upload, roleGuard("student"), validateRequest(initiateUploadSchema), checkpointController.initiateUpload);
  router.post("/:id/confirm-upload", authenticate, limiters.upload, roleGuard("student"), validateRequest(confirmUploadSchema), checkpointController.confirmUpload);
  router.get("/", authenticate, commonRoles, validateRequest(listCheckpointSchema), checkpointController.list);
  router.get("/:id", authenticate, commonRoles, validateRequest(checkpointParamsSchema), checkpointController.getById);
  router.post("/", authenticate, commonRoles, validateRequest(createCheckpointSchema), checkpointController.create);
  router.post("/bulk", authenticate, commonRoles, validateRequest(bulkCreateCheckpointSchema), checkpointController.createBulk);
  router.put("/:id", authenticate, commonRoles, validateRequest(updateCheckpointSchema), checkpointController.update);
  router.delete("/:id", authenticate, commonRoles, validateRequest(checkpointParamsSchema), checkpointController.remove);

  // Submissions & Grading
  router.get("/:id/submissions", authenticate, commonRoles, checkpointController.getSubmissions);
  router.get("/:id/submissions/:groupId", authenticate, commonRoles, checkpointController.getSubmissionDetail);
  router.post("/:id/submissions/:groupId/grade", authenticate, commonRoles, checkpointController.updateGrade);
  router.get("/group/:groupId", authenticate, commonRoles, checkpointController.getByGroup);

  return router;
};

