import { Router } from "express";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import {
  createSemesterSchema,
  updateSemesterSchema,
  listSemesterSchema,
  semesterParamsSchema,
} from "./semester.validation.js";

/**
 * Semester Router
 * Prefix: /api/v1/semesters
 *
 * GET    /           — list semesters
 * GET    /:id        — get semester by id
 * POST   /           — create semester       [LECTURER+]
 * PUT    /:id        — update semester        [LECTURER+]
 */
export const createSemesterRouter = (container) => {
  const { semesterController } = container.cradle;
  const router = Router();

  router.get("/", validateRequest(listSemesterSchema), semesterController.list);
  router.get(
    "/:id",
    validateRequest(semesterParamsSchema),
    semesterController.getById,
  );

  router.post(
    "/",
    authenticate,
    roleGuard("admin", "department_head", "lecturer"),
    validateRequest(createSemesterSchema),
    semesterController.create,
  );

  router.put(
    "/:id",
    authenticate,
    roleGuard("admin", "department_head", "lecturer"),
    validateRequest(updateSemesterSchema),
    semesterController.update,
  );

  return router;
};
