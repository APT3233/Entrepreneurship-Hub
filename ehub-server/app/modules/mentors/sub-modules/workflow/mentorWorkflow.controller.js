import { sendCreated, sendNoContent, sendPaginated, sendSuccess } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createMentorWorkflowController = ({ mentorWorkflowService }) => {
  const listAdminAssignments = catchAsync(async (req, res) => {
    const result = await mentorWorkflowService.listAssignments(req.query, req.user, "admin");
    return sendPaginated(res, { ...result, message: "Mentor assignments retrieved successfully" });
  });

  const createAdminAssignment = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.createAssignment(req.body, req.user);
    return sendCreated(res, { data, message: "Mentor assignment created successfully" });
  });

  const getAssignment = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.getAssignment(req.params.id, req.user);
    return sendSuccess(res, { data, message: "Mentor assignment retrieved successfully" });
  });

  const updateAssignment = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.updateAssignment(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Mentor assignment updated successfully" });
  });

  const updateAssignmentStatus = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.updateAssignmentStatus(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Mentor assignment status updated successfully" });
  });

  const deleteAssignment = catchAsync(async (req, res) => {
    await mentorWorkflowService.deleteAssignment(req.params.id, req.user);
    return sendNoContent(res);
  });

  const listGroupMentors = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.listGroupMentors(req.params.groupId, req.user);
    return sendSuccess(res, { data, message: "Group mentors retrieved successfully" });
  });

  const replaceAssignment = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.replaceAssignment(req.params.id, req.body, req.user);
    return sendCreated(res, { data, message: "Mentor replaced successfully" });
  });

  const listGroupAssignments = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.listGroupAssignments(req.params.groupId, req.user);
    return sendSuccess(res, { data, message: "Group mentor assignments retrieved successfully" });
  });

  const createGroupAssignment = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.createAssignment(req.body, req.user, req.params.groupId);
    return sendCreated(res, { data, message: "Group mentor assignment created successfully" });
  });

  const listAssignmentRequests = catchAsync(async (req, res) => {
    const result = await mentorWorkflowService.listAssignmentRequests(req.query, req.user);
    return sendPaginated(res, { ...result, message: "Mentor assignment requests retrieved successfully" });
  });

  const updateAssignmentRequestStatus = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.updateAssignmentRequestStatus(req.params.id, req.body.status, req.user);
    return sendSuccess(res, { data, message: "Mentor assignment request updated successfully" });
  });

  const updateAttendance = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.updateAttendance(req.params.id, req.body.items, req.user);
    return sendSuccess(res, { data, message: "Attendance updated successfully" });
  });

  const listMyGroups = catchAsync(async (req, res) => {
    const { data } = await mentorWorkflowService.listMyGroups(req.user);
    return sendSuccess(res, { data, message: "Mentor groups retrieved successfully" });
  });

  const getMyGroup = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.getMyGroup(req.params.groupId, req.user);
    return sendSuccess(res, { data, message: "Mentor group detail retrieved successfully" });
  });

  const listLecturerClassAssignments = catchAsync(async (req, res) => {
    const result = await mentorWorkflowService.listAssignments({ ...req.query, class_id: req.params.classId }, req.user, "lecturer");
    return sendPaginated(res, { ...result, message: "Class mentor assignments retrieved successfully" });
  });

  const createAssignmentRequest = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.createAssignmentRequest(req.params.groupId, req.body, req.user);
    return sendCreated(res, { data, message: "Mentor assignment request created successfully" });
  });

  const listMyAssignments = catchAsync(async (req, res) => {
    const result = await mentorWorkflowService.listAssignments(req.query, req.user, "mentor");
    return sendPaginated(res, { ...result, message: "Mentor assignments retrieved successfully" });
  });

  const respondAssignment = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.respondAssignment(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Mentor assignment response saved successfully" });
  });

  const listAdminSessions = catchAsync(async (req, res) => {
    const result = await mentorWorkflowService.listSessions(req.query, req.user, "admin");
    return sendPaginated(res, { ...result, message: "Mentoring sessions retrieved successfully" });
  });

  const listMentorSessions = catchAsync(async (req, res) => {
    const result = await mentorWorkflowService.listSessions(req.query, req.user, "mentor");
    return sendPaginated(res, { ...result, message: "Mentoring sessions retrieved successfully" });
  });

  const createSession = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.createSession(req.body, req.user);
    return sendCreated(res, { data, message: "Mentoring session created successfully" });
  });

  const getSession = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.getSession(req.params.id, req.user);
    return sendSuccess(res, { data, message: "Mentoring session retrieved successfully" });
  });

  const updateSession = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.updateSession(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Mentoring session updated successfully" });
  });

  const updateSessionStatus = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.updateSessionStatus(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Mentoring session status updated successfully" });
  });

  const listLecturerClassSessions = catchAsync(async (req, res) => {
    const result = await mentorWorkflowService.listSessions({ ...req.query, class_id: req.params.classId }, req.user, "lecturer");
    return sendPaginated(res, { ...result, message: "Class mentoring sessions retrieved successfully" });
  });

  const listLecturerSessions = catchAsync(async (req, res) => {
    const result = await mentorWorkflowService.listSessions(req.query, req.user, "lecturer");
    return sendPaginated(res, { ...result, message: "Mentoring sessions retrieved successfully" });
  });

  const listGroupSessions = catchAsync(async (req, res) => {
    const result = await mentorWorkflowService.listGroupSessions(req.params.groupId, req.user, req.query);
    return sendPaginated(res, { ...result, message: "Group mentoring sessions retrieved successfully" });
  });

  const listNotes = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.getSession(req.params.id, req.user);
    return sendSuccess(res, { data: data.notes || [], message: "Mentoring session notes retrieved successfully" });
  });

  const createNote = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.createNote(req.params.id, req.body, req.user);
    return sendCreated(res, { data: data.notes || [], message: "Mentoring session note created successfully" });
  });

  const listFeedback = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.getSession(req.params.id, req.user);
    return sendSuccess(res, { data: data.feedback || [], message: "Mentoring feedback retrieved successfully" });
  });

  const createFeedback = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.createFeedback(req.params.id, req.body, req.user);
    return sendCreated(res, { data: data.feedback || [], message: "Mentoring feedback created successfully" });
  });

  const createActionItem = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.createActionItem(req.params.id, req.body, req.user);
    return sendCreated(res, { data: data.action_items || [], message: "Mentoring action item created successfully" });
  });

  const updateActionItemStatus = catchAsync(async (req, res) => {
    const data = await mentorWorkflowService.updateActionItemStatus(req.params.id, req.body.status, req.user);
    return sendSuccess(res, { data, message: "Mentoring action item updated successfully" });
  });

  const listAdminFeedback = catchAsync(async (req, res) => {
    const result = await mentorWorkflowService.listAdminFeedback(req.query);
    return sendPaginated(res, { ...result, message: "Mentoring feedback retrieved successfully" });
  });

  const listAdminActionItems = catchAsync(async (req, res) => {
    const result = await mentorWorkflowService.listAdminActionItems(req.query);
    return sendPaginated(res, { ...result, message: "Mentoring action items retrieved successfully" });
  });

  return {
    listAdminAssignments,
    createAdminAssignment,
    getAssignment,
    updateAssignment,
    updateAssignmentStatus,
    deleteAssignment,
    replaceAssignment,
    listGroupAssignments,
    listGroupMentors,
    listAssignmentRequests,
    updateAssignmentRequestStatus,
    updateAttendance,
    listMyGroups,
    getMyGroup,
    createGroupAssignment,
    listLecturerClassAssignments,
    createAssignmentRequest,
    listMyAssignments,
    respondAssignment,
    listAdminSessions,
    listMentorSessions,
    createSession,
    getSession,
    updateSession,
    updateSessionStatus,
    listLecturerSessions,
    listLecturerClassSessions,
    listGroupSessions,
    listNotes,
    createNote,
    listFeedback,
    createFeedback,
    createActionItem,
    updateActionItemStatus,
    listAdminFeedback,
    listAdminActionItems,
  };
};
