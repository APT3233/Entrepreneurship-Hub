import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
} from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";
import { TokenInvalid } from "app/core/errors/errorFactory.js";

export const createClassController = ({ classService }) => {
  const list = catchAsync(async (req, res) => {
    const result = await classService.getList(req.query, req.user);
    return sendPaginated(res, {
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      message: "Classes retrieved successfully",
    });
  });

  const stats = catchAsync(async (req, res, next) => {
    if (!req.user) return next(TokenInvalid());
    const result = await classService.getStats(req.query, req.user.id);
    return sendSuccess(res, {
      data: result,
      message: "Lecturer stats retrieved successfully",
    });
  });

  const studentStats = catchAsync(async (req, res, next) => {
    if (!req.user) return next(TokenInvalid());
    const result = await classService.getStudentStats(req.user.id);
    return sendSuccess(res, {
      data: result,
      message: "Student stats retrieved successfully",
    });
  });

  const overview = catchAsync(async (req, res, next) => {
    const cls = await classService.getOverview(req.params.id, req.user);
    return sendSuccess(res, {
      data: cls,
      message: "Class overview retrieved successfully",
    });
  });

  const getById = catchAsync(async (req, res) => {
    const cls = await classService.getById(req.params.id, req.user);
    return sendSuccess(res, {
      data: cls,
      message: "Class retrieved successfully",
    });
  });

  const create = catchAsync(async (req, res) => {
    const payload = { ...req.body, created_by: req.user?.id || null };
    // Tự gán lecturer_id = user hiện tại nếu client không chỉ định, để scope "mine" hoạt động đúng
    if (req.user?.id && !payload.lecturer_id) payload.lecturer_id = req.user.id;
    const cls = await classService.create(payload);
    return sendCreated(res, {
      data: cls,
      message: "Class created successfully",
    });
  });

  const update = catchAsync(async (req, res) => {
    const cls = await classService.update(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      data: cls,
      message: "Class updated successfully",
    });
  });

  const remove = catchAsync(async (req, res) => {
    await classService.remove(req.params.id, req.user);
    return sendNoContent(res);
  });

  return { list, getById, overview, stats, studentStats, create, update, remove };
};
