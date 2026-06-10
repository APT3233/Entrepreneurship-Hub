import { AlreadyExists, BadRequest, Forbidden, NotFound } from "app/core/errors/errorFactory.js";
import { parsePagination } from "app/core/utils/pagination.js";

const nullable = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
};

const dateOnly = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

const toMysqlDateTime = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace("T", " ");
};

const durationMinutes = (start, end) => {
  if (!start || !end) return null;
  const s = start instanceof Date ? start : new Date(start);
  const e = end instanceof Date ? end : new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return null;
  return Math.round((e.getTime() - s.getTime()) / 60000);
};

const roles = (actor) => (actor?.roles || []).map((role) => String(role).toLowerCase());
const hasRole = (actor, ...allowed) => roles(actor).some((role) => allowed.includes(role));
const hasPermission = (actor, permission) => (actor?.permissions || []).includes(permission);

export const createMentorWorkflowService = ({ mentorWorkflowRepository, transaction, auditService }) => {
  const isAdminOrDept = (actor) => hasRole(actor, "admin", "department_head");

  const assertLecturerOwnsClass = async (actor, classId) => {
    if (isAdminOrDept(actor)) return;
    if (!hasRole(actor, "lecturer")) throw Forbidden("Lecturer access required");
    if (!await mentorWorkflowRepository.userOwnsClass(actor.id, classId)) throw Forbidden("Class does not belong to you");
  };

  const assertGroupVisibleToActor = async (actor, groupId) => {
    if (isAdminOrDept(actor)) return;
    const group = await mentorWorkflowRepository.findGroupContext(groupId);
    if (!group) throw NotFound("Group");
    if (hasRole(actor, "lecturer")) return assertLecturerOwnsClass(actor, group.class_id);
    if (hasRole(actor, "student") && await mentorWorkflowRepository.userInGroup(actor.id, groupId)) return;
    throw Forbidden("Group access denied");
  };

  const assertSessionVisibleToActor = async (actor, session) => {
    if (isAdminOrDept(actor)) return;
    if (hasRole(actor, "mentor")) {
      const mentor = await mentorWorkflowRepository.findMentorByUserId(actor.id);
      if (mentor && Number(mentor.id) === Number(session.mentor_id)) return;
    }
    if (hasRole(actor, "lecturer")) return assertLecturerOwnsClass(actor, session.class_id);
    if (hasRole(actor, "student") && await mentorWorkflowRepository.userInGroup(actor.id, session.group_id)) return;
    throw Forbidden("Session access denied");
  };

  const getAssignmentOrFail = async (id) => {
    const assignment = await mentorWorkflowRepository.findAssignmentById(id);
    if (!assignment) throw NotFound("Mentor assignment");
    return assignment;
  };

  const getSessionOrFail = async (id) => {
    const session = await mentorWorkflowRepository.findSessionById(id);
    if (!session) throw NotFound("Mentoring session");
    return session;
  };

  const normalizeAssignment = (data, group) => ({
    mentor_id: Number(data.mentor_id),
    group_id: Number(group.id),
    class_id: Number(group.class_id),
    semester_id: Number(group.semester_id),
    subject_id: Number(group.subject_id),
    assignment_type: data.assignment_type || "primary",
    status: data.status || "pending_mentor",
    start_date: dateOnly(data.start_date),
    end_date: dateOnly(data.end_date),
    expected_sessions: data.expected_sessions === null || data.expected_sessions === "" ? null : Number(data.expected_sessions || 0),
    note: nullable(data.note),
    rejection_reason: nullable(data.rejection_reason),
  });

  const validateAssignmentRules = async (payload, excludeId = null) => {
    const mentor = await mentorWorkflowRepository.findAssignableMentor(payload.mentor_id);
    if (!mentor) throw BadRequest("Mentor is not available for assignment");
    if (await mentorWorkflowRepository.countOpenAssignmentForPair(payload.mentor_id, payload.group_id, excludeId)) {
      throw AlreadyExists("Mentor already has an open assignment for this group");
    }
    if (payload.status === "active" && payload.assignment_type === "primary" && await mentorWorkflowRepository.countActivePrimaryForGroup(payload.group_id, excludeId)) {
      throw AlreadyExists("Group already has an active primary mentor");
    }
    const expertise = await mentorWorkflowRepository.listMentorExpertise(payload.mentor_id);
    const activeAssignments = await mentorWorkflowRepository.countMentorActiveAssignments(payload.mentor_id);
    const warnings = [];
    if (payload.assignment_type === "business" && mentor.mentor_type !== "business" && !expertise.some((item) => item.category === "business")) {
      warnings.push("Selected mentor is not marked as business mentor and has no business expertise.");
    }
    if (payload.assignment_type === "technical" && mentor.mentor_type !== "technical" && !expertise.some((item) => item.category === "technical" || item.category === "ai" || item.category === "data")) {
      warnings.push("Selected mentor is not marked as technical mentor and has no technical expertise.");
    }
    if (activeAssignments >= 5) warnings.push("Mentor has high active assignment workload.");
    return { mentor, expertise, warnings };
  };

  const writeAssignmentHistory = async (assignmentId, action, actor, oldValues, newValues, note, conn = null) => {
    await mentorWorkflowRepository.insertAssignmentHistory({
      assignment_id: assignmentId,
      action,
      old_values: oldValues,
      new_values: newValues,
      actor_id: actor?.id || null,
      note: nullable(note),
    }, conn || undefined);
  };

  const listAssignments = async (query, actor, scope = "admin") => {
    const pagination = parsePagination(query);
    const filters = {
      semesterId: query.semester_id || null,
      subjectId: query.subject_id || null,
      classId: query.class_id || null,
      groupId: query.group_id || null,
      mentorId: query.mentor_id || null,
      assignmentType: nullable(query.assignment_type),
      status: nullable(query.status),
      search: nullable(query.search),
      limit: pagination.limit,
      offset: pagination.offset,
    };
    if (scope === "lecturer") filters.lecturerId = actor.id;
    if (scope === "mentor") {
      const mentor = await mentorWorkflowRepository.findMentorByUserId(actor.id);
      if (!mentor) return { data: [], ...pagination, total: 0 };
      filters.mentorId = mentor.id;
    }
    const result = await mentorWorkflowRepository.listAssignments(filters);
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getAssignment = async (id, actor) => {
    const assignment = await getAssignmentOrFail(id);
    if (!isAdminOrDept(actor)) {
      if (hasRole(actor, "lecturer")) await assertLecturerOwnsClass(actor, assignment.class_id);
      else if (hasRole(actor, "mentor")) {
        const mentor = await mentorWorkflowRepository.findMentorByUserId(actor.id);
        if (!mentor || Number(mentor.id) !== Number(assignment.mentor_id)) throw Forbidden("Assignment access denied");
      } else throw Forbidden("Assignment access denied");
    }
    const [history, existingMentors, requests] = await Promise.all([
      mentorWorkflowRepository.listAssignmentHistory(id),
      mentorWorkflowRepository.listActiveAssignmentsForGroup(assignment.group_id),
      mentorWorkflowRepository.listOpenRequestsForGroup(assignment.group_id),
    ]);
    return { ...assignment, history, existing_mentors: existingMentors, open_requests: requests };
  };

  const createAssignment = async (data, actor, forcedGroupId = null) => {
    const groupId = forcedGroupId || data.group_id;
    const group = await mentorWorkflowRepository.findGroupContext(groupId);
    if (!group) throw NotFound("Group");
    if (hasRole(actor, "lecturer") && !isAdminOrDept(actor)) await assertLecturerOwnsClass(actor, group.class_id);
    const payload = normalizeAssignment({ ...data, group_id: groupId }, group);
    if (payload.status === "active" && !hasPermission(actor, "mentor.assignment.approve")) {
      throw Forbidden("Approver permission is required to create active assignments");
    }
    const { warnings } = await validateAssignmentRules(payload);
    payload.assigned_by = actor?.id || null;
    payload.approved_by = payload.status === "active" ? actor?.id || null : null;
    const id = await transaction.run(async (conn) => {
      const createdId = await mentorWorkflowRepository.createAssignment(payload, conn);
      await writeAssignmentHistory(createdId, payload.status === "active" ? "approved" : "proposed", actor, null, payload, payload.note, conn);
      return createdId;
    });
    await auditService.log({ userId: actor?.id || null, action: "mentor_assignment_create", tableName: "mentor_assignments", recordId: id, newValues: payload });
    return { ...(await getAssignment(id, actor)), warnings };
  };

  const updateAssignment = async (id, data, actor) => {
    const current = await getAssignmentOrFail(id);
    const updates = {
      assignment_type: data.assignment_type,
      start_date: data.start_date !== undefined ? dateOnly(data.start_date) : undefined,
      end_date: data.end_date !== undefined ? dateOnly(data.end_date) : undefined,
      expected_sessions: data.expected_sessions === undefined ? undefined : (data.expected_sessions === null || data.expected_sessions === "" ? null : Number(data.expected_sessions)),
      note: data.note !== undefined ? nullable(data.note) : undefined,
    };
    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);
    const next = { ...current, ...updates };
    await validateAssignmentRules(next, id);
    await transaction.run(async (conn) => {
      await mentorWorkflowRepository.updateAssignment(id, updates, conn);
      await writeAssignmentHistory(id, "changed", actor, current, updates, data.note, conn);
    });
    await auditService.log({ userId: actor?.id || null, action: "mentor_assignment_update", tableName: "mentor_assignments", recordId: id, oldValues: current, newValues: updates });
    return getAssignment(id, actor);
  };

  const actionForStatus = (status) => ({ active: "approved", rejected: "rejected", cancelled: "cancelled", completed: "completed" }[status] || "changed");

  const updateAssignmentStatus = async (id, data, actor) => {
    const current = await getAssignmentOrFail(id);
    const status = data.status;
    if (["active", "rejected"].includes(status) && !hasPermission(actor, "mentor.assignment.approve")) throw Forbidden("Approve permission required");
    if (status === "cancelled" && !hasPermission(actor, "mentor.assignment.cancel")) throw Forbidden("Cancel permission required");
    if (status === "completed" && !hasPermission(actor, "mentor.assignment.complete")) throw Forbidden("Complete permission required");
    if (status === "rejected" && !nullable(data.rejection_reason)) throw BadRequest("Rejection reason is required");
    const updates = { status, rejection_reason: nullable(data.rejection_reason) };
    if (status === "active") {
      await validateAssignmentRules({ ...current, status }, id);
      updates.approved_by = actor?.id || null;
    }
    await transaction.run(async (conn) => {
      await mentorWorkflowRepository.updateAssignment(id, updates, conn);
      await writeAssignmentHistory(id, actionForStatus(status), actor, { status: current.status }, updates, data.note || data.rejection_reason, conn);
    });
    await auditService.log({ userId: actor?.id || null, action: "mentor_assignment_status_update", tableName: "mentor_assignments", recordId: id, oldValues: { status: current.status }, newValues: updates });
    return getAssignment(id, actor);
  };

  const deleteAssignment = async (id, actor) => {
    const current = await getAssignmentOrFail(id);
    await mentorWorkflowRepository.softDeleteAssignment(id);
    await writeAssignmentHistory(id, "cancelled", actor, current, { deleted_at: new Date() }, "Soft deleted");
    await auditService.log({ userId: actor?.id || null, action: "mentor_assignment_delete", tableName: "mentor_assignments", recordId: id, oldValues: current });
  };

  const listGroupAssignments = async (groupId, actor) => {
    await assertGroupVisibleToActor(actor, groupId);
    const group = await mentorWorkflowRepository.findGroupContext(groupId);
    const [assignments, requests] = await Promise.all([
      mentorWorkflowRepository.listActiveAssignmentsForGroup(groupId),
      mentorWorkflowRepository.listOpenRequestsForGroup(groupId),
    ]);
    return { group, assignments, requests };
  };

  const createAssignmentRequest = async (groupId, data, actor) => {
    const group = await mentorWorkflowRepository.findGroupContext(groupId);
    if (!group) throw NotFound("Group");
    if (hasRole(actor, "lecturer") && !isAdminOrDept(actor)) await assertLecturerOwnsClass(actor, group.class_id);
    const payload = {
      group_id: Number(groupId),
      requested_by: actor?.id || null,
      requested_role: data.requested_role || "any",
      requested_expertise: data.requested_expertise || null,
      problem_statement: nullable(data.problem_statement),
      support_needed: String(data.support_needed).trim(),
      priority: data.priority || "normal",
    };
    const id = await mentorWorkflowRepository.createAssignmentRequest(payload);
    await auditService.log({ userId: actor?.id || null, action: "mentor_assignment_request_create", tableName: "mentor_assignment_requests", recordId: id, newValues: payload });
    return { id, ...payload };
  };

  const respondAssignment = async (id, data, actor) => {
    const current = await getAssignmentOrFail(id);
    const mentor = await mentorWorkflowRepository.findMentorByUserId(actor.id);
    if (!mentor || Number(mentor.id) !== Number(current.mentor_id)) throw Forbidden("Assignment does not belong to you");
    if (!['proposed', 'pending_mentor'].includes(current.status)) throw BadRequest("Only pending assignments can be responded to");
    const status = data.response === "accept" ? "active" : "rejected";
    if (status === "rejected" && !nullable(data.rejection_reason)) throw BadRequest("Rejection reason is required");
    if (status === "active") await validateAssignmentRules({ ...current, status }, id);
    const updates = { status, rejection_reason: nullable(data.rejection_reason), approved_by: status === "active" ? actor.id : current.approved_by };
    await transaction.run(async (conn) => {
      await mentorWorkflowRepository.updateAssignment(id, updates, conn);
      await writeAssignmentHistory(id, status === "active" ? "activated" : "rejected", actor, { status: current.status }, updates, data.note || data.rejection_reason, conn);
    });
    await auditService.log({ userId: actor?.id || null, action: "mentor_assignment_respond", tableName: "mentor_assignments", recordId: id, oldValues: { status: current.status }, newValues: updates });
    return getAssignment(id, actor);
  };

  const listSessions = async (query, actor, scope = "admin") => {
    const pagination = parsePagination(query);
    const filters = {
      assignmentId: query.assignment_id || null,
      mentorId: query.mentor_id || null,
      groupId: query.group_id || null,
      classId: query.class_id || null,
      semesterId: query.semester_id || null,
      status: nullable(query.status),
      search: nullable(query.search),
      limit: pagination.limit,
      offset: pagination.offset,
    };
    if (scope === "mentor") {
      const mentor = await mentorWorkflowRepository.findMentorByUserId(actor.id);
      if (!mentor) return { data: [], ...pagination, total: 0 };
      filters.mentorId = mentor.id;
    }
    if (scope === "lecturer") filters.lecturerId = actor.id;
    const result = await mentorWorkflowRepository.listSessions(filters);
    const stats = scope === "admin" || scope === "lecturer" ? await mentorWorkflowRepository.getSessionStats(filters) : null;
    return { data: result.rows, ...pagination, total: result.total, stats };
  };

  const getSession = async (id, actor) => {
    const session = await getSessionOrFail(id);
    await assertSessionVisibleToActor(actor, session);
    const [notes, feedback, actionItems] = await Promise.all([
      mentorWorkflowRepository.listNotes(id),
      mentorWorkflowRepository.listFeedback(id),
      mentorWorkflowRepository.listActionItems(id),
    ]);
    return { ...session, notes: filterNotesForActor(notes, actor), feedback, action_items: actionItems };
  };

  const filterNotesForActor = (notes, actor) => {
    if (isAdminOrDept(actor)) return notes;
    return notes.filter((note) => Number(note.author_id) === Number(actor?.id) || note.visibility !== "private_to_author");
  };

  const normalizeSessionPayload = (data, assignment, actor) => {
    const actualStart = toMysqlDateTime(data.actual_start_at);
    const actualEnd = toMysqlDateTime(data.actual_end_at);
    return {
      assignment_id: Number(assignment.id),
      mentor_id: Number(assignment.mentor_id),
      group_id: Number(assignment.group_id),
      class_id: Number(assignment.class_id),
      semester_id: Number(assignment.semester_id),
      title: String(data.title).trim(),
      description: nullable(data.description),
      session_type: data.session_type || "online",
      meeting_link: nullable(data.meeting_link),
      location: nullable(data.location),
      scheduled_start_at: toMysqlDateTime(data.scheduled_start_at),
      scheduled_end_at: toMysqlDateTime(data.scheduled_end_at),
      actual_start_at: actualStart,
      actual_end_at: actualEnd,
      duration_minutes: durationMinutes(actualStart, actualEnd),
      status: data.status || "scheduled",
      created_by: actor?.id || null,
    };
  };

  const createSession = async (data, actor) => {
    const assignment = await getAssignmentOrFail(data.assignment_id);
    if (assignment.status !== "active") throw BadRequest("Only active assignments can have sessions");
    if (hasRole(actor, "mentor") && !isAdminOrDept(actor)) {
      const mentor = await mentorWorkflowRepository.findMentorByUserId(actor.id);
      if (!mentor || Number(mentor.id) !== Number(assignment.mentor_id)) throw Forbidden("Assignment does not belong to you");
    } else if (hasRole(actor, "lecturer") && !isAdminOrDept(actor)) {
      await assertLecturerOwnsClass(actor, assignment.class_id);
    }
    const payload = normalizeSessionPayload(data, assignment, actor);
    if (!payload.scheduled_start_at || !payload.scheduled_end_at || payload.scheduled_start_at >= payload.scheduled_end_at) {
      throw BadRequest("Scheduled start must be before end");
    }
    const id = await mentorWorkflowRepository.createSession(payload);
    await auditService.log({ userId: actor?.id || null, action: "mentoring_session_create", tableName: "mentoring_sessions", recordId: id, newValues: payload });
    return getSession(id, actor);
  };

  const updateSession = async (id, data, actor) => {
    const current = await getSessionOrFail(id);
    await assertSessionVisibleToActor(actor, current);
    if (current.status === "cancelled") throw BadRequest("Cancelled sessions cannot be edited");
    const updates = {};
    for (const key of ["title", "description", "session_type", "meeting_link", "location"]) {
      if (data[key] !== undefined) updates[key] = key === "title" ? String(data[key]).trim() : nullable(data[key]);
    }
    for (const key of ["scheduled_start_at", "scheduled_end_at", "actual_start_at", "actual_end_at"]) {
      if (data[key] !== undefined) updates[key] = toMysqlDateTime(data[key]);
    }
    const nextStart = updates.actual_start_at !== undefined ? updates.actual_start_at : current.actual_start_at;
    const nextEnd = updates.actual_end_at !== undefined ? updates.actual_end_at : current.actual_end_at;
    if (nextStart && nextEnd) updates.duration_minutes = durationMinutes(nextStart, nextEnd);
    await mentorWorkflowRepository.updateSession(id, updates);
    await auditService.log({ userId: actor?.id || null, action: "mentoring_session_update", tableName: "mentoring_sessions", recordId: id, oldValues: current, newValues: updates });
    return getSession(id, actor);
  };

  const updateSessionStatus = async (id, data, actor) => {
    const current = await getSessionOrFail(id);
    await assertSessionVisibleToActor(actor, current);
    if (current.status === "cancelled" && data.status === "completed") throw BadRequest("Cancelled sessions cannot be completed");
    const actualStart = toMysqlDateTime(data.actual_start_at) || current.actual_start_at || current.scheduled_start_at;
    const actualEnd = toMysqlDateTime(data.actual_end_at) || current.actual_end_at || current.scheduled_end_at;
    const updates = { status: data.status };
    if (data.status === "completed") {
      updates.actual_start_at = actualStart;
      updates.actual_end_at = actualEnd;
      updates.duration_minutes = durationMinutes(actualStart, actualEnd);
    }
    if (data.status === "cancelled") {
      updates.cancelled_by = actor?.id || null;
      updates.cancellation_reason = nullable(data.cancellation_reason);
    }
    await mentorWorkflowRepository.updateSession(id, updates);
    await auditService.log({ userId: actor?.id || null, action: "mentoring_session_status_update", tableName: "mentoring_sessions", recordId: id, oldValues: { status: current.status }, newValues: updates });
    return getSession(id, actor);
  };

  const listGroupSessions = async (groupId, actor, query = {}) => {
    await assertGroupVisibleToActor(actor, groupId);
    return listSessions({ ...query, group_id: groupId }, actor, "admin");
  };

  const createNote = async (sessionId, data, actor) => {
    const session = await getSessionOrFail(sessionId);
    await assertSessionVisibleToActor(actor, session);
    const payload = { session_id: Number(sessionId), author_id: actor?.id || null, note_type: data.note_type, content: String(data.content).trim(), visibility: data.visibility };
    const id = await mentorWorkflowRepository.createNote(payload);
    await auditService.log({ userId: actor?.id || null, action: "mentoring_session_note_create", tableName: "mentoring_session_notes", recordId: id, newValues: payload });
    return getSession(sessionId, actor);
  };

  const createFeedback = async (sessionId, data, actor) => {
    const session = await getSessionOrFail(sessionId);
    await assertSessionVisibleToActor(actor, session);
    const fromRole = hasRole(actor, "mentor") ? "mentor" : hasRole(actor, "student") ? "student" : hasRole(actor, "lecturer") ? "lecturer" : "admin";
    const payload = {
      session_id: Number(sessionId),
      assignment_id: Number(session.assignment_id),
      from_user_id: actor?.id || null,
      from_role: fromRole,
      target_type: data.target_type,
      target_id: Number(data.target_id),
      rating: data.rating === null || data.rating === "" ? null : Number(data.rating),
      feedback: nullable(data.feedback),
      strengths: nullable(data.strengths),
      improvements: nullable(data.improvements),
    };
    const id = await mentorWorkflowRepository.createFeedback(payload);
    await auditService.log({ userId: actor?.id || null, action: "mentoring_feedback_create", tableName: "mentoring_feedbacks", recordId: id, newValues: payload });
    return getSession(sessionId, actor);
  };

  const createActionItem = async (sessionId, data, actor) => {
    const session = await getSessionOrFail(sessionId);
    await assertSessionVisibleToActor(actor, session);
    const payload = {
      session_id: Number(sessionId),
      group_id: Number(session.group_id),
      assigned_to_user_id: data.assigned_to_user_id || null,
      title: String(data.title).trim(),
      description: nullable(data.description),
      due_date: dateOnly(data.due_date),
      created_by: actor?.id || null,
    };
    const id = await mentorWorkflowRepository.createActionItem(payload);
    await auditService.log({ userId: actor?.id || null, action: "mentoring_action_item_create", tableName: "mentoring_action_items", recordId: id, newValues: payload });
    return getSession(sessionId, actor);
  };

  const updateActionItemStatus = async (id, status, actor) => {
    const item = await mentorWorkflowRepository.findActionItemById(id);
    if (!item) throw NotFound("Mentoring action item");
    await assertSessionVisibleToActor(actor, { ...item, group_id: item.session_group_id, mentor_id: item.mentor_id, class_id: item.class_id });
    await mentorWorkflowRepository.updateActionItemStatus(id, status);
    await auditService.log({ userId: actor?.id || null, action: "mentoring_action_item_status_update", tableName: "mentoring_action_items", recordId: id, oldValues: { status: item.status }, newValues: { status } });
    return mentorWorkflowRepository.findActionItemById(id);
  };

  const listAdminFeedback = async (query) => {
    const pagination = parsePagination(query);
    const result = await mentorWorkflowRepository.listAllFeedback({
      classId: query.class_id || null,
      groupId: query.group_id || null,
      mentorId: query.mentor_id || null,
      semesterId: query.semester_id || null,
      status: nullable(query.status),
      search: nullable(query.search),
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const listAdminActionItems = async (query) => {
    const pagination = parsePagination(query);
    const result = await mentorWorkflowRepository.listAllActionItems({
      classId: query.class_id || null,
      groupId: query.group_id || null,
      mentorId: query.mentor_id || null,
      semesterId: query.semester_id || null,
      status: nullable(query.status),
      itemStatus: nullable(query.item_status),
      search: nullable(query.search),
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  return {
    listAssignments,
    getAssignment,
    createAssignment,
    updateAssignment,
    updateAssignmentStatus,
    deleteAssignment,
    listGroupAssignments,
    createAssignmentRequest,
    respondAssignment,
    listSessions,
    getSession,
    createSession,
    updateSession,
    updateSessionStatus,
    listGroupSessions,
    createNote,
    createFeedback,
    createActionItem,
    updateActionItemStatus,
    listAdminFeedback,
    listAdminActionItems,
  };
};
