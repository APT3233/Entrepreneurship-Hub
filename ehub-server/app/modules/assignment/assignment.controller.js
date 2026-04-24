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

  const getSubmissions = catchAsync(async (req, res) => {
    const data = await assignmentService.getSubmissions(req.params.id, req.user);
    return sendSuccess(res, {
      data,
      message: "Assignment submissions retrieved successfully",
    });
  });

  const gradeGroupSubmission = catchAsync(async (req, res) => {
    const data = await assignmentService.gradeGroupSubmission(
      req.params.id,
      req.params.groupId,
      { score: req.body.score, feedback: req.body.feedback },
      req.user
    );
    return sendSuccess(res, {
      data,
      message: "Đã lưu điểm và nhận xét",
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

  const initiateUpload = catchAsync(async (req, res) => {
    const result = await assignmentService.initiateUpload(req.body.file, req.user);
    return sendSuccess(res, {
      data: result,
      message: "Upload session created",
    });
  });

  const confirmUpload = catchAsync(async (req, res) => {
    const result = await assignmentService.confirmUpload(req.body.upload_token, req.user);
    return sendSuccess(res, {
      data: result,
      message: "Upload confirmed successfully",
    });
  });

  const initiateStudentSubmit = catchAsync(async (req, res) => {
    const result = await assignmentService.initiateStudentSubmit(
      req.params.id,
      req.user,
      req.body.files
    );
    return sendSuccess(res, {
      data: result,
      message: "Submit upload session created",
    });
  });

  const confirmStudentSubmit = catchAsync(async (req, res) => {
    const result = await assignmentService.confirmStudentSubmit(
      req.params.id,
      req.user,
      req.body.session_id
    );
    return sendSuccess(res, {
      data: result,
      message: "Bài tập đã được nộp thành công",
    });
  });

  return {
    list,
    getById,
    getSubmissions,
    gradeGroupSubmission,
    create,
    update,
    updateStatus,
    remove,
    initiateUpload,
    confirmUpload,
    initiateStudentSubmit,
    confirmStudentSubmit,
  };
};
