import { Router } from "express";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import {
  createSubjectSchema,
  updateSubjectSchema,
  listSubjectSchema,
  subjectParamsSchema,
} from "./subject.validation.js";

/**
 * Subject Router
 * Prefix: /api/v1/subjects
 *
 * GET    /           — list subjects
 * GET    /:id        — get subject by id
 * POST   /           — create subject         [LECTURER+]
 * PUT    /:id        — update subject          [LECTURER+]
 * DELETE /:id        — delete subject (soft)   [ADMIN]
 */
export const createSubjectRouter = (container) => {
  const { subjectController } = container.cradle;
  const router = Router();

  // ── Authenticated routes (lecture reference data) ───
  router.get("/", authenticate, roleGuard("admin", "department_head", "lecturer"), validateRequest(listSubjectSchema), subjectController.list);
  router.get("/:id", authenticate, roleGuard("admin", "department_head", "lecturer"), validateRequest(subjectParamsSchema), subjectController.getById);

  // ── Protected routes (LECTURER+) ──────────────────
  router.post("/", authenticate, roleGuard("admin", "department_head", "lecturer"), validateRequest(createSubjectSchema), subjectController.create);
  router.put("/:id", authenticate, roleGuard("admin", "department_head", "lecturer"), validateRequest(updateSubjectSchema), subjectController.update);

  // ── Admin only ────────────────────────────────────
  router.delete("/:id", authenticate, roleGuard("admin"), validateRequest(subjectParamsSchema), subjectController.remove);

  return router;
};
