import { Router } from "express";
import { permissionGuard } from "app/core/middlewares/permissionGuard.js";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import {
  adminEmailEventParamSchema,
  adminEvaluationExportSchema,
  adminEvaluationOverviewSchema,
  adminEvaluationSessionIdParamSchema,
  adminImportExportActionSchema,
  adminInvitationActionSchema,
  adminRubricIdParamSchema,
  listAdminGradeAuditSchema,
  listAdminGradingProgressSchema,
  listAdminApiAccessLogsSchema,
  listAdminAuditLogsSchema,
  listAdminEvaluationResultsSchema,
  listAdminEvaluationSessionsSchema,
  listAdminImportLogsSchema,
  listAdminInvitationsSchema,
  listAdminRubricUsageSchema,
  listAdminRubricsSchema,
  updateAdminEvaluationSessionStatusSchema,
  updateAdminGradingConfigSchema,
} from "./evaluationOps.validation.js";

export const createAdminEvaluationOpsRouter = (container) => {
  const { adminEvaluationOpsController } = container.cradle;
  const router = Router();
  const can = (...permissions) => permissionGuard(container, ...permissions);

  router.get("/evaluation/lookups", can("ai.evaluation.admin_read"), adminEvaluationOpsController.getLookups);
  router.get("/evaluation", can("ai.evaluation.admin_read"), validateRequest(adminEvaluationOverviewSchema), adminEvaluationOpsController.getEvaluationOverview);

  router.get("/evaluation/rubrics", can("ai.evaluation.admin_read"), validateRequest(listAdminRubricsSchema), adminEvaluationOpsController.listRubrics);
  router.get("/evaluation/rubrics/:id", can("ai.evaluation.admin_read"), validateRequest(adminRubricIdParamSchema), adminEvaluationOpsController.getRubric);

  router.get("/evaluation/sessions", can("ai.evaluation.admin_read"), validateRequest(listAdminEvaluationSessionsSchema), adminEvaluationOpsController.listEvaluationSessions);
  router.get("/evaluation/sessions/:id", can("ai.evaluation.admin_read"), validateRequest(adminEvaluationSessionIdParamSchema), adminEvaluationOpsController.getEvaluationSessionDetail);
  router.post("/evaluation/sessions/:id/confirm", can("ai.evaluation.action"), validateRequest(updateAdminEvaluationSessionStatusSchema), adminEvaluationOpsController.confirmEvaluationSession);
  router.post("/evaluation/sessions/:id/reopen", can("ai.evaluation.action"), validateRequest(updateAdminEvaluationSessionStatusSchema), adminEvaluationOpsController.reopenEvaluationSession);

  router.get("/evaluation/grading-config", can("ai.evaluation.admin_read"), adminEvaluationOpsController.getGradingConfig);
  router.put("/evaluation/grading-config", can("ai.evaluation.action"), validateRequest(updateAdminGradingConfigSchema), adminEvaluationOpsController.updateGradingConfig);

  router.get("/evaluation/results", can("ai.evaluation.admin_read"), validateRequest(listAdminEvaluationResultsSchema), adminEvaluationOpsController.listEvaluationResults);
  router.get("/evaluation/progress", can("ai.evaluation.admin_read"), validateRequest(listAdminGradingProgressSchema), adminEvaluationOpsController.listGradingProgress);
  router.get("/evaluation/rubric-usage", can("ai.evaluation.admin_read"), validateRequest(listAdminRubricUsageSchema), adminEvaluationOpsController.listRubricUsage);
  router.get("/evaluation/grade-audit", can("ai.evaluation.admin_read"), validateRequest(listAdminGradeAuditSchema), adminEvaluationOpsController.listGradeAudit);
  router.get("/evaluation/exports", can("core.export", "ai.evaluation.admin_read"), adminEvaluationOpsController.getExportOptions);
  router.post("/evaluation/exports", can("core.export"), validateRequest(adminEvaluationExportSchema), adminEvaluationOpsController.exportScores);
  router.get("/evaluation/analytics", can("ai.evaluation.admin_read"), adminEvaluationOpsController.getAnalytics);

  router.get("/import-export/import-logs", can("core.export"), validateRequest(listAdminImportLogsSchema), adminEvaluationOpsController.listImportLogs);
  router.post("/import-export/:action", can("core.export"), validateRequest(adminImportExportActionSchema), adminEvaluationOpsController.plannedImportAction);

  router.get("/invitations", can("ai.evaluation.admin_read"), validateRequest(listAdminInvitationsSchema), adminEvaluationOpsController.listInvitations);
  router.post("/invitations/:type/:id/resend", can("ai.evaluation.action"), validateRequest(adminInvitationActionSchema), adminEvaluationOpsController.resendInvitation);
  router.post("/invitations/:type/:id/revoke", can("ai.evaluation.action"), validateRequest(adminInvitationActionSchema), adminEvaluationOpsController.revokeInvitation);
  router.post("/invitations/email-event/:id/retry", can("ai.evaluation.action"), validateRequest(adminEmailEventParamSchema), adminEvaluationOpsController.retryEmailEvent);

  router.get("/logs/audit", can("ai.evaluation.admin_read"), validateRequest(listAdminAuditLogsSchema), adminEvaluationOpsController.listAuditLogs);
  router.get("/logs/api-access", can("ai.evaluation.admin_read"), validateRequest(listAdminApiAccessLogsSchema), adminEvaluationOpsController.listApiAccessLogs);
  router.get("/logs/import", can("core.export"), validateRequest(listAdminImportLogsSchema), adminEvaluationOpsController.listImportLogs);

  return router;
};
