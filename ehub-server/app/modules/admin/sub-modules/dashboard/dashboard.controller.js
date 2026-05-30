import { sendSuccess } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createAdminDashboardController = ({ adminDashboardService }) => {
  const dashboard = catchAsync(async (_req, res) => {
    const data = await adminDashboardService.getDashboard();
    return sendSuccess(res, { data, message: "Admin dashboard retrieved successfully" });
  });

  return {
    dashboard,
  };
};
