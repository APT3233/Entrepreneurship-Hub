import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
} from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createStudentController = ({ studentService }) => {
  const list = catchAsync(async (req, res) => {
    const result = await studentService.getList(req.query);
    return sendPaginated(res, {
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      message: "Students retrieved successfully",
    });
  });

  const getById = catchAsync(async (req, res) => {
    const student = await studentService.getById(req.params.id);
    return sendSuccess(res, {
      data: student,
      message: "Student retrieved successfully",
    });
  });

  const create = catchAsync(async (req, res) => {
    const student = await studentService.create(req.body);
    return sendCreated(res, {
      data: student,
      message: "Student created successfully",
    });
  });

  const update = catchAsync(async (req, res) => {
    const student = await studentService.update(req.params.id, req.body);
    return sendSuccess(res, {
      data: student,
      message: "Student updated successfully",
    });
  });

  const remove = catchAsync(async (req, res) => {
    await studentService.remove(req.params.id);
    return sendNoContent(res);
  });

  /**
   * Export students — placeholder
   */
  const exportStudents = catchAsync(async (req, res) => {
    // TODO: implement with importExport service
    return sendSuccess(res, {
      data: null,
      message: "Export not yet implemented",
    });
  });

  return { list, getById, create, update, remove, exportStudents };
};
