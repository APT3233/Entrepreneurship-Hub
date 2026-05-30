import { sendCreated, sendNoContent, sendPaginated, sendSuccess } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createEvaluationController = ({ evaluationService }) => {
  const getAuditMeta = (req) => ({
    ipAddress: req.ip,
    userAgent: req.get("user-agent") || null,
  });

  const listRubrics = catchAsync(async (req, res) => {
    const result = await evaluationService.listRubrics(req.query);
    return sendPaginated(res, {
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      message: "Rubrics retrieved successfully",
    });
  });

  const getRubric = catchAsync(async (req, res) => {
    const data = await evaluationService.getRubric(req.params.id);
    return sendSuccess(res, {
      data,
      message: "Rubric retrieved successfully",
    });
  });

  const createRubric = catchAsync(async (req, res) => {
    const data = await evaluationService.createRubric(req.body, req.user);
    return sendCreated(res, {
      data,
      message: "Rubric created successfully",
    });
  });

  const updateRubric = catchAsync(async (req, res) => {
    const data = await evaluationService.updateRubric(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      data,
      message: "Rubric updated successfully",
    });
  });

  const deleteRubric = catchAsync(async (req, res) => {
    await evaluationService.deleteRubric(req.params.id, req.user);
    return sendNoContent(res);
  });

  const cloneRubric = catchAsync(async (req, res) => {
    const data = await evaluationService.cloneRubric(req.params.id, req.body, req.user);
    return sendCreated(res, {
      data,
      message: "Rubric cloned successfully",
    });
  });

  const createCriterion = catchAsync(async (req, res) => {
    const data = await evaluationService.createCriterion(req.params.id, req.body, req.user);
    return sendCreated(res, {
      data,
      message: "Rubric criterion created successfully",
    });
  });

  const updateCriterion = catchAsync(async (req, res) => {
    const data = await evaluationService.updateCriterion(
      req.params.id,
      req.params.criterionId,
      req.body,
      req.user,
    );
    return sendSuccess(res, {
      data,
      message: "Rubric criterion updated successfully",
    });
  });

  const deleteCriterion = catchAsync(async (req, res) => {
    const data = await evaluationService.deleteCriterion(req.params.id, req.params.criterionId, req.user);
    return sendSuccess(res, {
      data,
      message: "Rubric criterion deleted successfully",
    });
  });

  const bindRubric = catchAsync(async (req, res) => {
    const data = await evaluationService.bindRubric(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      data,
      message: "Rubric bound successfully",
    });
  });

  const getGradingForm = catchAsync(async (req, res) => {
    const data = await evaluationService.getGradingForm(
      req.params.targetType,
      req.params.targetId,
      req.user,
    );
    return sendSuccess(res, {
      data,
      message: "Grading form retrieved successfully",
    });
  });

  const getGradingDashboard = catchAsync(async (req, res) => {
    const data = await evaluationService.getGradingDashboard(req.query, req.user);
    return sendSuccess(res, {
      data,
      message: "Grading dashboard retrieved successfully",
    });
  });

  const listGradingSubmissions = catchAsync(async (req, res) => {
    const result = await evaluationService.listGradingSubmissions(req.query, req.user);
    return sendPaginated(res, {
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      message: "Grading submissions retrieved successfully",
    });
  });

  const saveDraft = catchAsync(async (req, res) => {
    const data = await evaluationService.saveDraft(req.body, req.user, getAuditMeta(req));
    return sendSuccess(res, {
      data,
      message: "Evaluation draft saved successfully",
    });
  });

  const submitEvaluation = catchAsync(async (req, res) => {
    const data = await evaluationService.submitEvaluation(req.body, req.user, getAuditMeta(req));
    return sendSuccess(res, {
      data,
      message: "Evaluation submitted successfully",
    });
  });

  const getEvaluation = catchAsync(async (req, res) => {
    const data = await evaluationService.getEvaluation(req.params.id, req.user);
    return sendSuccess(res, {
      data,
      message: "Evaluation retrieved successfully",
    });
  });

  const listEvaluations = catchAsync(async (req, res) => {
    const result = await evaluationService.listEvaluations(req.query, req.user);
    return sendPaginated(res, {
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      message: "Evaluations retrieved successfully",
    });
  });

  return {
    listRubrics,
    getRubric,
    createRubric,
    updateRubric,
    deleteRubric,
    cloneRubric,
    createCriterion,
    updateCriterion,
    deleteCriterion,
    bindRubric,
    getGradingForm,
    getGradingDashboard,
    listGradingSubmissions,
    saveDraft,
    submitEvaluation,
    getEvaluation,
    listEvaluations,
  };
};
