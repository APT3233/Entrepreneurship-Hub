import { sendPaginated, sendSuccess } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createMentorAnalyticsController = ({ mentorAnalyticsService }) => {
  const overview = catchAsync(async (req, res) => sendSuccess(res, { data: await mentorAnalyticsService.overview(req.query), message: "Mentor analytics overview retrieved successfully" }));
  const workload = catchAsync(async (req, res) => sendPaginated(res, { ...(await mentorAnalyticsService.workload(req.query)), message: "Mentor workload retrieved successfully" }));
  const effectiveness = catchAsync(async (req, res) => sendPaginated(res, { ...(await mentorAnalyticsService.effectiveness(req.query)), message: "Mentor effectiveness retrieved successfully" }));
  const matching = catchAsync(async (req, res) => sendSuccess(res, { data: await mentorAnalyticsService.matching(req.query), message: "Mentor matching analytics retrieved successfully" }));
  const expertiseHeatmap = catchAsync(async (req, res) => sendSuccess(res, { data: await mentorAnalyticsService.expertiseHeatmap(req.query), message: "Mentor expertise heatmap retrieved successfully" }));
  const groupSupport = catchAsync(async (req, res) => sendPaginated(res, { ...(await mentorAnalyticsService.groupSupport(req.query)), message: "Mentor group support retrieved successfully" }));
  const ecosystem = catchAsync(async (req, res) => sendSuccess(res, { data: await mentorAnalyticsService.ecosystem(req.query), message: "Mentor ecosystem retrieved successfully" }));
  const lecturerDashboard = catchAsync(async (req, res) => sendSuccess(res, { data: await mentorAnalyticsService.lecturerDashboard(req.query, req.user), message: "Lecturer mentor analytics retrieved successfully" }));
  const mentorDashboard = catchAsync(async (req, res) => sendSuccess(res, { data: await mentorAnalyticsService.mentorDashboard(req.user), message: "Mentor dashboard retrieved successfully" }));

  return { overview, workload, effectiveness, matching, expertiseHeatmap, groupSupport, ecosystem, lecturerDashboard, mentorDashboard };
};
