import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
} from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";
import { TokenInvalid } from "app/core/errors/errorFactory.js";

export const createClassController = ({ classService }) => {
  const list = catchAsync(async (req, res, next) => {
    if (req.query.lecturerScope === "mine" && !req.user) return next(TokenInvalid());
    const result = await classService.getList(req.query, req.user?.id);
    return sendPaginated(res, {
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      message: "Classes retrieved successfully",
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
    const cls = await classService.create({
      ...req.body,
      created_by: req.user?.id || null,
    });
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

  return { list, getById, create, update, remove };
};
