import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
} from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";
import { TokenInvalid } from "app/core/errors/errorFactory.js";

export const createGroupController = ({ groupService }) => {
  const list = catchAsync(async (req, res, next) => {
    if (req.query.lecturerScope === "mine" && !req.user) return next(TokenInvalid());
    const result = await groupService.getList(req.query, req.user?.id);
    return sendPaginated(res, {
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      message: "Groups retrieved successfully",
    });
  });

  const getById = catchAsync(async (req, res) => {
    const group = await groupService.getById(req.params.id, req.user);
    return sendSuccess(res, {
      data: group,
      message: "Group retrieved successfully",
    });
  });

  const create = catchAsync(async (req, res) => {
    const group = await groupService.create(
      {
        ...req.body,
        created_by: req.user?.id || null,
      },
      req.user
    );
    return sendCreated(res, {
      data: group,
      message: "Group created successfully",
    });
  });

  const update = catchAsync(async (req, res) => {
    const group = await groupService.update(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      data: group,
      message: "Group updated successfully",
    });
  });

  const remove = catchAsync(async (req, res) => {
    await groupService.remove(req.params.id, req.user);
    return sendNoContent(res);
  });

  const getMyGroups = catchAsync(async (req, res) => {
    const result = await groupService.getByStudent(req.user.id);
    return sendSuccess(res, {
      data: result.data,
      message: "My groups retrieved successfully",
    });
  });

  return { list, getById, create, update, remove, getMyGroups };
};
