import { sendCreated, sendPaginated, sendSuccess } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createAdminLecturerController = ({ adminLecturerService }) => {
  const listLecturers = catchAsync(async (req, res) => {
    const result = await adminLecturerService.listLecturers(req.query);
    return sendPaginated(res, { ...result, message: "Lecturers retrieved successfully" });
  });

  const getLecturer = catchAsync(async (req, res) => {
    const data = await adminLecturerService.getLecturer(req.params.id);
    return sendSuccess(res, { data, message: "Lecturer retrieved successfully" });
  });

  const createLecturer = catchAsync(async (req, res) => {
    const data = await adminLecturerService.createLecturer(req.body, req.user);
    return sendCreated(res, { data, message: "Lecturer created successfully" });
  });

  const updateLecturer = catchAsync(async (req, res) => {
    const data = await adminLecturerService.updateLecturer(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Lecturer updated successfully" });
  });

  const updateLecturerStatus = catchAsync(async (req, res) => {
    const data = await adminLecturerService.updateLecturerStatus(req.params.id, req.body.status, req.user);
    return sendSuccess(res, { data, message: "Lecturer status updated successfully" });
  });

  const updatePassword = catchAsync(async (req, res) => {
    const data = await adminLecturerService.updateLecturerPassword(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Lecturer password updated successfully" });
  });

  const deleteLecturer = catchAsync(async (req, res) => {
    const data = await adminLecturerService.deleteLecturer(req.params.id, req.user);
    return sendSuccess(res, { data, message: "Lecturer deleted successfully" });
  });

  const overview = catchAsync(async (req, res) => {
    const data = await adminLecturerService.getLecturerOverview(req.params.id);
    return sendSuccess(res, { data, message: "Lecturer overview retrieved successfully" });
  });

  const profile = catchAsync(async (req, res) => {
    const data = await adminLecturerService.getLecturerProfile(req.params.id);
    return sendSuccess(res, { data, message: "Lecturer profile retrieved successfully" });
  });

  const updateProfile = catchAsync(async (req, res) => {
    const data = await adminLecturerService.updateLecturerProfile(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Lecturer profile updated successfully" });
  });

  const classes = catchAsync(async (req, res) => {
    const result = await adminLecturerService.listLecturerClasses(req.params.id, req.query);
    return sendPaginated(res, { ...result, message: "Lecturer classes retrieved successfully" });
  });

  const assignClass = catchAsync(async (req, res) => {
    const data = await adminLecturerService.assignLecturerToClass({
      lecturerId: req.params.id,
      classId: req.body.class_id,
      force: req.body.force,
    }, req.user);
    return sendSuccess(res, { data, message: "Lecturer assigned successfully" });
  });

  const patchClassLecturer = catchAsync(async (req, res) => {
    const data = await adminLecturerService.assignLecturerToClass({
      lecturerId: req.body.lecturer_id,
      classId: req.params.classId,
      force: req.body.force,
    }, req.user);
    return sendSuccess(res, { data, message: "Class lecturer updated successfully" });
  });

  const availableClasses = catchAsync(async (req, res) => {
    const result = await adminLecturerService.listAvailableClasses(req.query);
    return sendPaginated(res, { ...result, message: "Available classes retrieved successfully" });
  });

  const grading = catchAsync(async (req, res) => {
    const data = await adminLecturerService.getLecturerGrading(req.params.id, req.query);
    return sendSuccess(res, { data, message: "Lecturer grading retrieved successfully" });
  });

  const createdContent = catchAsync(async (req, res) => {
    const data = await adminLecturerService.getCreatedContent(req.params.id);
    return sendSuccess(res, { data, message: "Lecturer content retrieved successfully" });
  });

  const activity = catchAsync(async (req, res) => {
    const result = await adminLecturerService.getLecturerActivity(req.params.id, req.query);
    return sendPaginated(res, {
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      message: "Lecturer activity retrieved successfully",
    });
  });

  const permissions = catchAsync(async (req, res) => {
    const data = await adminLecturerService.getLecturerPermissions(req.params.id);
    return sendSuccess(res, { data, message: "Lecturer permissions retrieved successfully" });
  });

  const workload = catchAsync(async (req, res) => {
    const result = await adminLecturerService.listWorkload(req.query);
    return sendPaginated(res, { ...result, message: "Lecturer workload retrieved successfully" });
  });

  const lookups = catchAsync(async (_req, res) => {
    const data = await adminLecturerService.getLookups();
    return sendSuccess(res, { data, message: "Lecturer lookups retrieved successfully" });
  });

  return {
    listLecturers,
    getLecturer,
    createLecturer,
    updateLecturer,
    updateLecturerStatus,
    updatePassword,
    deleteLecturer,
    overview,
    profile,
    updateProfile,
    classes,
    assignClass,
    patchClassLecturer,
    availableClasses,
    grading,
    createdContent,
    activity,
    permissions,
    workload,
    lookups,
  };
};
