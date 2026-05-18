import { Router } from "express";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import {
  createClassSchema,
  updateClassSchema,
  listClassSchema,
  classParamsSchema,
  statsClassSchema,
} from "./class.validation.js";
import { createEnrollmentRouter } from "./sub-modules/enrollment/enrollment.route.js";

/**
 * Class Router
 * Prefix: /api/v1/classes
 *
 * GET    /                            — list classes
 * GET    /:id                         — get class by id
 * POST   /                            — create class          [LECTURER+]
 * PUT    /:id                         — update class           [LECTURER+]
 * DELETE /:id                         — delete class (soft)    [LECTURER+]
 *
 * Sub-module: Enrollment — mounted at /:classId/enrollments
 */
export const createClassRouter = (container) => {
  const { classController } = container.cradle;
  const router = Router();

  router.get("/", authenticate, validateRequest(listClassSchema), classController.list);
  router.get("/stats", authenticate, roleGuard("admin", "department_head", "lecturer"), validateRequest(statsClassSchema), classController.stats);
  router.get("/student-stats", authenticate, classController.studentStats);
  router.get("/:id/overview", authenticate, validateRequest(classParamsSchema), classController.overview);
  router.get("/:id", authenticate, validateRequest(classParamsSchema), classController.getById);

  router.post("/", authenticate, roleGuard("admin", "department_head", "lecturer"), validateRequest(createClassSchema), classController.create);
  router.put("/:id", authenticate, roleGuard("admin", "department_head", "lecturer"), validateRequest(updateClassSchema), classController.update);
  router.delete("/:id", authenticate, roleGuard("admin", "department_head", "lecturer"), validateRequest(classParamsSchema), classController.remove);

  // ── Mount Enrollment sub-module ───────────────────
  router.use("/:classId/enrollments", createEnrollmentRouter(container));

  return router;
};
