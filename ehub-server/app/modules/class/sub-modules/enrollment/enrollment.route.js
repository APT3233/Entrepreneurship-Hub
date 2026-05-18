import { Router } from "express";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import {
  enrollStudentSchema,
  unenrollStudentSchema,
  updateEnrollmentSchema,
  listEnrollmentSchema,
} from "./enrollment.validation.js";

/**
 * Enrollment Router — nested under /classes/:classId
 *
 * GET    /                   — list enrolled students
 * POST   /                   — enroll student          [LECTURER+]
 * DELETE /:studentId         — unenroll student         [LECTURER+]
 * PUT    /:studentId         — update student info      [LECTURER+]
 */
export const createEnrollmentRouter = (container) => {
  const { enrollmentController } = container.cradle;
  const router = Router({ mergeParams: true });

  router.get(
    "/",
    authenticate,
    roleGuard("admin", "department_head", "lecturer"),
    validateRequest(listEnrollmentSchema),
    enrollmentController.list,
  );

  router.post(
    "/",
    authenticate,
    roleGuard("admin", "department_head", "lecturer"),
    validateRequest(enrollStudentSchema),
    enrollmentController.enroll,
  );

  router.delete(
    "/:studentId",
    authenticate,
    roleGuard("admin", "department_head", "lecturer"),
    validateRequest(unenrollStudentSchema),
    enrollmentController.unenroll,
  );

  router.put(
    "/:studentId",
    authenticate,
    roleGuard("admin", "department_head", "lecturer"),
    validateRequest(updateEnrollmentSchema),
    enrollmentController.update,
  );

  return router;
};
