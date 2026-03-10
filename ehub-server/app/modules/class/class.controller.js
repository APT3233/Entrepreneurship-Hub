import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
} from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createClassController = ({ classService }) => {
  const list = catchAsync(async (req, res) => {
    const result = await classService.getList(req.query);
    return sendPaginated(res, {
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      message: "Classes retrieved successfully",
    });
  });

  const getById = catchAsync(async (req, res) => {
    const cls = await classService.getById(req.params.id);
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
    const cls = await classService.update(req.params.id, req.body);
    return sendSuccess(res, {
      data: cls,
      message: "Class updated successfully",
    });
  });

  const remove = catchAsync(async (req, res) => {
    await classService.remove(req.params.id);
    return sendNoContent(res);
  });

  return { list, getById, create, update, remove };
};
