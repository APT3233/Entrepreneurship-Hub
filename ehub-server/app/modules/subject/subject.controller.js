import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
} from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createSubjectController = ({ subjectService }) => {
  const list = catchAsync(async (req, res) => {
    const result = await subjectService.getList(req.query);
    return sendPaginated(res, {
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      message: "Subjects retrieved successfully",
    });
  });

  const getById = catchAsync(async (req, res) => {
    const subject = await subjectService.getById(req.params.id);
    return sendSuccess(res, {
      data: subject,
      message: "Subject retrieved successfully",
    });
  });

  const create = catchAsync(async (req, res) => {
    const subject = await subjectService.create({
      ...req.body,
      created_by: req.user?.id || null,
    });
    return sendCreated(res, {
      data: subject,
      message: "Subject created successfully",
    });
  });

  const update = catchAsync(async (req, res) => {
    const subject = await subjectService.update(req.params.id, req.body);
    return sendSuccess(res, {
      data: subject,
      message: "Subject updated successfully",
    });
  });

  const remove = catchAsync(async (req, res) => {
    await subjectService.remove(req.params.id);
    return sendNoContent(res);
  });

  return { list, getById, create, update, remove };
};
