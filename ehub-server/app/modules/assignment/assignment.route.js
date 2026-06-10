import { Router } from "express";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import { createRateLimiters } from "app/core/middlewares/rateLimiter.js";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  updateAssignmentStatusSchema,
  listAssignmentSchema,
  assignmentParamsSchema,
  initiateAssignmentUploadSchema,
  confirmAssignmentUploadSchema,
  assignmentSubmitInitiateSchema,
  assignmentSubmitConfirmSchema,
  assignmentGradeSchema,
} from "./assignment.validation.js";

export const createAssignmentRouter = (container) => {
  const { assignmentController } = container.cradle;
  const router = Router();
  const limiters = createRateLimiters(container);

  router.get("/", authenticate, roleGuard("admin", "department_head", "lecturer", "student"), validateRequest(listAssignmentSchema), assignmentController.list);
  router.get(
    "/:id/submissions",
    authenticate,
    roleGuard("admin", "department_head", "lecturer"),
    validateRequest(assignmentParamsSchema),
    assignmentController.getSubmissions
  );
  router.post(
    "/:id/submissions/:groupId/grade",
    authenticate,
    roleGuard("admin", "department_head", "lecturer"),
    validateRequest(assignmentGradeSchema),
    assignmentController.gradeGroupSubmission
  );
  router.post(
    "/:id/submit/initiate",
    authenticate,
    limiters.upload,
    roleGuard("student"),
    validateRequest(assignmentSubmitInitiateSchema),
    assignmentController.initiateStudentSubmit
  );
  router.post(
    "/:id/submit/confirm",
    authenticate,
    limiters.upload,
    roleGuard("student"),
    validateRequest(assignmentSubmitConfirmSchema),
    assignmentController.confirmStudentSubmit
  );
  router.get("/:id", authenticate, roleGuard("admin", "department_head", "lecturer", "student"), validateRequest(assignmentParamsSchema), assignmentController.getById);
  router.post("/", authenticate, roleGuard("admin", "department_head", "lecturer"), validateRequest(createAssignmentSchema), assignmentController.create);
  router.post("/initiate-upload", authenticate, limiters.upload, roleGuard("admin", "department_head", "lecturer"), validateRequest(initiateAssignmentUploadSchema), assignmentController.initiateUpload);
  router.post("/confirm-upload", authenticate, limiters.upload, roleGuard("admin", "department_head", "lecturer"), validateRequest(confirmAssignmentUploadSchema), assignmentController.confirmUpload);
  router.put("/:id", authenticate, roleGuard("admin", "department_head", "lecturer"), validateRequest(updateAssignmentSchema), assignmentController.update);
  router.patch("/:id/status", authenticate, roleGuard("admin", "department_head", "lecturer"), validateRequest(updateAssignmentStatusSchema), assignmentController.updateStatus);
  router.delete("/:id", authenticate, roleGuard("admin", "department_head", "lecturer"), validateRequest(assignmentParamsSchema), assignmentController.remove);

  return router;
};
