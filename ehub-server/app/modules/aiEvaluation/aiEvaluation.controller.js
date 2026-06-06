import { HttpStatus } from "app/core/constants/httpStatus.js";
import { sendPaginated, sendSuccess } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createAiEvaluationController = ({ aiEvaluationService }) => {
  const getAuditMeta = (req) => ({
    ipAddress: req.ip,
    userAgent: req.get("user-agent") || null,
  });

  const analyze = catchAsync(async (req, res) => {
    const result = await aiEvaluationService.analyze(req.body, req.user, getAuditMeta(req));
    return sendSuccess(res, {
      data: result.data,
      statusCode: result.statusCode || HttpStatus.ACCEPTED,
      message: result.statusCode === HttpStatus.OK ? "AI suggestion retrieved successfully" : "AI analysis job queued successfully",
    });
  });

  const getJob = catchAsync(async (req, res) => {
    const data = await aiEvaluationService.getJob(req.params.id, req.user);
    return sendSuccess(res, { data, message: "AI analysis job retrieved successfully" });
  });

  const getLatestSuggestion = catchAsync(async (req, res) => {
    const data = await aiEvaluationService.getLatestSuggestion(req.params.targetType, req.params.targetId, req.user);
    return sendSuccess(res, { data, message: "AI suggestion retrieved successfully" });
  });

  const recordAction = catchAsync(async (req, res) => {
    const data = await aiEvaluationService.recordAction(req.params.id, req.body, req.user, getAuditMeta(req));
    return sendSuccess(res, { data, message: "AI suggestion action logged successfully" });
  });

  const listAdminSuggestions = catchAsync(async (req, res) => {
    const result = await aiEvaluationService.listAdminSuggestions(req.query, req.user);
    return sendPaginated(res, {
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      message: "AI suggestions retrieved successfully",
    });
  });

  const getAiSettings = catchAsync(async (req, res) => {
    const data = await aiEvaluationService.getAiSettings(req.user);
    return sendSuccess(res, { data, message: "AI settings retrieved successfully" });
  });

  const testAiSettings = catchAsync(async (req, res) => {
    const data = await aiEvaluationService.testAiSettings(req.body, req.user, getAuditMeta(req));
    return sendSuccess(res, { data, message: "AI settings connection tested successfully" });
  });

  const testConnection = catchAsync(async (req, res) => {
    const data = await aiEvaluationService.testConnection(req.body, req.user, getAuditMeta(req));
    return sendSuccess(res, { data, message: "AI provider connection tested successfully" });
  });

  const listProviderModels = catchAsync(async (req, res) => {
    const data = await aiEvaluationService.listProviderModels(req.body, req.user, getAuditMeta(req));
    return sendSuccess(res, { data, message: "AI provider models retrieved successfully" });
  });

  const testPrompt = catchAsync(async (req, res) => {
    const data = await aiEvaluationService.testPrompt(req.body, req.user, getAuditMeta(req));
    return sendSuccess(res, { data, message: "AI provider prompt tested successfully" });
  });

  const updateAiSettings = catchAsync(async (req, res) => {
    const data = await aiEvaluationService.updateAiSettings(req.body, req.user, getAuditMeta(req));
    return sendSuccess(res, { data, message: "AI settings updated successfully" });
  });

  return {
    analyze,
    getJob,
    getLatestSuggestion,
    recordAction,
    listAdminSuggestions,
    getAiSettings,
    listProviderModels,
    testConnection,
    testPrompt,
    testAiSettings,
    updateAiSettings,
  };
};
