import { sendCreated, sendNoContent, sendPaginated, sendSuccess } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createAdminStudentGroupController = ({ adminStudentGroupService }) => {
  const listStudents = catchAsync(async (req, res) => {
    const result = await adminStudentGroupService.listStudents(req.query);
    return sendPaginated(res, { ...result, message: "Students retrieved successfully" });
  });

  const getStudent = catchAsync(async (req, res) => {
    const data = await adminStudentGroupService.getStudent(req.params.id);
    return sendSuccess(res, { data, message: "Student retrieved successfully" });
  });

  const createStudent = catchAsync(async (req, res) => {
    const data = await adminStudentGroupService.createStudent(req.body, req.user);
    return sendCreated(res, { data, message: "Student created successfully" });
  });

  const updateStudent = catchAsync(async (req, res) => {
    const data = await adminStudentGroupService.updateStudent(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Student updated successfully" });
  });

  const deleteStudent = catchAsync(async (req, res) => {
    await adminStudentGroupService.deleteStudent(req.params.id, req.user);
    return sendNoContent(res);
  });

  const listEnrollments = catchAsync(async (req, res) => {
    const result = await adminStudentGroupService.listEnrollments(req.query);
    return sendPaginated(res, { ...result, message: "Enrollments retrieved successfully" });
  });

  const addEnrollment = catchAsync(async (req, res) => {
    const data = await adminStudentGroupService.addEnrollment(req.body, req.user);
    return sendCreated(res, { data, message: "Enrollment created successfully" });
  });

  const bulkAddEnrollments = catchAsync(async (req, res) => {
    const data = await adminStudentGroupService.bulkAddEnrollments(req.body, req.user);
    return sendSuccess(res, { data, message: "Bulk enrollment processed successfully" });
  });

  const updateEnrollmentStatus = catchAsync(async (req, res) => {
    const data = await adminStudentGroupService.updateEnrollmentStatus(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Enrollment status updated successfully" });
  });

  const sendEnrollmentInvite = catchAsync(async (req, res) => {
    const data = await adminStudentGroupService.sendEnrollmentInvite(req.params.id, req.user);
    return sendSuccess(res, { data, message: "Class invite queued successfully" });
  });

  const listStudentsWithoutGroup = catchAsync(async (req, res) => {
    const data = await adminStudentGroupService.listStudentsWithoutGroup(req.params.classId);
    return sendSuccess(res, { data, message: "Students without group retrieved successfully" });
  });

  const listGroups = catchAsync(async (req, res) => {
    const result = await adminStudentGroupService.listGroups(req.query);
    return sendPaginated(res, { ...result, message: "Groups retrieved successfully" });
  });

  const getGroup = catchAsync(async (req, res) => {
    const data = await adminStudentGroupService.getGroup(req.params.id);
    return sendSuccess(res, { data, message: "Group retrieved successfully" });
  });

  const createGroup = catchAsync(async (req, res) => {
    const data = await adminStudentGroupService.createGroup(req.body, req.user);
    return sendCreated(res, { data, message: "Group created successfully" });
  });

  const updateGroup = catchAsync(async (req, res) => {
    const data = await adminStudentGroupService.updateGroup(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Group updated successfully" });
  });

  const deleteGroup = catchAsync(async (req, res) => {
    await adminStudentGroupService.deleteGroup(req.params.id, req.user);
    return sendNoContent(res);
  });

  const addGroupMember = catchAsync(async (req, res) => {
    const data = await adminStudentGroupService.addGroupMember(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Group member added successfully" });
  });

  const updateGroupMember = catchAsync(async (req, res) => {
    const data = await adminStudentGroupService.updateGroupMember(req.params.id, req.params.studentId, req.body, req.user);
    return sendSuccess(res, { data, message: "Group member updated successfully" });
  });

  const removeGroupMember = catchAsync(async (req, res) => {
    const data = await adminStudentGroupService.removeGroupMember(req.params.id, req.params.studentId, req.user);
    return sendSuccess(res, { data, message: "Group member removed successfully" });
  });

  const listGroupInvites = catchAsync(async (req, res) => {
    const result = await adminStudentGroupService.listGroupInvites(req.query);
    return sendPaginated(res, { ...result, message: "Group invites retrieved successfully" });
  });

  const updateGroupInviteStatus = catchAsync(async (req, res) => {
    const data = await adminStudentGroupService.updateGroupInviteStatus(req.params.id, req.body.status, req.user);
    return sendSuccess(res, { data, message: "Group invite updated successfully" });
  });

  const listGroupReports = catchAsync(async (req, res) => {
    const result = await adminStudentGroupService.listGroupReports(req.query);
    return sendPaginated(res, { ...result, message: "Group reports retrieved successfully" });
  });

  const getGroupReport = catchAsync(async (req, res) => {
    const data = await adminStudentGroupService.getGroupReport(req.params.id);
    return sendSuccess(res, { data, message: "Group report retrieved successfully" });
  });

  const lookups = catchAsync(async (_req, res) => {
    const data = await adminStudentGroupService.getLookups();
    return sendSuccess(res, { data, message: "Student group lookups retrieved successfully" });
  });

  return {
    listStudents,
    getStudent,
    createStudent,
    updateStudent,
    deleteStudent,
    listEnrollments,
    addEnrollment,
    bulkAddEnrollments,
    sendEnrollmentInvite,
    updateEnrollmentStatus,
    listStudentsWithoutGroup,
    listGroups,
    getGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    addGroupMember,
    updateGroupMember,
    removeGroupMember,
    listGroupInvites,
    updateGroupInviteStatus,
    listGroupReports,
    getGroupReport,
    lookups,
  };
};
