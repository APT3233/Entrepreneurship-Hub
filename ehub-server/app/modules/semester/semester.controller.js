import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
} from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createSemesterController = ({ semesterService }) => {
  const list = catchAsync(async (req, res) => {
    const result = await semesterService.getList(req.query);
    return sendPaginated(res, {
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      message: "Semesters retrieved successfully",
    });
  });

  const getById = catchAsync(async (req, res) => {
    const semester = await semesterService.getById(req.params.id);
    return sendSuccess(res, {
      data: semester,
      message: "Semester retrieved successfully",
    });
  });

  const create = catchAsync(async (req, res) => {
    const semester = await semesterService.create({
      ...req.body,
      created_by: req.user?.id || null,
    });
    return sendCreated(res, {
      data: semester,
      message: "Semester created successfully",
    });
  });

  const update = catchAsync(async (req, res) => {
    const semester = await semesterService.update(req.params.id, req.body);
    return sendSuccess(res, {
      data: semester,
      message: "Semester updated successfully",
    });
  });

  const remove = catchAsync(async (req, res) => {
    await semesterService.remove(req.params.id);
    return sendNoContent(res);
  });

  return { list, getById, create, update, remove };
};
