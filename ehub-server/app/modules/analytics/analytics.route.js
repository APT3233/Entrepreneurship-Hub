import { Router } from "express";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import { analyticsQuerySchema, classAnalyticsSchema } from "./analytics.validation.js";

export const createAnalyticsRouter = (container) => {
  const { analyticsController } = container.cradle;
  const router = Router();
  const adminRoles = roleGuard("admin", "department_head");
  const lecturerRoles = roleGuard("admin", "department_head", "lecturer");

  router.get("/analytics/overview", authenticate, adminRoles, validateRequest(analyticsQuerySchema), analyticsController.overview);
  router.get("/analytics/academic-quality", authenticate, adminRoles, validateRequest(analyticsQuerySchema), analyticsController.academicQuality);
  router.get("/analytics/grading", authenticate, adminRoles, validateRequest(analyticsQuerySchema), analyticsController.grading);
  router.get("/analytics/rubric", authenticate, adminRoles, validateRequest(analyticsQuerySchema), analyticsController.rubric);
  router.get("/analytics/projects", authenticate, adminRoles, validateRequest(analyticsQuerySchema), analyticsController.projects);

  router.get("/analytics/lecturer", authenticate, lecturerRoles, validateRequest(analyticsQuerySchema), analyticsController.lecturer);
  router.get("/analytics/classes/:classId", authenticate, lecturerRoles, validateRequest(classAnalyticsSchema), analyticsController.classAnalytics);

  router.get("/lecturer/analytics", authenticate, lecturerRoles, validateRequest(analyticsQuerySchema), analyticsController.lecturer);
  router.get("/classes/:classId/analytics", authenticate, lecturerRoles, validateRequest(classAnalyticsSchema), analyticsController.classAnalytics);

  return router;
};
