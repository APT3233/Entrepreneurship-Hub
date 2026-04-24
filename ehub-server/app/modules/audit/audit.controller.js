import { sendSuccess, sendPaginated } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createAuditController = ({ auditService }) => {
  /**
   * Lấy danh sách hoạt động của chính người dùng hiện tại
   */
  const getMyActivities = catchAsync(async (req, res) => {
    const { page = 1, limit = 5 } = req.query;
    const result = await auditService.getActivities(req.user.id, { 
      page: Number(page), 
      limit: Number(limit) 
    });
    
    return sendPaginated(res, {
      data: result.items,
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      message: "My activities retrieved successfully",
    });
  });

  return {
    getMyActivities,
  };
};
