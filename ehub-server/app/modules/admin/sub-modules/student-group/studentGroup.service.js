import crypto from "node:crypto";
import { AlreadyExists, BadRequest, NotFound } from "app/core/errors/errorFactory.js";
import { OUTBOX_CLASS_INVITE_EMAIL_DISPATCH } from "app/core/constants/outboxEventTypes.js";
import { parsePagination } from "app/core/utils/pagination.js";
import { appConfig } from "app/config/app.js";

const clean = (value) => String(value ?? "").trim();
const nullable = (value) => {
  const text = clean(value);
  return text || null;
};
const normalizeStudentCode = (value) => clean(value).toUpperCase();
const normalizeGroupCode = (value) => clean(value).toUpperCase();

export const createAdminStudentGroupService = ({
  adminStudentGroupRepository,
  auditService,
  inviteRepository,
  outboxRepository,
  transaction,
}) => {
  const pageArgs = (query) => parsePagination({ page: query.page, limit: query.limit });

  const listStudents = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminStudentGroupRepository.listStudents({
      search: query.search?.trim() || null,
      status: query.status || null,
      major: query.major || null,
      campus: query.campus || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getStudent = async (id) => {
    const student = await adminStudentGroupRepository.findStudentById(id);
    if (!student) throw NotFound("Student");
    return student;
  };

  const assertStudentUnique = async ({ studentCode, email, excludeId = null }) => {
    if (studentCode && await adminStudentGroupRepository.findStudentByCode(studentCode, excludeId)) {
      throw AlreadyExists("Student code đã tồn tại");
    }
    if (email && await adminStudentGroupRepository.findStudentByEmail(email, excludeId)) {
      throw AlreadyExists("Email sinh viên đã tồn tại");
    }
  };

  const createStudent = async (data, actor) => {
    const studentCode = normalizeStudentCode(data.student_code);
    const email = clean(data.email).toLowerCase();
    await assertStudentUnique({ studentCode, email });
    const id = await adminStudentGroupRepository.createStudent({
      user_id: data.user_id || null,
      student_code: studentCode,
      full_name: clean(data.full_name),
      email,
      phone: nullable(data.phone),
      major: nullable(data.major),
      campus: nullable(data.campus),
      status: data.status || "active",
    });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_create_student",
      tableName: "students",
      recordId: id,
      title: studentCode,
      newValues: { student_code: studentCode, email },
    });
    return getStudent(id);
  };

  const updateStudent = async (id, data, actor) => {
    const current = await getStudent(id);
    const updates = {};
    if (data.user_id !== undefined) updates.user_id = data.user_id || null;
    if (data.student_code !== undefined) updates.student_code = normalizeStudentCode(data.student_code);
    if (data.full_name !== undefined) updates.full_name = clean(data.full_name);
    if (data.email !== undefined) updates.email = clean(data.email).toLowerCase();
    if (data.phone !== undefined) updates.phone = nullable(data.phone);
    if (data.major !== undefined) updates.major = nullable(data.major);
    if (data.campus !== undefined) updates.campus = nullable(data.campus);
    if (data.status !== undefined) updates.status = data.status;
    await assertStudentUnique({
      studentCode: updates.student_code,
      email: updates.email,
      excludeId: id,
    });
    await adminStudentGroupRepository.updateStudent(id, updates);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_student",
      tableName: "students",
      recordId: id,
      title: updates.student_code || current.student_code,
      newValues: updates,
    });
    return getStudent(id);
  };

  const deleteStudent = async (id, actor) => {
    const student = await getStudent(id);
    const deps = await adminStudentGroupRepository.getStudentDependencyCounts(id);
    if (deps.groups > 0) {
      throw BadRequest("Không thể xoá sinh viên đang thuộc nhóm active");
    }
    await adminStudentGroupRepository.updateStudent(id, { deleted_at: new Date() });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_delete_student",
      tableName: "students",
      recordId: id,
      title: student.student_code,
      oldValues: { student_code: student.student_code },
    });
  };

  const listEnrollments = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminStudentGroupRepository.listEnrollments({
      search: query.search?.trim() || null,
      classId: query.class_id || null,
      semesterId: query.semester_id || null,
      subjectId: query.subject_id || null,
      status: query.status || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const addEnrollment = async (data, actor) => {
    const cls = await adminStudentGroupRepository.findClassForEnrollment(data.class_id);
    if (!cls) throw NotFound("Class");
    if (["completed", "archived"].includes(cls.status)) {
      throw BadRequest("Không thể thêm sinh viên vào lớp đã completed/archived");
    }
    const student = await adminStudentGroupRepository.findStudentById(data.student_id);
    if (!student) throw NotFound("Student");
    const existing = await adminStudentGroupRepository.findEnrollmentByClassStudent(cls.id, student.id);
    if (existing) throw AlreadyExists("Sinh viên đã tồn tại trong lớp");
    const existingClass = await adminStudentGroupRepository.findAnyEnrollmentByStudent(student.id);
    if (existingClass) throw BadRequest(`Sinh viên đã có lớp ${existingClass.class_code}`);

    const warnings = [];
    const sameSubject = await adminStudentGroupRepository.findSameSubjectSemesterEnrollment(
      cls.id,
      student.id,
      cls.subject_id,
      cls.semester_id,
    );
    if (sameSubject) {
      warnings.push(`Sinh viên đã thuộc lớp ${sameSubject.class_code} cùng học phần và học kỳ.`);
    }
    const id = await adminStudentGroupRepository.createEnrollment({
      classId: cls.id,
      studentId: student.id,
      status: data.status || "enrolled",
    });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_add_enrollment",
      tableName: "class_students",
      recordId: id,
      title: `${cls.class_code}:${student.student_code}`,
      newValues: { class_id: cls.id, student_id: student.id },
    });
    return { ...(await adminStudentGroupRepository.findEnrollmentById(id)), warnings };
  };

  const bulkAddEnrollments = async (data, actor) => {
    const results = [];
    for (const studentId of data.student_ids || []) {
      try {
        const enrollment = await addEnrollment({ class_id: data.class_id, student_id: studentId }, actor);
        results.push({ student_id: studentId, success: true, enrollment });
      } catch (err) {
        results.push({ student_id: studentId, success: false, message: err.message });
      }
    }
    return { results };
  };

  const sendEnrollmentInvite = async (enrollmentId, actor) => {
    const enrollment = await adminStudentGroupRepository.findEnrollmentById(enrollmentId);
    if (!enrollment) throw NotFound("Enrollment");
    if (enrollment.status === "dropped") {
      throw BadRequest("Không thể gửi invite cho sinh viên đã bị drop khỏi lớp.");
    }
    if (enrollment.user_id) {
      throw BadRequest("Sinh viên đã có tài khoản đăng nhập, không cần gửi invite kích hoạt.");
    }
    const email = clean(enrollment.email);
    if (!email) throw BadRequest("Sinh viên chưa có email.");

    const cls = await adminStudentGroupRepository.findClassForEnrollment(enrollment.class_id);
    if (!cls) throw NotFound("Class");
    if (["completed", "archived"].includes(cls.status)) {
      throw BadRequest("Không thể gửi invite cho lớp đã kết thúc.");
    }

    const expiryMs = Math.max(1, appConfig.invite.expiryDays) * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expiryMs);
    const token = crypto.randomBytes(32).toString("hex");

    const { inviteId, mailDispatchPublicId } = await transaction.run(async (conn) => {
      await inviteRepository.invalidateUnusedForPairConn(conn, enrollment.student_id, enrollment.class_id);
      const inviteId = await inviteRepository.insertQueuedInviteConn(conn, {
        email,
        student_id: enrollment.student_id,
        class_id: enrollment.class_id,
        token,
        expires_at: expiresAt,
      });
      const { id: outboxRowId, dispatchPublicId } = await outboxRepository.insertWithConn(conn, {
        eventType: OUTBOX_CLASS_INVITE_EMAIL_DISPATCH,
        payload: { classId: enrollment.class_id, classCode: cls.class_code, inviteIds: [inviteId] },
      });
      await inviteRepository.setOutboxIdForInvitesConn(conn, outboxRowId, [inviteId]);
      return { inviteId, mailDispatchPublicId: dispatchPublicId };
    });

    await auditService.log({
      userId: actor?.id || null,
      action: "admin_send_class_invite",
      tableName: "class_invites",
      recordId: inviteId,
      title: `${cls.class_code}:${enrollment.student_code}`,
      newValues: { email, class_id: enrollment.class_id, student_id: enrollment.student_id },
    });

    return {
      invite_id: inviteId,
      email,
      class_code: cls.class_code,
      email_delivery_status: "queued",
      mail_dispatch_id: mailDispatchPublicId,
    };
  };

  const updateEnrollmentStatus = async (id, data, actor) => {
    const enrollment = await adminStudentGroupRepository.findEnrollmentById(id);
    if (!enrollment) throw NotFound("Enrollment");
    if (data.status === "dropped") {
      const activeGroup = await adminStudentGroupRepository.findActiveGroupForStudentInClass(
        enrollment.student_id,
        enrollment.class_id,
      );
      if (activeGroup && !data.force) {
        throw BadRequest(`Sinh viên đang thuộc nhóm ${activeGroup.group_name}. Xác nhận force=true để drop.`);
      }
      if (activeGroup) {
        await adminStudentGroupRepository.updateGroupMember(activeGroup.id, {
          status: "removed",
          left_at: new Date(),
        });
      }
    }
    await adminStudentGroupRepository.updateEnrollment(id, {
      status: data.status,
      dropped_at: data.status === "dropped" ? new Date() : null,
    });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_enrollment_status",
      tableName: "class_students",
      recordId: id,
      title: `${enrollment.class_code}:${enrollment.student_code}`,
      newValues: { status: data.status },
    });
    return adminStudentGroupRepository.findEnrollmentById(id);
  };

  const listStudentsWithoutGroup = async (classId) => {
    const cls = await adminStudentGroupRepository.findClassForEnrollment(classId);
    if (!cls) throw NotFound("Class");
    return adminStudentGroupRepository.listStudentsWithoutGroup(classId);
  };

  const listGroups = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminStudentGroupRepository.listGroups({
      search: query.search?.trim() || null,
      classId: query.class_id || null,
      semesterId: query.semester_id || null,
      category: query.category || null,
      status: query.status || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getGroup = async (id) => {
    const group = await adminStudentGroupRepository.findGroupById(id);
    if (!group) throw NotFound("Group");
    const [members, studentsWithoutGroup] = await Promise.all([
      adminStudentGroupRepository.listGroupMembers(id),
      adminStudentGroupRepository.listStudentsWithoutGroup(group.class_id),
    ]);
    return { ...group, members, studentsWithoutGroup };
  };

  const normalizeGroupPayload = async (data, current = null) => {
    const classId = data.class_id ?? current?.class_id;
    const cls = classId ? await adminStudentGroupRepository.findClassForEnrollment(classId) : null;
    if (!cls) throw NotFound("Class");
    if (["completed", "archived"].includes(cls.status)) throw BadRequest("Không thể chỉnh nhóm trong lớp đã completed/archived");
    const status = data.status ?? current?.status ?? "forming";
    const topic = data.topic !== undefined ? nullable(data.topic) : current?.topic || null;
    if (status === "active" && !topic) throw BadRequest("Topic là bắt buộc khi group chuyển sang active");
    const maxMembers = Number(data.max_members ?? current?.max_members ?? cls.max_group_members);
    if (maxMembers < Number(cls.min_group_members) || maxMembers > Number(cls.max_group_members)) {
      throw BadRequest(`max_members phải nằm trong rule lớp (${cls.min_group_members}-${cls.max_group_members})`);
    }
    return {
      class_id: Number(classId),
      group_code: data.group_code !== undefined ? normalizeGroupCode(data.group_code) : current?.group_code,
      group_name: data.group_name !== undefined ? clean(data.group_name) : current?.group_name,
      description: data.description !== undefined ? nullable(data.description) : current?.description || null,
      category: data.category !== undefined ? nullable(data.category) : current?.category || null,
      topic,
      topic_desc: data.topic_desc !== undefined ? nullable(data.topic_desc) : current?.topic_desc || null,
      zalo_link: data.zalo_link !== undefined ? nullable(data.zalo_link) : current?.zalo_link || null,
      mentor_name: data.mentor_name !== undefined ? nullable(data.mentor_name) : current?.mentor_name || null,
      mentor_dept: data.mentor_dept !== undefined ? nullable(data.mentor_dept) : current?.mentor_dept || null,
      max_members: maxMembers,
      status,
    };
  };

  const createGroup = async (data, actor) => {
    const payload = await normalizeGroupPayload(data);
    if (await adminStudentGroupRepository.findGroupByCode(payload.group_code, payload.class_id)) {
      throw AlreadyExists("Group code đã tồn tại trong lớp");
    }
    const id = await adminStudentGroupRepository.createGroup({
      ...payload,
      created_by: actor?.id || null,
    });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_create_group",
      tableName: "groups",
      recordId: id,
      title: payload.group_code,
      newValues: { group_code: payload.group_code, class_id: payload.class_id },
    });
    return getGroup(id);
  };

  const updateGroup = async (id, data, actor) => {
    const current = await getGroup(id);
    const payload = await normalizeGroupPayload(data, current);
    if (payload.group_code && await adminStudentGroupRepository.findGroupByCode(payload.group_code, payload.class_id, id)) {
      throw AlreadyExists("Group code đã tồn tại trong lớp");
    }
    await adminStudentGroupRepository.updateGroup(id, payload);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_group",
      tableName: "groups",
      recordId: id,
      title: payload.group_code,
      newValues: payload,
    });
    return getGroup(id);
  };

  const deleteGroup = async (id, actor) => {
    const group = await getGroup(id);
    await adminStudentGroupRepository.updateGroup(id, { status: "dissolved", deleted_at: new Date() });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_delete_group",
      tableName: "groups",
      recordId: id,
      title: group.group_code,
    });
  };

  const addGroupMember = async (groupId, data, actor) => {
    const group = await getGroup(groupId);
    const student = await adminStudentGroupRepository.findStudentById(data.student_id);
    if (!student) throw NotFound("Student");
    const enrollment = await adminStudentGroupRepository.findEnrollmentByClassStudent(group.class_id, student.id);
    if (!enrollment || enrollment.status !== "enrolled") {
      throw BadRequest("Không thể thêm sinh viên chưa enrolled trong lớp vào nhóm");
    }
    const activeInClass = await adminStudentGroupRepository.findActiveGroupForStudentInClass(student.id, group.class_id);
    if (activeInClass && Number(activeInClass.group_id) !== Number(groupId)) {
      throw BadRequest(`Sinh viên đã thuộc nhóm ${activeInClass.group_name} trong lớp này`);
    }
    const existing = await adminStudentGroupRepository.findGroupMember(groupId, student.id);
    if (!existing && await adminStudentGroupRepository.countActiveGroupMembers(groupId) >= Number(group.max_members)) {
      throw BadRequest("Nhóm đã đạt số thành viên tối đa");
    }
    if (data.role === "leader") {
      await adminStudentGroupRepository.demoteGroupLeaders(groupId, student.id);
    }
    if (existing) {
      await adminStudentGroupRepository.updateGroupMember(existing.id, {
        role: data.role || existing.role,
        status: "active",
        left_at: null,
      });
    } else {
      await adminStudentGroupRepository.createGroupMember({
        groupId,
        studentId: student.id,
        role: data.role || "member",
      });
    }
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_add_group_member",
      tableName: "group_members",
      recordId: groupId,
      title: `${group.group_code}:${student.student_code}`,
      newValues: { student_id: student.id, role: data.role || "member" },
    });
    return adminStudentGroupRepository.listGroupMembers(groupId);
  };

  const updateGroupMember = async (groupId, studentId, data, actor) => {
    const member = await adminStudentGroupRepository.findGroupMember(groupId, studentId);
    if (!member) throw NotFound("Group member");
    const group = await getGroup(groupId);
    if (data.status === "active") {
      const enrollment = await adminStudentGroupRepository.findEnrollmentByClassStudent(group.class_id, studentId);
      if (!enrollment || enrollment.status !== "enrolled") {
        throw BadRequest("Không thể active sinh viên chưa enrolled trong lớp");
      }
      const activeInClass = await adminStudentGroupRepository.findActiveGroupForStudentInClass(studentId, group.class_id);
      if (activeInClass && Number(activeInClass.group_id) !== Number(groupId)) {
        throw BadRequest(`Sinh viên đã thuộc nhóm ${activeInClass.group_name} trong lớp này`);
      }
      if (member.status !== "active" && await adminStudentGroupRepository.countActiveGroupMembers(groupId) >= Number(group.max_members)) {
        throw BadRequest("Nhóm đã đạt số thành viên tối đa");
      }
    }
    if (data.role === "leader") await adminStudentGroupRepository.demoteGroupLeaders(groupId, studentId);
    const updates = {};
    if (data.role !== undefined) updates.role = data.role;
    if (data.status !== undefined) {
      updates.status = data.status;
      updates.left_at = data.status === "active" ? null : new Date();
    }
    await adminStudentGroupRepository.updateGroupMember(member.id, updates);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_group_member",
      tableName: "group_members",
      recordId: member.id,
      newValues: updates,
    });
    return adminStudentGroupRepository.listGroupMembers(groupId);
  };

  const removeGroupMember = (groupId, studentId, actor) =>
    updateGroupMember(groupId, studentId, { status: "removed" }, actor);

  const listGroupInvites = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminStudentGroupRepository.listGroupInvites({
      search: query.search?.trim() || null,
      groupId: query.group_id || null,
      status: query.status || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const updateGroupInviteStatus = async (id, status, actor) => {
    await adminStudentGroupRepository.updateGroupInvite(id, {
      status,
      ...(status === "pending" ? { email_delivery_status: "queued", email_last_error: null } : {}),
    });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_group_invite",
      tableName: "group_invites",
      recordId: id,
      newValues: { status },
    });
    return { id: Number(id), status };
  };

  const listGroupReports = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminStudentGroupRepository.listGroupReports({
      search: query.search?.trim() || null,
      groupId: query.group_id || null,
      issueType: query.issue_type || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getGroupReport = async (id) => {
    const report = await adminStudentGroupRepository.findGroupReportById(id);
    if (!report) throw NotFound("Group report");
    return report;
  };

  const getLookups = () => adminStudentGroupRepository.getLookups();

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
    getLookups,
  };
};
