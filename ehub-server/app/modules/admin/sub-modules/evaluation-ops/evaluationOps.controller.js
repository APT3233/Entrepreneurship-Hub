import { sendPaginated, sendSuccess } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createAdminEvaluationOpsController = ({ adminEvaluationOpsService }) => {
  const getAuditMeta = (req) => ({
    ipAddress: req.ip,
    userAgent: req.get("user-agent") || null,
  });

  const getEvaluationOverview = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminEvaluationOpsService.getEvaluationOverview(req.query),
    message: "Evaluation overview retrieved successfully",
  }));

  const listRubrics = catchAsync(async (req, res) => {
    const result = await adminEvaluationOpsService.listRubrics(req.query);
    return sendPaginated(res, { ...result, message: result.message });
  });

  const getRubric = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminEvaluationOpsService.getRubric(req.params.id),
    message: "Rubric integration state retrieved successfully",
  }));

  const listEvaluationSessions = catchAsync(async (req, res) => {
    const result = await adminEvaluationOpsService.listEvaluationSessions(req.query);
    return sendPaginated(res, { ...result, message: "Evaluation sessions retrieved successfully" });
  });

  const getEvaluationSessionDetail = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminEvaluationOpsService.getEvaluationSessionDetail(req.params.id),
    message: "Evaluation session detail retrieved successfully",
  }));

  const confirmEvaluationSession = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminEvaluationOpsService.confirmEvaluationSession(req.params.id, req.body, req.user, getAuditMeta(req)),
    message: "Evaluation session confirmed successfully",
  }));

  const reopenEvaluationSession = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminEvaluationOpsService.reopenEvaluationSession(req.params.id, req.body, req.user, getAuditMeta(req)),
    message: "Evaluation session reopened successfully",
  }));

  const getGradingConfig = catchAsync(async (_req, res) => sendSuccess(res, {
    data: await adminEvaluationOpsService.getGradingConfig(),
    message: "Grading config retrieved successfully",
  }));

  const updateGradingConfig = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminEvaluationOpsService.updateGradingConfig(req.body, req.user),
    message: "Grading config updated successfully",
  }));

  const listEvaluationResults = catchAsync(async (req, res) => {
    const result = await adminEvaluationOpsService.listEvaluationResults(req.query);
    return sendPaginated(res, { ...result, message: "Evaluation results retrieved successfully" });
  });

  const listGradingProgress = catchAsync(async (req, res) => {
    const result = await adminEvaluationOpsService.listGradingProgress(req.query);
    return sendPaginated(res, { ...result, message: "Grading progress retrieved successfully" });
  });

  const listRubricUsage = catchAsync(async (req, res) => {
    const result = await adminEvaluationOpsService.listRubricUsage(req.query);
    return sendPaginated(res, { ...result, message: "Rubric usage retrieved successfully" });
  });

  const listGradeAudit = catchAsync(async (req, res) => {
    const result = await adminEvaluationOpsService.listGradeAudit(req.query);
    return sendPaginated(res, { ...result, message: "Grade audit logs retrieved successfully" });
  });

  const getExportOptions = catchAsync(async (_req, res) => sendSuccess(res, {
    data: adminEvaluationOpsService.getExportOptions(),
    message: "Evaluation export options retrieved successfully",
  }));

  const exportScores = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminEvaluationOpsService.exportScores(req.body),
    message: "Evaluation export generated successfully",
  }));

  const getAnalytics = catchAsync(async (_req, res) => sendSuccess(res, {
    data: await adminEvaluationOpsService.getAnalytics(),
    message: "Evaluation analytics retrieved successfully",
  }));

  const listImportLogs = catchAsync(async (req, res) => {
    const result = await adminEvaluationOpsService.listImportLogs(req.query);
    return sendPaginated(res, { ...result, message: "Import logs retrieved successfully" });
  });

  const listInvitations = catchAsync(async (req, res) => {
    const result = await adminEvaluationOpsService.listInvitations(req.query);
    return sendPaginated(res, { ...result, message: "Invitations retrieved successfully" });
  });

  const resendInvitation = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminEvaluationOpsService.resendInvitation(req.params.type, req.params.id, req.user),
    message: "Invitation queued successfully",
  }));

  const revokeInvitation = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminEvaluationOpsService.revokeInvitation(req.params.type, req.params.id, req.user),
    message: "Invitation revoked successfully",
  }));

  const retryEmailEvent = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminEvaluationOpsService.retryEmailEvent(req.params.id, req.user),
    message: "Email event queued successfully",
  }));

  const listAuditLogs = catchAsync(async (req, res) => {
    const result = await adminEvaluationOpsService.listAuditLogs(req.query);
    return sendPaginated(res, { ...result, message: "Audit logs retrieved successfully" });
  });

  const listApiAccessLogs = catchAsync(async (req, res) => {
    const result = await adminEvaluationOpsService.listApiAccessLogs(req.query);
    return sendPaginated(res, { ...result, message: "API access logs retrieved successfully" });
  });

  const getLookups = catchAsync(async (_req, res) => sendSuccess(res, {
    data: await adminEvaluationOpsService.getLookups(),
    message: "Evaluation lookups retrieved successfully",
  }));

  const plannedImportAction = catchAsync(async (req, res) => sendSuccess(res, {
    data: adminEvaluationOpsService.plannedAction(req.params.action || "import-export"),
    message: "Import/export action is planned",
  }));

  return {
    getEvaluationOverview,
    listRubrics,
    getRubric,
    listEvaluationSessions,
    getEvaluationSessionDetail,
    confirmEvaluationSession,
    reopenEvaluationSession,
    getGradingConfig,
    updateGradingConfig,
    listEvaluationResults,
    listGradingProgress,
    listRubricUsage,
    listGradeAudit,
    getExportOptions,
    exportScores,
    getAnalytics,
    listImportLogs,
    listInvitations,
    resendInvitation,
    revokeInvitation,
    retryEmailEvent,
    listAuditLogs,
    listApiAccessLogs,
    getLookups,
    plannedImportAction,
  };
};
