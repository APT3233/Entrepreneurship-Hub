import { Router } from "express";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { permissionGuard } from "app/core/middlewares/permissionGuard.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import { analyticsQuerySchema } from "./mentorAnalytics.validation.js";

export const createMentorAnalyticsRouter = (container) => {
  const { mentorAnalyticsController } = container.cradle;
  const router = Router();
  const can = (...permissions) => permissionGuard(container, ...permissions);

  router.get("/admin/mentor-analytics/overview", authenticate, roleGuard("admin", "department_head"), can("mentor.analytics.admin_read", "mentor.analytics.read"), validateRequest(analyticsQuerySchema), mentorAnalyticsController.overview);
  router.get("/admin/mentor-analytics/workload", authenticate, roleGuard("admin", "department_head"), can("mentor.analytics.admin_read", "mentor.analytics.read"), validateRequest(analyticsQuerySchema), mentorAnalyticsController.workload);
  router.get("/admin/mentor-analytics/effectiveness", authenticate, roleGuard("admin", "department_head"), can("mentor.analytics.admin_read", "mentor.analytics.read"), validateRequest(analyticsQuerySchema), mentorAnalyticsController.effectiveness);
  router.get("/admin/mentor-analytics/matching", authenticate, roleGuard("admin", "department_head"), can("mentor.analytics.admin_read", "mentor.analytics.read"), validateRequest(analyticsQuerySchema), mentorAnalyticsController.matching);
  router.get("/admin/mentor-analytics/expertise-heatmap", authenticate, roleGuard("admin", "department_head"), can("mentor.analytics.admin_read", "mentor.analytics.read"), validateRequest(analyticsQuerySchema), mentorAnalyticsController.expertiseHeatmap);
  router.get("/admin/mentor-analytics/group-support", authenticate, roleGuard("admin", "department_head"), can("mentor.analytics.admin_read", "mentor.analytics.read"), validateRequest(analyticsQuerySchema), mentorAnalyticsController.groupSupport);
  router.get("/admin/mentor-analytics/ecosystem", authenticate, roleGuard("admin", "department_head"), can("mentor.analytics.admin_read", "mentor.analytics.read"), validateRequest(analyticsQuerySchema), mentorAnalyticsController.ecosystem);

  router.get("/lecturer/mentor-analytics", authenticate, roleGuard("lecturer", "admin", "department_head"), can("mentor.analytics.read"), validateRequest(analyticsQuerySchema), mentorAnalyticsController.lecturerDashboard);
  router.get("/mentor/dashboard", authenticate, roleGuard("mentor"), can("mentor.dashboard.read"), mentorAnalyticsController.mentorDashboard);

  return router;
};
