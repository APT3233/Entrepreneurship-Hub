import { Router } from "express";
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

  router.get("/evaluation/lookups", adminEvaluationOpsController.getLookups);
  router.get("/evaluation", validateRequest(adminEvaluationOverviewSchema), adminEvaluationOpsController.getEvaluationOverview);

  router.get("/evaluation/rubrics", validateRequest(listAdminRubricsSchema), adminEvaluationOpsController.listRubrics);
  router.get("/evaluation/rubrics/:id", validateRequest(adminRubricIdParamSchema), adminEvaluationOpsController.getRubric);

  router.get("/evaluation/sessions", validateRequest(listAdminEvaluationSessionsSchema), adminEvaluationOpsController.listEvaluationSessions);
  router.get("/evaluation/sessions/:id", validateRequest(adminEvaluationSessionIdParamSchema), adminEvaluationOpsController.getEvaluationSessionDetail);
  router.post("/evaluation/sessions/:id/confirm", validateRequest(updateAdminEvaluationSessionStatusSchema), adminEvaluationOpsController.confirmEvaluationSession);
  router.post("/evaluation/sessions/:id/reopen", validateRequest(updateAdminEvaluationSessionStatusSchema), adminEvaluationOpsController.reopenEvaluationSession);

  router.get("/evaluation/grading-config", adminEvaluationOpsController.getGradingConfig);
  router.put("/evaluation/grading-config", validateRequest(updateAdminGradingConfigSchema), adminEvaluationOpsController.updateGradingConfig);

  router.get("/evaluation/results", validateRequest(listAdminEvaluationResultsSchema), adminEvaluationOpsController.listEvaluationResults);
  router.get("/evaluation/progress", validateRequest(listAdminGradingProgressSchema), adminEvaluationOpsController.listGradingProgress);
  router.get("/evaluation/rubric-usage", validateRequest(listAdminRubricUsageSchema), adminEvaluationOpsController.listRubricUsage);
  router.get("/evaluation/grade-audit", validateRequest(listAdminGradeAuditSchema), adminEvaluationOpsController.listGradeAudit);
  router.get("/evaluation/exports", adminEvaluationOpsController.getExportOptions);
  router.post("/evaluation/exports", validateRequest(adminEvaluationExportSchema), adminEvaluationOpsController.exportScores);
  router.get("/evaluation/analytics", adminEvaluationOpsController.getAnalytics);

  router.get("/import-export/import-logs", validateRequest(listAdminImportLogsSchema), adminEvaluationOpsController.listImportLogs);
  router.post("/import-export/:action", validateRequest(adminImportExportActionSchema), adminEvaluationOpsController.plannedImportAction);

  router.get("/invitations", validateRequest(listAdminInvitationsSchema), adminEvaluationOpsController.listInvitations);
  router.post("/invitations/:type/:id/resend", validateRequest(adminInvitationActionSchema), adminEvaluationOpsController.resendInvitation);
  router.post("/invitations/:type/:id/revoke", validateRequest(adminInvitationActionSchema), adminEvaluationOpsController.revokeInvitation);
  router.post("/invitations/email-event/:id/retry", validateRequest(adminEmailEventParamSchema), adminEvaluationOpsController.retryEmailEvent);

  router.get("/logs/audit", validateRequest(listAdminAuditLogsSchema), adminEvaluationOpsController.listAuditLogs);
  router.get("/logs/api-access", validateRequest(listAdminApiAccessLogsSchema), adminEvaluationOpsController.listApiAccessLogs);
  router.get("/logs/import", validateRequest(listAdminImportLogsSchema), adminEvaluationOpsController.listImportLogs);

  return router;
};
