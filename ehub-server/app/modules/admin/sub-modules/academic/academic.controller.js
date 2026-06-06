import { sendCreated, sendNoContent, sendPaginated, sendSuccess } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createAdminAcademicController = ({ adminAcademicService }) => {
  const listSubjects = catchAsync(async (req, res) => {
    const result = await adminAcademicService.listSubjects(req.query);
    return sendPaginated(res, { ...result, message: "Subjects retrieved successfully" });
  });

  const getSubject = catchAsync(async (req, res) => {
    const data = await adminAcademicService.getSubject(req.params.id, {
      includeDeleted: req.query.include_deleted === "true",
    });
    return sendSuccess(res, { data, message: "Subject retrieved successfully" });
  });

  const createSubject = catchAsync(async (req, res) => {
    const data = await adminAcademicService.createSubject(req.body, req.user);
    return sendCreated(res, { data, message: "Subject created successfully" });
  });

  const updateSubject = catchAsync(async (req, res) => {
    const data = await adminAcademicService.updateSubject(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Subject updated successfully" });
  });

  const updateSubjectStatus = catchAsync(async (req, res) => {
    const data = await adminAcademicService.updateSubjectStatus(req.params.id, req.body.status, req.user);
    return sendSuccess(res, { data, message: "Subject status updated successfully" });
  });

  const deleteSubject = catchAsync(async (req, res) => {
    await adminAcademicService.deleteSubject(req.params.id, req.user);
    return sendNoContent(res);
  });

  const restoreSubject = catchAsync(async (req, res) => {
    const data = await adminAcademicService.restoreSubject(req.params.id, req.user);
    return sendSuccess(res, { data, message: "Subject restored successfully" });
  });

  const listSemesters = catchAsync(async (req, res) => {
    const result = await adminAcademicService.listSemesters(req.query);
    return sendPaginated(res, { ...result, message: "Semesters retrieved successfully" });
  });

  const getSemester = catchAsync(async (req, res) => {
    const data = await adminAcademicService.getSemester(req.params.id, {
      includeDeleted: req.query.include_deleted === "true",
    });
    return sendSuccess(res, { data, message: "Semester retrieved successfully" });
  });

  const createSemester = catchAsync(async (req, res) => {
    const data = await adminAcademicService.createSemester(req.body, req.user);
    return sendCreated(res, { data, message: "Semester created successfully" });
  });

  const updateSemester = catchAsync(async (req, res) => {
    const data = await adminAcademicService.updateSemester(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Semester updated successfully" });
  });

  const updateSemesterStatus = catchAsync(async (req, res) => {
    const data = await adminAcademicService.updateSemesterStatus(req.params.id, req.body.status, req.user);
    return sendSuccess(res, { data, message: "Semester status updated successfully" });
  });

  const listClasses = catchAsync(async (req, res) => {
    const result = await adminAcademicService.listClasses(req.query);
    return sendPaginated(res, { ...result, message: "Classes retrieved successfully" });
  });

  const getClass = catchAsync(async (req, res) => {
    const data = await adminAcademicService.getClass(req.params.id, {
      includeDeleted: req.query.include_deleted === "true",
    });
    return sendSuccess(res, { data, message: "Class retrieved successfully" });
  });

  const createClass = catchAsync(async (req, res) => {
    const data = await adminAcademicService.createClass(req.body, req.user);
    return sendCreated(res, { data, message: "Class created successfully" });
  });

  const updateClass = catchAsync(async (req, res) => {
    const data = await adminAcademicService.updateClass(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Class updated successfully" });
  });

  const updateClassStatus = catchAsync(async (req, res) => {
    const data = await adminAcademicService.updateClassStatus(req.params.id, req.body.status, req.user);
    return sendSuccess(res, { data, message: "Class status updated successfully" });
  });

  const deleteClass = catchAsync(async (req, res) => {
    await adminAcademicService.deleteClass(req.params.id, req.user);
    return sendNoContent(res);
  });

  const lookups = catchAsync(async (_req, res) => {
    const data = await adminAcademicService.getLookups();
    return sendSuccess(res, { data, message: "Academic lookups retrieved successfully" });
  });

  return {
    listSubjects,
    getSubject,
    createSubject,
    updateSubject,
    updateSubjectStatus,
    deleteSubject,
    restoreSubject,
    listSemesters,
    getSemester,
    createSemester,
    updateSemester,
    updateSemesterStatus,
    listClasses,
    getClass,
    createClass,
    updateClass,
    updateClassStatus,
    deleteClass,
    lookups,
  };
};
