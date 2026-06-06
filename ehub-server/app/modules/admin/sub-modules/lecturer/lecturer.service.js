import bcrypt from "bcryptjs";
import { AlreadyExists, BadRequest, NotFound } from "app/core/errors/errorFactory.js";
import { parsePagination } from "app/core/utils/pagination.js";

const clean = (value) => String(value ?? "").trim();
const nullable = (value) => {
  const text = clean(value);
  return text || null;
};

const profilePayload = (data = {}) => ({
  display_name: nullable(data.display_name),
  bio: nullable(data.bio),
  locale: nullable(data.locale),
  timezone: nullable(data.timezone),
});

const lecturerProfilePayload = (data = {}) => ({
  department: nullable(data.department),
  academic_title: nullable(data.academic_title),
  specialization: nullable(data.specialization),
  office_location: nullable(data.office_location),
  contact_note: nullable(data.contact_note),
});

export const createAdminLecturerService = ({
  adminLecturerRepository,
  transaction,
  auditService,
  tokenService,
}) => {
  const pageArgs = (query) => parsePagination({ page: query.page, limit: query.limit });

  const assertLecturer = async (id) => {
    const lecturer = await adminLecturerRepository.findLecturerById(id);
    if (!lecturer) throw NotFound("Lecturer");
    return lecturer;
  };

  const listLecturers = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminLecturerRepository.listLecturers({
      search: query.search?.trim() || null,
      status: query.status || null,
      authProvider: query.auth_provider || null,
      semesterId: query.semester_id || null,
      subjectId: query.subject_id || null,
      hasActiveClass: query.has_active_class || null,
      hasPendingGrading: query.has_pending_grading || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getLecturer = (id) => assertLecturer(id);

  const createLecturer = async (data, actor) => {
    const email = clean(data.email);
    const username = clean(data.username);
    if (await adminLecturerRepository.findUserByEmail(email)) throw AlreadyExists("Email đã tồn tại");
    if (await adminLecturerRepository.findUserByUsername(username)) throw AlreadyExists("Username đã tồn tại");
    if (!await adminLecturerRepository.findRoleByCode("lecturer")) {
      throw BadRequest("Role lecturer chưa được seed trong hệ thống");
    }
    const isLocal = (data.auth_provider || "local") === "local";
    const password = isLocal ? await bcrypt.hash(data.password, 12) : null;
    const profile = data.profile || {};
    const id = await transaction.run(async (conn) => {
      await adminLecturerRepository.releaseDeletedUserIdentities({ username, email }, conn);
      const userId = await adminLecturerRepository.createUser({
        username,
        email,
        password,
        full_name: clean(data.full_name),
        phone: nullable(data.phone),
        avatar_url: nullable(data.avatar_url),
        auth_provider: data.auth_provider || "local",
        status: data.status || "active",
      }, conn);
      await adminLecturerRepository.assignLecturerRole(userId, actor?.id, conn);
      await adminLecturerRepository.upsertUsersProfile(userId, profilePayload(profile), conn);
      await adminLecturerRepository.upsertLecturerProfile(userId, lecturerProfilePayload(profile), conn);
      return userId;
    });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_create_lecturer",
      tableName: "users",
      recordId: id,
      title: username,
      newValues: { email, username, role: "lecturer" },
    });
    return assertLecturer(id);
  };

  const updateLecturer = async (id, data, actor) => {
    const lecturer = await assertLecturer(id);
    if (data.email && await adminLecturerRepository.findUserByEmail(clean(data.email), id)) {
      throw AlreadyExists("Email đã tồn tại");
    }
    if (data.username && await adminLecturerRepository.findUserByUsername(clean(data.username), id)) {
      throw AlreadyExists("Username đã tồn tại");
    }
    const updates = {};
    for (const key of ["username", "email", "full_name", "phone", "avatar_url", "auth_provider", "status"]) {
      if (data[key] === undefined) continue;
      updates[key] = ["phone", "avatar_url"].includes(key) ? nullable(data[key]) : clean(data[key]);
    }
    await adminLecturerRepository.updateUser(id, updates);
    if (updates.status === "locked" || updates.status === "inactive") {
      await tokenService.revokeAllTokens(id);
    }
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_lecturer",
      tableName: "users",
      recordId: id,
      title: lecturer.username,
      oldValues: { username: lecturer.username, email: lecturer.email, status: lecturer.status },
      newValues: updates,
    });
    return assertLecturer(id);
  };

  const updateLecturerStatus = (id, status, actor) => updateLecturer(id, { status }, actor);

  const updateLecturerPassword = async (id, data, actor) => {
    const lecturer = await assertLecturer(id);
    const hashedPassword = await bcrypt.hash(data.new_password, 12);
    await adminLecturerRepository.updateUser(id, {
      password: hashedPassword,
      auth_provider: "local",
    });
    if (data.force_logout !== false) {
      await tokenService.revokeAllTokens(id);
    }
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_change_lecturer_password",
      tableName: "users",
      recordId: id,
      title: lecturer.username,
      oldValues: { password: "[HIDDEN]" },
      newValues: { password: "[HIDDEN]", auth_provider: "local", force_logout: data.force_logout !== false },
    });
    return assertLecturer(id);
  };

  const deleteLecturer = async (id, actor) => {
    const lecturer = await assertLecturer(id);
    const assignedClasses = await adminLecturerRepository.countAssignedClasses(id);
    if (assignedClasses > 0) {
      throw BadRequest("Không thể xóa giảng viên đã được gán vào lớp");
    }
    await adminLecturerRepository.softDeleteLecturer(id);
    await tokenService.revokeAllTokens(id);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_delete_lecturer",
      tableName: "users",
      recordId: id,
      title: lecturer.username,
      oldValues: {
        username: lecturer.username,
        email: lecturer.email,
        status: lecturer.status,
        roles: lecturer.roles,
      },
      newValues: { deleted_at: "CURRENT_TIMESTAMP", status: "inactive" },
    });
    return { id: Number(id), deleted: true };
  };

  const getLecturerOverview = async (id) => {
    await assertLecturer(id);
    return adminLecturerRepository.getLecturerOverview(id);
  };

  const getLecturerProfile = (id) => assertLecturer(id);

  const updateLecturerProfile = async (id, data, actor) => {
    const lecturer = await assertLecturer(id);
    const userUpdates = {};
    for (const key of ["full_name", "email", "phone", "avatar_url", "status"]) {
      if (data[key] === undefined) continue;
      userUpdates[key] = ["phone", "avatar_url"].includes(key) ? nullable(data[key]) : clean(data[key]);
    }
    if (userUpdates.email && await adminLecturerRepository.findUserByEmail(userUpdates.email, id)) {
      throw AlreadyExists("Email đã tồn tại");
    }
    await transaction.run(async (conn) => {
      await adminLecturerRepository.updateUser(id, userUpdates, conn);
      await adminLecturerRepository.upsertUsersProfile(id, profilePayload(data), conn);
      await adminLecturerRepository.upsertLecturerProfile(id, lecturerProfilePayload(data), conn);
    });
    if (userUpdates.status === "locked" || userUpdates.status === "inactive") {
      await tokenService.revokeAllTokens(id);
    }
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_lecturer_profile",
      tableName: "lecturer_profiles",
      recordId: id,
      title: lecturer.username,
      oldValues: {
        email: lecturer.email,
        status: lecturer.status,
        department: lecturer.department,
        academic_title: lecturer.academic_title,
      },
      newValues: { ...userUpdates, ...profilePayload(data), ...lecturerProfilePayload(data) },
    });
    return assertLecturer(id);
  };

  const listLecturerClasses = async (id, query) => {
    await assertLecturer(id);
    const pagination = pageArgs(query);
    const result = await adminLecturerRepository.listLecturerClasses({
      lecturerId: id,
      semesterId: query.semester_id || null,
      subjectId: query.subject_id || null,
      status: query.status || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const assignLecturerToClass = async ({ lecturerId, classId, force }, actor) => {
    const lecturer = lecturerId ? await assertLecturer(lecturerId) : null;
    const cls = await adminLecturerRepository.findClassForAssignment(classId);
    if (!cls) throw NotFound("Class");
    if (["completed", "archived"].includes(cls.status) && !force) {
      throw BadRequest("Lớp đã completed/archived. Cần xác nhận mạnh để đổi giảng viên.");
    }
    await adminLecturerRepository.setClassLecturer(classId, lecturerId || null);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_assign_lecturer_class",
      tableName: "classes",
      recordId: classId,
      title: cls.class_code,
      oldValues: { lecturer_id: cls.lecturer_id, lecturer_name: cls.lecturer_name },
      newValues: { lecturer_id: lecturer?.id || null, lecturer_name: lecturer?.full_name || null },
    });
    return adminLecturerRepository.findClassForAssignment(classId);
  };

  const listAvailableClasses = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminLecturerRepository.listAvailableClasses({
      search: query.search?.trim() || null,
      semesterId: query.semester_id || null,
      subjectId: query.subject_id || null,
      status: query.status || null,
      lecturerId: query.lecturer_id || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getLecturerGrading = async (id, query) => {
    await assertLecturer(id);
    return adminLecturerRepository.getLecturerGrading({
      lecturerId: id,
      semesterId: query.semester_id || null,
      classId: query.class_id || null,
      targetType: query.target_type || null,
      status: query.status || null,
      fromDate: query.from_date || null,
      toDate: query.to_date || null,
    });
  };

  const getCreatedContent = async (id) => {
    await assertLecturer(id);
    return adminLecturerRepository.getCreatedContent(id);
  };

  const getLecturerActivity = async (id, query) => {
    await assertLecturer(id);
    const pagination = pageArgs(query);
    const result = await adminLecturerRepository.getLecturerActivity({
      lecturerId: id,
      action: query.action || null,
      tableName: query.table_name || null,
      statusCode: query.status_code || null,
      fromDate: query.from_date || null,
      toDate: query.to_date || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result, ...pagination, total: result.total };
  };

  const getLecturerPermissions = async (id) => {
    await assertLecturer(id);
    return adminLecturerRepository.getLecturerPermissions(id);
  };

  const listWorkload = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminLecturerRepository.listLecturerWorkload({
      semesterId: query.semester_id || null,
      subjectId: query.subject_id || null,
      status: query.status || null,
      hasPendingGrading: query.has_pending_grading || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getLookups = () => adminLecturerRepository.getLookups();

  return {
    listLecturers,
    getLecturer,
    createLecturer,
    updateLecturer,
    updateLecturerStatus,
    updateLecturerPassword,
    deleteLecturer,
    getLecturerOverview,
    getLecturerProfile,
    updateLecturerProfile,
    listLecturerClasses,
    assignLecturerToClass,
    listAvailableClasses,
    getLecturerGrading,
    getCreatedContent,
    getLecturerActivity,
    getLecturerPermissions,
    listWorkload,
    getLookups,
  };
};
