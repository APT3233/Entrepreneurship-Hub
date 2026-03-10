import { Router } from "express";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import {
  createStudentSchema,
  updateStudentSchema,
  listStudentSchema,
  studentParamsSchema,
} from "./student.validation.js";

/**
 * Student Router
 * Prefix: /api/v1/students
 *
 * GET    /           — list students
 * GET    /export     — export students (Excel/CSV)    [LECTURER+]
 * GET    /:id        — get student by id
 * POST   /           — create student                 [LECTURER+]
 * PUT    /:id        — update student                  [LECTURER+]
 */
export const createStudentRouter = (container) => {
  const { studentController } = container.cradle;
  const router = Router();

  router.get("/", validateRequest(listStudentSchema), studentController.list);

  // Export — must be before /:id to avoid matching "export" as id
  router.get(
    "/export",
    authenticate,
    roleGuard("admin", "department_head", "teacher"),
    studentController.exportStudents,
  );

  router.get(
    "/:id",
    validateRequest(studentParamsSchema),
    studentController.getById,
  );

  router.post(
    "/",
    authenticate,
    roleGuard("admin", "department_head", "teacher"),
    validateRequest(createStudentSchema),
    studentController.create,
  );

  router.put(
    "/:id",
    authenticate,
    roleGuard("admin", "department_head", "teacher"),
    validateRequest(updateStudentSchema),
    studentController.update,
  );

  return router;
};
