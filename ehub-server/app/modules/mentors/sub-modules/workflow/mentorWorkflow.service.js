import { OUTBOX_MENTOR_NOTIFICATION_EMAIL_DISPATCH } from "app/core/constants/outboxEventTypes.js";
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

export const createMentorWorkflowService = ({ mentorWorkflowRepository, checkpointRepository, outboxRepository, transaction, auditService }) => {
  /** Đưa thông báo vào outbox trong cùng transaction với thay đổi nghiệp vụ — rollback thì không gửi nhầm. */
  const queueNotification = (conn, payload) =>
    outboxRepository.insertWithConn(conn, { eventType: OUTBOX_MENTOR_NOTIFICATION_EMAIL_DISPATCH, payload });

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
    if (hasRole(actor, "mentor")) {
      const mentor = await mentorWorkflowRepository.findMentorByUserId(actor.id);
      if (mentor && await mentorWorkflowRepository.mentorHasAssignmentForGroup(mentor.id, groupId)) return;
    }
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

  /** Giảng viên không được sửa dữ liệu mentoring khi học kỳ đã kết thúc. */
  const assertLecturerSemesterEditable = (actor, semesterStatus) => {
    if (isAdminOrDept(actor)) return;
    if (!hasRole(actor, "lecturer")) return;
    if (semesterStatus === "completed") {
      throw BadRequest("Học kỳ đã kết thúc, không thể chỉnh sửa buổi mentoring.");
    }
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

  /** Ngưỡng nhóm tối đa mỗi mentor. Vượt ngưỡng chỉ người có quyền duyệt mới được ghi đè. */
  const MAX_ACTIVE_ASSIGNMENTS = 5;

  const validateAssignmentRules = async (payload, excludeId = null, actor = null) => {
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
    if (activeAssignments >= MAX_ACTIVE_ASSIGNMENTS) {
      if (actor && !hasPermission(actor, "mentor.assignment.approve")) {
        throw BadRequest(`Mentor đã đạt ${MAX_ACTIVE_ASSIGNMENTS} nhóm đang phụ trách, cần người có quyền duyệt để gán thêm`);
      }
      warnings.push(`Mentor đang phụ trách ${activeAssignments} nhóm, vượt ngưỡng khuyến nghị ${MAX_ACTIVE_ASSIGNMENTS}.`);
    }
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
    const { mentor, warnings } = await validateAssignmentRules(payload, null, actor);
    payload.assigned_by = actor?.id || null;
    payload.approved_by = payload.status === "active" ? actor?.id || null : null;
    const id = await transaction.run(async (conn) => {
      const createdId = await mentorWorkflowRepository.createAssignment(payload, conn);
      await writeAssignmentHistory(createdId, payload.status === "active" ? "approved" : "proposed", actor, null, payload, payload.note, conn);
      // Nhóm đã có mentor thì các yêu cầu còn mở coi như đã được đáp ứng.
      await mentorWorkflowRepository.closeOpenRequestsForGroup(payload.group_id, conn);
      if (mentor.email && ["proposed", "pending_mentor"].includes(payload.status)) {
        await queueNotification(conn, {
          kind: "assignment_created",
          recipients: [mentor.email],
          mentorName: mentor.full_name,
          groupName: group.group_name,
          className: group.class_code,
          topic: group.topic,
          assignmentId: createdId,
        });
      }
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
    if (await mentorWorkflowRepository.countUpcomingSessionsForAssignment(id)) {
      throw BadRequest("Assignment còn buổi mentoring chưa diễn ra, hãy hủy các buổi đó trước");
    }
    await mentorWorkflowRepository.softDeleteAssignment(id);
    await writeAssignmentHistory(id, "cancelled", actor, current, { deleted_at: new Date() }, "Soft deleted");
    await auditService.log({ userId: actor?.id || null, action: "mentor_assignment_delete", tableName: "mentor_assignments", recordId: id, oldValues: current });
  };

  /**
   * Đổi mentor cho nhóm: hủy assignment cũ và tạo assignment mới trong cùng một transaction,
   * thay cho quy trình cancel-rồi-tạo thủ công vốn dễ để nhóm mất mentor giữa chừng.
   */
  const replaceAssignment = async (id, data, actor) => {
    const current = await getAssignmentOrFail(id);
    if (!["proposed", "pending_mentor", "active"].includes(current.status)) {
      throw BadRequest("Chỉ đổi mentor cho assignment đang hiệu lực");
    }
    if (!hasPermission(actor, "mentor.assignment.approve")) throw Forbidden("Approve permission required");
    if (Number(data.mentor_id) === Number(current.mentor_id)) throw BadRequest("Mentor mới trùng với mentor hiện tại");
    if (await mentorWorkflowRepository.countUpcomingSessionsForAssignment(id)) {
      throw BadRequest("Assignment còn buổi mentoring chưa diễn ra, hãy hủy các buổi đó trước khi đổi mentor");
    }

    const group = await mentorWorkflowRepository.findGroupContext(current.group_id);
    const payload = normalizeAssignment({
      mentor_id: data.mentor_id,
      assignment_type: data.assignment_type || current.assignment_type,
      status: "pending_mentor",
      start_date: data.start_date ?? current.start_date,
      end_date: data.end_date ?? current.end_date,
      expected_sessions: data.expected_sessions ?? current.expected_sessions,
      note: data.note || `Thay cho mentor trước (assignment #${id})`,
    }, group);
    const { warnings } = await validateAssignmentRules(payload, null, actor);
    payload.assigned_by = actor?.id || null;
    payload.approved_by = null;

    const newId = await transaction.run(async (conn) => {
      await mentorWorkflowRepository.updateAssignment(id, { status: "cancelled", rejection_reason: nullable(data.reason) }, conn);
      await writeAssignmentHistory(id, "cancelled", actor, { status: current.status }, { status: "cancelled" }, data.reason, conn);
      const createdId = await mentorWorkflowRepository.createAssignment(payload, conn);
      await writeAssignmentHistory(createdId, "changed", actor, { replaced_assignment_id: Number(id) }, payload, data.reason, conn);
      return createdId;
    });
    await auditService.log({ userId: actor?.id || null, action: "mentor_assignment_replace", tableName: "mentor_assignments", recordId: newId, oldValues: { assignment_id: Number(id), mentor_id: current.mentor_id }, newValues: { mentor_id: payload.mentor_id } });
    return { ...(await getAssignment(newId, actor)), warnings, replaced_assignment_id: Number(id) };
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

  /**
   * Mentor của nhóm cho sinh viên/giảng viên: bản rút gọn, KHÔNG lộ email và số điện thoại cá nhân của mentor.
   * Có cả assignment đang chờ mentor phản hồi để sinh viên biết nhóm đã được ghép ai.
   */
  const listGroupMentors = async (groupId, actor) => {
    await assertGroupVisibleToActor(actor, groupId);
    const assignments = await mentorWorkflowRepository.listActiveAssignmentsForGroup(groupId);
    return assignments.map((row) => ({
      id: row.id,
      mentor_name: row.mentor_name,
      mentor_type: row.mentor_type,
      organization: row.organization,
      assignment_type: row.assignment_type,
      status: row.status,
      start_date: row.start_date,
      end_date: row.end_date,
      total_sessions: row.total_sessions,
      completed_sessions: row.completed_sessions,
    }));
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

  const listAssignmentRequests = async (query, actor) => {
    const pagination = parsePagination(query);
    const result = await mentorWorkflowRepository.listAssignmentRequests({
      lecturerId: isAdminOrDept(actor) ? null : actor.id,
      groupId: query.group_id || null,
      status: nullable(query.status),
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  /** Dùng bởi module matching khi tạo yêu cầu matching từ một yêu cầu mentor có sẵn. */
  const getAssignmentRequestForGroup = async (id, groupId) => {
    const request = await mentorWorkflowRepository.findAssignmentRequestById(id);
    if (!request) throw NotFound("Mentor assignment request");
    if (Number(request.group_id) !== Number(groupId)) throw BadRequest("Yêu cầu nguồn không thuộc nhóm này");
    return request;
  };

  const updateAssignmentRequestStatus = async (id, status, actor) => {
    const request = await mentorWorkflowRepository.findAssignmentRequestById(id);
    if (!request) throw NotFound("Mentor assignment request");
    await assertLecturerOwnsClass(actor, request.class_id);
    if (request.status !== "open") throw BadRequest("Chỉ đóng hoặc hủy được yêu cầu đang mở");
    await mentorWorkflowRepository.updateAssignmentRequestStatus(id, status);
    await auditService.log({ userId: actor?.id || null, action: "mentor_assignment_request_status_update", tableName: "mentor_assignment_requests", recordId: Number(id), oldValues: { status: request.status }, newValues: { status } });
    return mentorWorkflowRepository.findAssignmentRequestById(id);
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
    const staffEmails = await mentorWorkflowRepository.listAssignmentStaffEmails(id);
    await transaction.run(async (conn) => {
      await mentorWorkflowRepository.updateAssignment(id, updates, conn);
      await writeAssignmentHistory(id, status === "active" ? "activated" : "rejected", actor, { status: current.status }, updates, data.note || data.rejection_reason, conn);
      if (staffEmails.length) {
        await queueNotification(conn, {
          kind: "assignment_responded",
          recipients: staffEmails,
          mentorName: mentor.full_name,
          groupName: current.group_name,
          accepted: status === "active",
          reason: nullable(data.rejection_reason),
          assignmentId: Number(id),
        });
      }
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
    const [notes, feedback, actionItems, attendees] = await Promise.all([
      mentorWorkflowRepository.listNotes(id),
      mentorWorkflowRepository.listFeedback(id),
      mentorWorkflowRepository.listActionItems(id),
      mentorWorkflowRepository.listAttendees(id),
    ]);
    return { ...session, notes: filterNotesForActor(notes, actor), feedback, action_items: actionItems, attendees };
  };

  const filterNotesForActor = (notes, actor) => {
    if (isAdminOrDept(actor)) return notes;
    const isStaff = hasRole(actor, "lecturer", "mentor");
    return notes.filter((note) => {
      if (Number(note.author_id) === Number(actor?.id)) return true;
      if (note.note_type === "private_admin_note") return false;
      if (note.visibility === "private_to_author") return false;
      if (note.visibility === "shared_with_group") return true;
      return isStaff;
    });
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

  const startOfWeek = (value) => {
    const date = new Date(`${String(value).replace(" ", "T")}Z`);
    const day = (date.getUTCDay() + 6) % 7; // thứ 2 = 0
    date.setUTCDate(date.getUTCDate() - day);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  };

  const addDays = (date, days) => new Date(date.getTime() + days * 86400000);
  const asMysql = (date) => date.toISOString().slice(0, 19).replace("T", " ");

  /** Khớp session với khung giờ rảnh: cùng thứ trong tuần, nằm trong giờ và trong khoảng ngày hiệu lực. */
  const fitsAvailability = (slots, start, end) => {
    if (!slots.length) return false;
    const date = new Date(`${String(start).replace(" ", "T")}Z`);
    const isoDay = date.getUTCDay() === 0 ? 7 : date.getUTCDay(); // 1=Mon..7=Sun khớp CHECK của bảng
    const dayText = String(start).slice(0, 10);
    const startTime = String(start).slice(11, 19);
    const endTime = String(end).slice(11, 19);
    return slots.some((slot) => {
      if (slot.day_of_week !== null && Number(slot.day_of_week) !== isoDay) return false;
      if (slot.start_time && startTime < String(slot.start_time)) return false;
      if (slot.end_time && endTime > String(slot.end_time)) return false;
      if (slot.available_from && dayText < dateOnly(slot.available_from)) return false;
      if (slot.available_to && dayText > dateOnly(slot.available_to)) return false;
      return true;
    });
  };

  /**
   * Chặn cứng việc đặt trùng lịch và đặt ngoài thời hạn assignment.
   * Các vấn đề mềm (ngoài giờ rảnh, vượt hạn mức tuần, vượt số buổi dự kiến) trả về warnings để client hiển thị.
   */
  const validateSessionSchedule = async (assignment, start, end, excludeId = null) => {
    const overlaps = await mentorWorkflowRepository.findOverlappingSessions({
      mentorId: assignment.mentor_id, groupId: assignment.group_id, start, end, excludeId,
    });
    const mentorClash = overlaps.find((row) => Number(row.same_mentor) === 1);
    if (mentorClash) throw BadRequest(`Mentor đã có buổi "${mentorClash.title}" trùng khung giờ này`);
    const groupClash = overlaps.find((row) => Number(row.same_group) === 1);
    if (groupClash) throw BadRequest(`Nhóm đã có buổi "${groupClash.title}" trùng khung giờ này`);

    const day = String(start).slice(0, 10);
    if (assignment.start_date && day < dateOnly(assignment.start_date)) throw BadRequest("Buổi mentoring nằm trước ngày bắt đầu của assignment");
    if (assignment.end_date && day > dateOnly(assignment.end_date)) throw BadRequest("Buổi mentoring nằm sau ngày kết thúc của assignment");

    const warnings = [];
    const slots = await mentorWorkflowRepository.listActiveAvailabilityForMentor(assignment.mentor_id);
    if (!slots.length) warnings.push("Mentor chưa khai báo khung giờ rảnh nào.");
    else if (!fitsAvailability(slots, start, end)) warnings.push("Buổi mentoring nằm ngoài khung giờ rảnh mentor đã khai báo.");

    const weekCap = slots.map((slot) => slot.max_sessions_per_week).filter((value) => value != null);
    if (weekCap.length) {
      const weekStart = startOfWeek(start);
      const booked = await mentorWorkflowRepository.countScheduledSessionsInRange(
        assignment.mentor_id, asMysql(weekStart), asMysql(addDays(weekStart, 7)), excludeId,
      );
      const cap = Math.min(...weekCap.map(Number));
      if (booked >= cap) warnings.push(`Mentor đã đạt hạn mức ${cap} buổi trong tuần này.`);
    }

    if (assignment.expected_sessions) {
      const total = Number(assignment.total_sessions || 0) + (excludeId ? 0 : 1);
      if (total > Number(assignment.expected_sessions)) {
        warnings.push(`Vượt số buổi dự kiến của assignment (${assignment.expected_sessions}).`);
      }
    }
    return warnings;
  };

  const createSession = async (data, actor) => {
    const assignment = await getAssignmentOrFail(data.assignment_id);
    if (assignment.status !== "active") throw BadRequest("Only active assignments can have sessions");
    if (hasRole(actor, "mentor") && !isAdminOrDept(actor)) {
      const mentor = await mentorWorkflowRepository.findMentorByUserId(actor.id);
      if (!mentor || Number(mentor.id) !== Number(assignment.mentor_id)) throw Forbidden("Assignment does not belong to you");
    } else if (hasRole(actor, "lecturer") && !isAdminOrDept(actor)) {
      await assertLecturerOwnsClass(actor, assignment.class_id);
      assertLecturerSemesterEditable(actor, assignment.semester_status);
    }
    const payload = normalizeSessionPayload(data, assignment, actor);
    if (!payload.scheduled_start_at || !payload.scheduled_end_at || payload.scheduled_start_at >= payload.scheduled_end_at) {
      throw BadRequest("Scheduled start must be before end");
    }
    const warnings = await validateSessionSchedule(assignment, payload.scheduled_start_at, payload.scheduled_end_at);
    const recipients = await mentorWorkflowRepository.listGroupNotificationEmails(payload.group_id);
    const id = await transaction.run(async (conn) => {
      const createdId = await mentorWorkflowRepository.createSession(payload, conn);
      await mentorWorkflowRepository.seedSessionAttendees(createdId, payload.mentor_id, payload.group_id, conn);
      if (recipients.length) {
        await queueNotification(conn, {
          kind: "session",
          action: "created",
          recipients,
          groupName: assignment.group_name,
          mentorName: assignment.mentor_name,
          title: payload.title,
          scheduledAt: payload.scheduled_start_at,
          location: payload.meeting_link || payload.location,
          sessionId: createdId,
        });
      }
      return createdId;
    });
    await auditService.log({ userId: actor?.id || null, action: "mentoring_session_create", tableName: "mentoring_sessions", recordId: id, newValues: payload });
    return { ...(await getSession(id, actor)), warnings };
  };

  const updateSession = async (id, data, actor) => {
    const current = await getSessionOrFail(id);
    await assertSessionVisibleToActor(actor, current);
    assertLecturerSemesterEditable(actor, current.semester_status);
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

    let warnings = [];
    let notify = null;
    const reschedule = updates.scheduled_start_at !== undefined || updates.scheduled_end_at !== undefined;
    if (reschedule) {
      const schedStart = updates.scheduled_start_at ?? toMysqlDateTime(current.scheduled_start_at);
      const schedEnd = updates.scheduled_end_at ?? toMysqlDateTime(current.scheduled_end_at);
      if (!schedStart || !schedEnd || schedStart >= schedEnd) throw BadRequest("Scheduled start must be before end");
      const assignment = await getAssignmentOrFail(current.assignment_id);
      warnings = await validateSessionSchedule(assignment, schedStart, schedEnd, id);
      if (current.status === "scheduled") updates.status = "rescheduled";
      notify = {
        kind: "session",
        action: "rescheduled",
        recipients: await mentorWorkflowRepository.listGroupNotificationEmails(current.group_id),
        groupName: current.group_name,
        mentorName: current.mentor_name,
        title: updates.title ?? current.title,
        scheduledAt: schedStart,
        location: updates.meeting_link ?? current.meeting_link ?? updates.location ?? current.location,
        sessionId: Number(id),
      };
    }
    await transaction.run(async (conn) => {
      await mentorWorkflowRepository.updateSession(id, updates, conn);
      if (notify?.recipients.length) await queueNotification(conn, notify);
    });
    await auditService.log({ userId: actor?.id || null, action: "mentoring_session_update", tableName: "mentoring_sessions", recordId: id, oldValues: current, newValues: updates });
    return { ...(await getSession(id, actor)), warnings };
  };

  const updateSessionStatus = async (id, data, actor) => {
    const current = await getSessionOrFail(id);
    await assertSessionVisibleToActor(actor, current);
    assertLecturerSemesterEditable(actor, current.semester_status);
    if (current.status === "cancelled" && data.status === "completed") throw BadRequest("Cancelled sessions cannot be completed");
    const actualStart = toMysqlDateTime(data.actual_start_at) || current.actual_start_at || current.scheduled_start_at;
    const actualEnd = toMysqlDateTime(data.actual_end_at) || current.actual_end_at || current.scheduled_end_at;
    const updates = { status: data.status };
    if (data.status === "completed") {
      updates.actual_start_at = actualStart;
      updates.actual_end_at = actualEnd;
      updates.duration_minutes = durationMinutes(actualStart, actualEnd);
    }
    let notify = null;
    if (data.status === "cancelled") {
      updates.cancelled_by = actor?.id || null;
      updates.cancellation_reason = nullable(data.cancellation_reason);
      const recipients = await mentorWorkflowRepository.listGroupNotificationEmails(current.group_id);
      if (current.mentor_email) recipients.push(current.mentor_email);
      notify = {
        kind: "session",
        action: "cancelled",
        recipients,
        groupName: current.group_name,
        mentorName: current.mentor_name,
        title: current.title,
        scheduledAt: toMysqlDateTime(current.scheduled_start_at),
        reason: updates.cancellation_reason,
        sessionId: Number(id),
      };
    }
    await transaction.run(async (conn) => {
      await mentorWorkflowRepository.updateSession(id, updates, conn);
      if (notify?.recipients.length) await queueNotification(conn, notify);
    });
    await auditService.log({ userId: actor?.id || null, action: "mentoring_session_status_update", tableName: "mentoring_sessions", recordId: id, oldValues: { status: current.status }, newValues: updates });
    return getSession(id, actor);
  };

  /**
   * Checkpoint cho mentor: mentor cố vấn nên thấy tiến độ nộp bài, KHÔNG thấy điểm và nhận xét chấm.
   * Cắt trực tiếp ở đây thay vì trả thẳng row DB.
   */
  const checkpointForMentor = (row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    due_date: row.due_date,
    order_index: row.order_index,
    submission_status: row.submission_status,
    submitted_at: row.submitted_at,
  });

  const listMyGroups = async (actor) => {
    const mentor = await mentorWorkflowRepository.findMentorByUserId(actor.id);
    if (!mentor) return { data: [] };
    return { data: await mentorWorkflowRepository.listGroupsForMentor(mentor.id) };
  };

  const getMyGroup = async (groupId, actor) => {
    await assertGroupVisibleToActor(actor, groupId);
    const group = await mentorWorkflowRepository.findGroupContext(groupId);
    if (!group) throw NotFound("Group");
    const [members, checkpoints, sessions, actionItems, assignments] = await Promise.all([
      mentorWorkflowRepository.listGroupMembersForMentor(groupId),
      checkpointRepository.findCheckpointsByGroup(groupId),
      mentorWorkflowRepository.listSessions({ groupId, limit: 20, offset: 0 }),
      mentorWorkflowRepository.listActionItemsForGroup(groupId),
      mentorWorkflowRepository.listActiveAssignmentsForGroup(groupId),
    ]);
    return {
      group,
      members,
      checkpoints: checkpoints.map(checkpointForMentor),
      sessions: sessions.rows,
      action_items: actionItems,
      assignments,
    };
  };

  const listGroupSessions = async (groupId, actor, query = {}) => {
    await assertGroupVisibleToActor(actor, groupId);
    return listSessions({ ...query, group_id: groupId }, actor, "admin");
  };

  const noteTypeForActor = (actor) => {
    if (hasRole(actor, "mentor")) return "mentor_note";
    if (hasRole(actor, "student")) return "student_note";
    if (hasRole(actor, "lecturer")) return "lecturer_note";
    return "private_admin_note";
  };

  /** Điểm danh: chỉ mentor phụ trách, giảng viên của lớp và admin được chốt — sinh viên chỉ xem. */
  const updateAttendance = async (sessionId, items, actor) => {
    const session = await getSessionOrFail(sessionId);
    await assertSessionVisibleToActor(actor, session);
    assertLecturerSemesterEditable(actor, session.semester_status);
    if (!isAdminOrDept(actor) && !hasRole(actor, "mentor", "lecturer")) throw Forbidden("Chỉ mentor hoặc giảng viên được điểm danh");
    await mentorWorkflowRepository.updateAttendance(sessionId, items);
    await auditService.log({ userId: actor?.id || null, action: "mentoring_session_attendance_update", tableName: "mentoring_session_attendees", recordId: Number(sessionId), newValues: { items } });
    return getSession(sessionId, actor);
  };

  const createNote = async (sessionId, data, actor) => {
    const session = await getSessionOrFail(sessionId);
    await assertSessionVisibleToActor(actor, session);
    assertLecturerSemesterEditable(actor, session.semester_status);
    const noteType = noteTypeForActor(actor);
    const visibility = noteType === "student_note" ? "shared_with_group" : data.visibility;
    const payload = { session_id: Number(sessionId), author_id: actor?.id || null, note_type: noteType, content: String(data.content).trim(), visibility };
    const id = await mentorWorkflowRepository.createNote(payload);
    await auditService.log({ userId: actor?.id || null, action: "mentoring_session_note_create", tableName: "mentoring_session_notes", recordId: id, newValues: payload });
    return getSession(sessionId, actor);
  };

  const createFeedback = async (sessionId, data, actor) => {
    const session = await getSessionOrFail(sessionId);
    await assertSessionVisibleToActor(actor, session);
    assertLecturerSemesterEditable(actor, session.semester_status);
    if (session.status !== "completed") throw BadRequest("Chỉ đánh giá được sau khi buổi mentoring đã hoàn thành");

    const fromRole = hasRole(actor, "mentor") ? "mentor" : hasRole(actor, "student") ? "student" : hasRole(actor, "lecturer") ? "lecturer" : "admin";
    if (fromRole === "mentor" && data.target_type === "mentor") throw BadRequest("Mentor không thể tự đánh giá chính mình");

    // target_id phải khớp đúng đối tượng của buổi này, tránh ghi đánh giá lạc sang mentor/nhóm khác.
    const expectedTarget = { mentor: session.mentor_id, group: session.group_id, session: session.id }[data.target_type];
    if (Number(data.target_id) !== Number(expectedTarget)) throw BadRequest("Đối tượng đánh giá không khớp với buổi mentoring này");

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
    let id;
    try {
      id = await mentorWorkflowRepository.createFeedback(payload);
    } catch (err) {
      // uk_mentoring_feedback_once (session_id, from_user_id, target_type, target_id)
      if (err?.code === "ER_DUP_ENTRY") throw AlreadyExists("Bạn đã gửi đánh giá cho đối tượng này rồi");
      throw err;
    }
    await auditService.log({ userId: actor?.id || null, action: "mentoring_feedback_create", tableName: "mentoring_feedbacks", recordId: id, newValues: payload });
    return getSession(sessionId, actor);
  };

  const createActionItem = async (sessionId, data, actor) => {
    const session = await getSessionOrFail(sessionId);
    await assertSessionVisibleToActor(actor, session);
    assertLecturerSemesterEditable(actor, session.semester_status);
    if (!isAdminOrDept(actor) && !hasRole(actor, "mentor", "lecturer")) throw Forbidden("Chỉ mentor hoặc giảng viên được giao đầu việc");
    if (data.assigned_to_user_id && !await mentorWorkflowRepository.userInGroup(data.assigned_to_user_id, session.group_id)) {
      throw BadRequest("Người được giao việc không thuộc nhóm này");
    }
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
    const session = await getSessionOrFail(item.session_id);
    await assertSessionVisibleToActor(actor, session);
    assertLecturerSemesterEditable(actor, session.semester_status);
    // Sinh viên chỉ cập nhật được đầu việc giao cho chính mình, và không được tự hủy việc mentor giao.
    if (!isAdminOrDept(actor) && !hasRole(actor, "mentor", "lecturer")) {
      if (Number(item.assigned_to_user_id) !== Number(actor?.id)) throw Forbidden("Đầu việc này không được giao cho bạn");
      if (status === "cancelled") throw Forbidden("Chỉ mentor hoặc giảng viên được hủy đầu việc");
    }
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
    replaceAssignment,
    listGroupAssignments,
    listGroupMentors,
    listMyGroups,
    getMyGroup,
    createAssignmentRequest,
    listAssignmentRequests,
    getAssignmentRequestForGroup,
    updateAssignmentRequestStatus,
    respondAssignment,
    listSessions,
    getSession,
    createSession,
    updateSession,
    updateSessionStatus,
    listGroupSessions,
    updateAttendance,
    createNote,
    createFeedback,
    createActionItem,
    updateActionItemStatus,
    listAdminFeedback,
    listAdminActionItems,
  };
};
