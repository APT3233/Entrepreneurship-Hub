import { Router } from "express";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import { createAdminAcademicRouter } from "./sub-modules/academic/academic.route.js";
import { createAdminAccessControlRouter } from "./sub-modules/access-control/accessControl.route.js";
import { createAdminDashboardRouter } from "./sub-modules/dashboard/dashboard.route.js";
import { createAdminStudentGroupRouter } from "./sub-modules/student-group/studentGroup.route.js";
import { createAdminProjectSubmissionRouter } from "./sub-modules/project-submission/projectSubmission.route.js";
import { createAdminEvaluationOpsRouter } from "./sub-modules/evaluation-ops/evaluationOps.route.js";

export const createAdminRouter = (container) => {
  const router = Router();
  const adminRoles = roleGuard("admin", "department_head");

  router.use(authenticate, adminRoles);
  router.use("/", createAdminDashboardRouter(container));
  router.use("/", createAdminAccessControlRouter(container));
  router.use("/", createAdminStudentGroupRouter(container));
  router.use("/", createAdminProjectSubmissionRouter(container));
  router.use("/", createAdminEvaluationOpsRouter(container));
  router.use("/academic", createAdminAcademicRouter(container));

  return router;
};
