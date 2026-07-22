import { sendSuccess, sendCreated, sendNoContent } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

/**
 * Checkpoint Controller
 * Maps HTTP requests to service calls
 */
export const createCheckpointController = ({ checkpointService }) => {
  const list = catchAsync(async (req, res) => {
    const result = await checkpointService.getList(req.query, req.user);
    return sendSuccess(res, {
      data: result.data,
      message: "Checkpoints retrieved successfully",
    });
  });

  const getById = catchAsync(async (req, res) => {
    const checkpoint = await checkpointService.getById(req.params.id, req.user);
    return sendSuccess(res, {
      data: checkpoint,
      message: "Checkpoint retrieved successfully",
    });
  });

  const create = catchAsync(async (req, res) => {
    const checkpoint = await checkpointService.create(req.body, req.user);
    return sendCreated(res, {
      data: checkpoint,
      message: "Checkpoint created successfully",
    });
  });

  const createBulk = catchAsync(async (req, res) => {
    const result = await checkpointService.createBulk(req.body, req.user);
    return sendCreated(res, {
      data: result.results,
      message: `Successfully created checkpoints for ${result.results.length} classes.`,
    });
  });

  const update = catchAsync(async (req, res) => {
    const checkpoint = await checkpointService.update(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      data: checkpoint,
      message: "Checkpoint updated successfully",
    });
  });

  const remove = catchAsync(async (req, res) => {
    await checkpointService.remove(req.params.id, req.user);
    return sendNoContent(res);
  });

  const getSubmissions = catchAsync(async (req, res) => {
    const result = await checkpointService.getSubmissions(req.params.id, req.user);
    return sendSuccess(res, {
      data: result.data,
      message: "Submissions retrieved successfully",
    });
  });

  const getSubmissionDetail = catchAsync(async (req, res) => {
    const submission = await checkpointService.getSubmissionDetail(req.params.id, req.params.groupId, req.user);
    return sendSuccess(res, {
      data: submission,
      message: "Submission detail retrieved successfully",
    });
  });

  const updateGrade = catchAsync(async (req, res) => {
    const submission = await checkpointService.updateGrade(req.params.id, req.params.groupId, req.body, req.user);
    return sendSuccess(res, {
      data: submission,
      message: "Grade updated successfully",
    });
  });

  const getByGroup = catchAsync(async (req, res) => {
    const result = await checkpointService.getByGroup(req.params.groupId, req.user);
    return sendSuccess(res, {
      data: result.data,
      message: "Checkpoints for group retrieved successfully",
    });
  });

  const getStudentCheckpoints = catchAsync(async (req, res) => {
    const result = await checkpointService.getStudentCheckpoints(req.user, req.query);
    return sendSuccess(res, {
      data: result.data,
      message: "Student checkpoints retrieved successfully",
    });
  });

  const initiateUpload = catchAsync(async (req, res) => {
    const result = await checkpointService.initiateUpload(req.params.id, req.user.id, req.body.files);
    return sendSuccess(res, {
      data: result,
      message: "Upload session created",
    });
  });

  const confirmUpload = catchAsync(async (req, res) => {
    const result = await checkpointService.confirmUpload(
      req.params.id,
      req.body.session_id,
      req.user.id,
      { note: req.body.note }
    );
    return sendSuccess(res, {
      data: result,
      message: "Upload confirmed successfully",
    });
  });

  return { list, getById, create, createBulk, update, remove, getSubmissions, getSubmissionDetail, updateGrade, getByGroup, getStudentCheckpoints, initiateUpload, confirmUpload };
};


