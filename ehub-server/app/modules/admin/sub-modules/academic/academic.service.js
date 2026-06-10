import { AlreadyExists, BadRequest, NotFound } from "app/core/errors/errorFactory.js";
import { parsePagination } from "app/core/utils/pagination.js";

const clean = (value) => String(value ?? "").trim();
const nullable = (value) => {
  const text = clean(value);
  return text || null;
};
const normalizeCode = (value) => clean(value).toUpperCase();

const toDateOnlyTime = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

export const createAdminAcademicService = ({ adminAcademicRepository, transaction, auditService, groupRepository, inviteRepository }) => {
  const pageArgs = (query) => parsePagination({ page: query.page, limit: query.limit });

  const listSubjects = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminAcademicRepository.listSubjects({
      search: query.search?.trim() || null,
      status: query.status || null,
      deleted: query.deleted || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getSubject = async (id, options = {}) => {
    const subject = await adminAcademicRepository.findSubjectById(id, options);
    if (!subject) throw NotFound("Subject");
    return subject;
  };

  const createSubject = async (data, actor) => {
    const subjectCode = normalizeCode(data.subject_code);
    if (await adminAcademicRepository.findSubjectByCode(subjectCode)) {
      throw AlreadyExists("Subject code đã tồn tại");
    }
    const id = await adminAcademicRepository.createSubject({
      subject_code: subjectCode,
      subject_name: clean(data.subject_name),
      subject_name_en: nullable(data.subject_name_en),
      description: nullable(data.description),
      credits: Number(data.credits || 0),
      status: data.status || "active",
      created_by: actor?.id || null,
    });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_create_subject",
      tableName: "subjects",
      recordId: id,
      title: subjectCode,
      newValues: { subject_code: subjectCode },
    });
    return getSubject(id);
  };

  const updateSubject = async (id, data, actor) => {
    const subject = await getSubject(id);
    const updates = {};
    if (data.subject_code !== undefined) {
      const subjectCode = normalizeCode(data.subject_code);
      if (await adminAcademicRepository.findSubjectByCode(subjectCode, id)) {
        throw AlreadyExists("Subject code đã tồn tại");
      }
      updates.subject_code = subjectCode;
    }
    if (data.subject_name !== undefined) updates.subject_name = clean(data.subject_name);
    if (data.subject_name_en !== undefined) updates.subject_name_en = nullable(data.subject_name_en);
    if (data.description !== undefined) updates.description = nullable(data.description);
    if (data.credits !== undefined) updates.credits = Number(data.credits);
    if (data.status !== undefined) updates.status = data.status;
    await adminAcademicRepository.updateSubject(id, updates);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_subject",
      tableName: "subjects",
      recordId: id,
      title: updates.subject_code || subject.subject_code,
      oldValues: { subject_code: subject.subject_code },
      newValues: updates,
    });
    return getSubject(id);
  };

  const updateSubjectStatus = async (id, status, actor) => updateSubject(id, { status }, actor);

  const deleteSubject = async (id, actor) => {
    const subject = await getSubject(id);
    const totalClasses = await adminAcademicRepository.countSubjectClasses(id);
    if (totalClasses > 0) {
      throw BadRequest("Không thể xoá học phần đã có lớp liên quan");
    }
    await adminAcademicRepository.updateSubject(id, { deleted_at: new Date() });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_delete_subject",
      tableName: "subjects",
      recordId: id,
      title: subject.subject_code,
      oldValues: { subject_code: subject.subject_code },
    });
  };

  const restoreSubject = async (id, actor) => {
    const subject = await adminAcademicRepository.findSubjectById(id, { includeDeleted: true });
    if (!subject) throw NotFound("Subject");
    await adminAcademicRepository.updateSubject(id, { deleted_at: null });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_restore_subject",
      tableName: "subjects",
      recordId: id,
      title: subject.subject_code,
    });
    return getSubject(id);
  };

  const listSemesters = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminAcademicRepository.listSemesters({
      search: query.search?.trim() || null,
      year: query.year || null,
      status: query.status || null,
      deleted: query.deleted || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getSemester = async (id, options = {}) => {
    const semester = await adminAcademicRepository.findSemesterById(id, options);
    if (!semester) throw NotFound("Semester");
    return semester;
  };

  const assertSemesterDates = (startDate, endDate) => {
    const start = toDateOnlyTime(startDate);
    const end = toDateOnlyTime(endDate);
    if (start == null || end == null || start >= end) {
      throw BadRequest("start_date phải nhỏ hơn end_date");
    }
  };

  const createSemester = async (data, actor) => {
    const semesterCode = normalizeCode(data.semester_code);
    if (await adminAcademicRepository.findSemesterByCode(semesterCode)) {
      throw AlreadyExists("Semester code đã tồn tại");
    }
    assertSemesterDates(data.start_date, data.end_date);
    const id = await adminAcademicRepository.createSemester({
      semester_code: semesterCode,
      semester_name: clean(data.semester_name),
      year: Number(data.year),
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status || "upcoming",
      created_by: actor?.id || null,
    });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_create_semester",
      tableName: "semesters",
      recordId: id,
      title: semesterCode,
      newValues: { semester_code: semesterCode },
    });
    return getSemester(id);
  };

  const assertSemesterEditable = (semester) => {
    if (semester.status === "completed") {
      throw BadRequest("Học kỳ đã kết thúc, không thể chỉnh sửa.");
    }
  };

  const updateSemester = async (id, data, actor) => {
    const semester = await getSemester(id);
    assertSemesterEditable(semester);
    const updates = {};
    if (data.semester_code !== undefined) {
      const semesterCode = normalizeCode(data.semester_code);
      if (await adminAcademicRepository.findSemesterByCode(semesterCode, id)) {
        throw AlreadyExists("Semester code đã tồn tại");
      }
      updates.semester_code = semesterCode;
    }
    if (data.semester_name !== undefined) updates.semester_name = clean(data.semester_name);
    if (data.year !== undefined) updates.year = Number(data.year);
    if (data.start_date !== undefined) updates.start_date = data.start_date;
    if (data.end_date !== undefined) updates.end_date = data.end_date;
    if (data.status !== undefined) updates.status = data.status;
    assertSemesterDates(updates.start_date || semester.start_date, updates.end_date || semester.end_date);
    await adminAcademicRepository.updateSemester(id, updates);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_semester",
      tableName: "semesters",
      recordId: id,
      title: updates.semester_code || semester.semester_code,
      oldValues: { semester_code: semester.semester_code, status: semester.status },
      newValues: updates,
    });
    return getSemester(id);
  };

  const updateSemesterStatus = async (id, status, actor) => updateSemester(id, { status }, actor);

  const listClasses = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminAcademicRepository.listClasses({
      search: query.search?.trim() || null,
      subjectId: query.subject_id || null,
      semesterId: query.semester_id || null,
      lecturerId: query.lecturer_id || null,
      status: query.status || null,
      deleted: query.deleted || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getClass = async (id, options = {}) => {
    const cls = await adminAcademicRepository.findClassById(id, options);
    if (!cls) throw NotFound("Class");
    return cls;
  };

  const assertClassRefs = async ({ subject_id, semester_id, lecturer_id }) => {
    if (subject_id) {
      const subject = await adminAcademicRepository.findLookupSubject(subject_id);
      if (!subject) {
        throw BadRequest("Học phần không tồn tại hoặc đã bị xoá");
      }
      if (subject.status === "inactive") {
        throw BadRequest(`Học phần "${subject.subject_name}" (${subject.subject_code}) đang ở trạng thái không hoạt động. Không thể tạo hoặc cập nhật lớp học.`);
      }
    }
    if (semester_id) {
      const semester = await adminAcademicRepository.findLookupSemester(semester_id);
      if (!semester) {
        throw BadRequest("Học kỳ không tồn tại hoặc đã bị xoá");
      }
    }
    if (lecturer_id && !await adminAcademicRepository.findLecturerUser(lecturer_id)) {
      throw BadRequest("Giảng viên không tồn tại hoặc không có role lecturer");
    }
  };

  const assertClassCodeAvailable = async (classCode, semesterId, excludeId = null) => {
    if (await adminAcademicRepository.findClassByCodeSemester(classCode, semesterId, excludeId)) {
      throw AlreadyExists("Class code đã tồn tại trong học kỳ này");
    }
  };

  const normalizeClassPayload = (data) => ({
    subject_id: Number(data.subject_id),
    semester_id: Number(data.semester_id),
    class_code: normalizeCode(data.class_code),
    class_name: nullable(data.class_name),
    lecturer_id: data.lecturer_id ? Number(data.lecturer_id) : null,
    max_students: Number(data.max_students),
    min_group_members: Number(data.min_group_members),
    max_group_members: Number(data.max_group_members),
    status: data.status || "draft",
  });

  const assertSemesterAllowsNewClass = async (semesterId) => {
    const semester = await adminAcademicRepository.findLookupSemester(semesterId);
    if (!semester) {
      throw BadRequest("Học kỳ không tồn tại hoặc đã bị xoá");
    }
    if (semester.status === "completed") {
      const label = semester.semester_name || semester.semester_code;
      throw BadRequest(`Học kỳ "${label}" đã kết thúc. Không thể tạo lớp học.`);
    }
  };

  const createClass = async (data, actor) => {
    const payload = normalizeClassPayload(data);
    await assertClassRefs(payload);
    await assertSemesterAllowsNewClass(payload.semester_id);
    await assertClassCodeAvailable(payload.class_code, payload.semester_id);
    const id = await adminAcademicRepository.createClass({
      ...payload,
      created_by: actor?.id || null,
    });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_create_class",
      tableName: "classes",
      recordId: id,
      title: payload.class_code,
      newValues: { class_code: payload.class_code },
    });
    return getClass(id);
  };

  const updateClass = async (id, data, actor) => {
    const cls = await getClass(id);
    const updates = {};
    const allowed = [
      "subject_id",
      "semester_id",
      "class_code",
      "class_name",
      "lecturer_id",
      "max_students",
      "min_group_members",
      "max_group_members",
      "status",
    ];
    for (const key of allowed) {
      if (data[key] === undefined) continue;
      if (key.endsWith("_id")) updates[key] = data[key] ? Number(data[key]) : null;
      else if (["max_students", "min_group_members", "max_group_members"].includes(key)) updates[key] = Number(data[key]);
      else if (key === "class_code") updates[key] = normalizeCode(data[key]);
      else if (key === "class_name") updates[key] = nullable(data[key]);
      else updates[key] = data[key];
    }
    const candidate = { ...cls, ...updates };
    if (Number(candidate.min_group_members) > Number(candidate.max_group_members)) {
      throw BadRequest("min_group_members phải nhỏ hơn hoặc bằng max_group_members");
    }
    await assertClassRefs(candidate);
    if (updates.class_code !== undefined || updates.semester_id !== undefined) {
      await assertClassCodeAvailable(candidate.class_code, candidate.semester_id, id);
    }
    if (updates.status === "archived") await assertClassCanArchive(id);
    await adminAcademicRepository.updateClass(id, updates);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_class",
      tableName: "classes",
      recordId: id,
      title: candidate.class_code,
      oldValues: { class_code: cls.class_code, status: cls.status },
      newValues: updates,
    });
    return getClass(id);
  };

  const assertClassCanArchive = async (id) => {
    const deps = await adminAcademicRepository.getClassDependencies(id);
    if (deps.submissions) {
      throw BadRequest("Không thể archive/xoá lớp đã có bài nộp");
    }
  };

  const updateClassStatus = async (id, status, actor) => updateClass(id, { status }, actor);

  const deleteClass = async (id, actor) => {
    const cls = await getClass(id);
    await assertClassCanArchive(id);
    const cleanup = await groupRepository.dissolveByClassId(id);
    const deletedInvites = await inviteRepository.deleteByClassId(id);
    await adminAcademicRepository.updateClass(id, { status: "archived", deleted_at: new Date() });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_delete_class",
      tableName: "classes",
      recordId: id,
      title: cls.class_code,
      oldValues: { class_code: cls.class_code },
      newValues: {
        dissolved_groups: cleanup.dissolvedGroups,
        removed_members: cleanup.removedMembers,
        deleted_invites: deletedInvites,
      },
    });
    return { cleanup, deletedInvites };
  };

  const getLookups = () => adminAcademicRepository.getLookups();

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
    getLookups,
  };
};
