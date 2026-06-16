import { sendCreated, sendPaginated, sendSuccess } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createAdminProjectSubmissionController = ({ adminProjectSubmissionService }) => {
  const listProjects = catchAsync(async (req, res) => {
    const result = await adminProjectSubmissionService.listProjects(req.query);
    return sendPaginated(res, { ...result, message: "Projects retrieved successfully" });
  });
  const getProject = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminProjectSubmissionService.getProject(req.params.id),
    message: "Project retrieved successfully",
  }));
  const updateProject = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminProjectSubmissionService.updateProject(req.params.id, req.body, req.user),
    message: "Project updated successfully",
  }));

  const listCheckpoints = catchAsync(async (req, res) => {
    const result = await adminProjectSubmissionService.listCheckpoints(req.query);
    return sendPaginated(res, { ...result, message: "Checkpoints retrieved successfully" });
  });
  const getCheckpoint = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminProjectSubmissionService.getCheckpoint(req.params.id),
    message: "Checkpoint retrieved successfully",
  }));
  const createCheckpoint = catchAsync(async (req, res) => sendCreated(res, {
    data: await adminProjectSubmissionService.createCheckpoint(req.body, req.user),
    message: "Checkpoint created successfully",
  }));
  const updateCheckpoint = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminProjectSubmissionService.updateCheckpoint(req.params.id, req.body, req.user),
    message: "Checkpoint updated successfully",
  }));
  const updateCheckpointStatus = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminProjectSubmissionService.updateCheckpointStatus(req.params.id, req.body.status, req.user),
    message: "Checkpoint status updated successfully",
  }));
  const deleteCheckpoint = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminProjectSubmissionService.deleteCheckpoint(req.params.id, req.user),
    message: "Checkpoint deleted successfully",
  }));
  const duplicateCheckpoint = catchAsync(async (req, res) => sendCreated(res, {
    data: await adminProjectSubmissionService.duplicateCheckpoint(req.params.id, req.user),
    message: "Checkpoint duplicated successfully",
  }));

  const listCheckpointSubmissions = catchAsync(async (req, res) => {
    const result = await adminProjectSubmissionService.listCheckpointSubmissions(req.query);
    return sendPaginated(res, { ...result, message: "Checkpoint submissions retrieved successfully" });
  });
  const getCheckpointSubmission = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminProjectSubmissionService.getCheckpointSubmission(req.params.id),
    message: "Checkpoint submission retrieved successfully",
  }));
  const gradeCheckpointSubmission = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminProjectSubmissionService.gradeCheckpointSubmission(req.params.id, req.body, req.user),
    message: "Checkpoint submission graded successfully",
  }));

  const listAssignments = catchAsync(async (req, res) => {
    const result = await adminProjectSubmissionService.listAssignments(req.query);
    return sendPaginated(res, { ...result, message: "Assignments retrieved successfully" });
  });
  const getAssignment = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminProjectSubmissionService.getAssignment(req.params.id),
    message: "Assignment retrieved successfully",
  }));
  const createAssignment = catchAsync(async (req, res) => sendCreated(res, {
    data: await adminProjectSubmissionService.createAssignment(req.body, req.user),
    message: "Assignment created successfully",
  }));
  const updateAssignment = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminProjectSubmissionService.updateAssignment(req.params.id, req.body, req.user),
    message: "Assignment updated successfully",
  }));
  const updateAssignmentStatus = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminProjectSubmissionService.updateAssignmentStatus(req.params.id, req.body.status, req.user),
    message: "Assignment status updated successfully",
  }));
  const deleteAssignment = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminProjectSubmissionService.deleteAssignment(req.params.id, req.user),
    message: "Assignment deleted successfully",
  }));

  const listAssignmentSubmissions = catchAsync(async (req, res) => {
    const result = await adminProjectSubmissionService.listAssignmentSubmissions(req.query);
    return sendPaginated(res, { ...result, message: "Assignment submissions retrieved successfully" });
  });
  const getAssignmentSubmission = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminProjectSubmissionService.getAssignmentSubmission(req.params.id),
    message: "Assignment submission retrieved successfully",
  }));
  const gradeAssignmentSubmission = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminProjectSubmissionService.gradeAssignmentSubmission(req.params.id, req.body, req.user),
    message: "Assignment submission graded successfully",
  }));

  const listSubmissionFiles = catchAsync(async (req, res) => {
    const result = await adminProjectSubmissionService.listSubmissionFiles(req.query);
    return sendPaginated(res, { ...result, message: "Submission files retrieved successfully" });
  });
  const deleteSubmissionFile = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminProjectSubmissionService.updateSubmissionFileDeleted(req.params.source, req.params.id, true, req.user),
    message: "Submission file deleted successfully",
  }));
  const restoreSubmissionFile = catchAsync(async (req, res) => sendSuccess(res, {
    data: await adminProjectSubmissionService.updateSubmissionFileDeleted(req.params.source, req.params.id, false, req.user),
    message: "Submission file restored successfully",
  }));

  const lookups = catchAsync(async (_req, res) => sendSuccess(res, {
    data: await adminProjectSubmissionService.getLookups(),
    message: "Project submission lookups retrieved successfully",
  }));

  return {
    listProjects,
    getProject,
    updateProject,
    listCheckpoints,
    getCheckpoint,
    createCheckpoint,
    updateCheckpoint,
    updateCheckpointStatus,
    deleteCheckpoint,
    duplicateCheckpoint,
    listCheckpointSubmissions,
    getCheckpointSubmission,
    gradeCheckpointSubmission,
    listAssignments,
    getAssignment,
    createAssignment,
    updateAssignment,
    updateAssignmentStatus,
    deleteAssignment,
    listAssignmentSubmissions,
    getAssignmentSubmission,
    gradeAssignmentSubmission,
    listSubmissionFiles,
    deleteSubmissionFile,
    restoreSubmissionFile,
    lookups,
  };
};
