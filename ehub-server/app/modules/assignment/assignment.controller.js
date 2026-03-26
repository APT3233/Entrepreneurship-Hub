import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createAssignmentController = ({ assignmentService }) => {
  const list = catchAsync(async (req, res) => {
    const result = await assignmentService.getList(req.query, req.user);
    return sendPaginated(res, {
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      message: "Assignments retrieved successfully",
    });
  });

  const getById = catchAsync(async (req, res) => {
    const assignment = await assignmentService.getById(req.params.id, req.user);
    return sendSuccess(res, {
      data: assignment,
      message: "Assignment retrieved successfully",
    });
  });

  const create = catchAsync(async (req, res) => {
    const assignments = await assignmentService.createBulk(req.body, req.user);
    return sendCreated(res, {
      data: assignments,
      message: "Assignments created successfully",
    });
  });

  const update = catchAsync(async (req, res) => {
    const assignment = await assignmentService.update(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      data: assignment,
      message: "Assignment updated successfully",
    });
  });

  const updateStatus = catchAsync(async (req, res) => {
    const assignment = await assignmentService.updateStatus(req.params.id, req.body.status, req.user);
    return sendSuccess(res, {
      data: assignment,
      message: "Assignment status updated successfully",
    });
  });

  const remove = catchAsync(async (req, res) => {
    await assignmentService.remove(req.params.id, req.user);
    return sendNoContent(res);
  });

  return { list, getById, create, update, updateStatus, remove };
};
