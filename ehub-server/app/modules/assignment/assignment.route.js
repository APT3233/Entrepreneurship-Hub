import { Router } from "express";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  updateAssignmentStatusSchema,
  listAssignmentSchema,
  assignmentParamsSchema,
} from "./assignment.validation.js";

export const createAssignmentRouter = (container) => {
  const { assignmentController } = container.cradle;
  const router = Router();

  router.get("/", authenticate, roleGuard("admin", "department_head", "lecturer"), validateRequest(listAssignmentSchema), assignmentController.list);
  router.get("/:id", authenticate, roleGuard("admin", "department_head", "lecturer"), validateRequest(assignmentParamsSchema), assignmentController.getById);
  router.post("/", authenticate, roleGuard("admin", "department_head", "lecturer"), validateRequest(createAssignmentSchema), assignmentController.create);
  router.put("/:id", authenticate, roleGuard("admin", "department_head", "lecturer"), validateRequest(updateAssignmentSchema), assignmentController.update);
  router.patch("/:id/status", authenticate, roleGuard("admin", "department_head", "lecturer"), validateRequest(updateAssignmentStatusSchema), assignmentController.updateStatus);
  router.delete("/:id", authenticate, roleGuard("admin", "department_head", "lecturer"), validateRequest(assignmentParamsSchema), assignmentController.remove);

  return router;
};
