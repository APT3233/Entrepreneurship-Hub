import { sendSuccess } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createAnalyticsController = ({ analyticsService }) => {
  const overview = catchAsync(async (req, res) => sendSuccess(res, {
    data: await analyticsService.getOverview(req.query),
    message: "Analytics overview retrieved successfully",
  }));

  const academicQuality = catchAsync(async (req, res) => sendSuccess(res, {
    data: await analyticsService.getAcademicQuality(req.query),
    message: "Academic quality analytics retrieved successfully",
  }));

  const grading = catchAsync(async (req, res) => sendSuccess(res, {
    data: await analyticsService.getGradingAnalytics(req.query),
    message: "Grading analytics retrieved successfully",
  }));

  const rubric = catchAsync(async (req, res) => sendSuccess(res, {
    data: await analyticsService.getRubricAnalytics(req.query),
    message: "Rubric analytics retrieved successfully",
  }));

  const projects = catchAsync(async (req, res) => sendSuccess(res, {
    data: await analyticsService.getProjectAnalytics(req.query),
    message: "Project analytics retrieved successfully",
  }));

  const lecturer = catchAsync(async (req, res) => sendSuccess(res, {
    data: await analyticsService.getLecturerAnalytics(req.query, req.user),
    message: "Lecturer analytics retrieved successfully",
  }));

  const classAnalytics = catchAsync(async (req, res) => sendSuccess(res, {
    data: await analyticsService.getClassAnalytics(req.params.classId, req.query, req.user),
    message: "Class analytics retrieved successfully",
  }));

  return {
    overview,
    academicQuality,
    grading,
    rubric,
    projects,
    lecturer,
    classAnalytics,
  };
};
