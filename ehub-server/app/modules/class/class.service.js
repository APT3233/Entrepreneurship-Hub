import crypto from "node:crypto";
import { createBaseService } from "app/core/services/baseService.js";
import { NotFound, Forbidden, BadRequest } from "app/core/errors/errorFactory.js";
import { parsePagination } from "app/core/utils/pagination.js";
import { chunkArray } from "app/core/utils/chunk.js";
import { acquireUploadLock, releaseUploadLock } from "app/core/utils/uploadLock.js";
import { Events } from "app/core/constants/events.js";
import { OUTBOX_CLASS_INVITE_EMAIL_DISPATCH } from "app/core/constants/outboxEventTypes.js";
import { appConfig } from "app/config/app.js";
import { logger } from "app/core/logger/index.js";

const SEMESTER_CODES = { 1: "SP", 2: "SU", 3: "FA" };
const SEMESTER_NAMES = { 1: "Spring", 2: "Summer", 3: "Fall" };
const SEMESTER_START_MONTHS = { 1: 0, 2: 4, 3: 8 }; // Jan, May, Sept
// Map ngược prefix mã học kỳ → loại kỳ (1=Spring, 2=Summer, 3=Fall)
const SEMESTER_TYPE_FROM_PREFIX = { SP: 1, SU: 2, FA: 3 };

/** Chuẩn hóa về Date local 00:00 để so sánh với cột DATE từ MySQL */
const toLocalDay = (d) => {
  if (d == null) return null;
  if (d instanceof Date && !Number.isNaN(d.getTime())) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d)) {
    const [y, m, day] = d.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, day);
  }
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
};

/** Trạng thái học kỳ theo lịch: chưa bắt đầu → upcoming, đã hết → completed, còn trong kỳ → ongoing */
const computeSemesterStatusFromDates = (startDate, endDate, refDate = new Date()) => {
  const start = toLocalDay(startDate);
  const end = toLocalDay(endDate);
  const ref = toLocalDay(refDate);
  if (!start || !end || !ref) return "upcoming";
  const tRef = ref.getTime();
  if (tRef < start.getTime()) return "upcoming";
  if (tRef > end.getTime()) return "completed";
  return "ongoing";
};

export const createClassService = ({
  classRepository,
  semesterRepository,
  subjectRepository,
  studentRepository,
  groupRepository,
  enrollmentRepository,
  groupMemberRepository,
  checkpointRepository,
  assignmentRepository,
  transaction,
  eventBus,
  redis,
  inviteRepository,
  outboxRepository,
  auditService,
}) => {
  const base = createBaseService(classRepository, "Class");

  const userRoles = (user) => (user?.roles || []).map((r) => String(r).toLowerCase());
  const hasRole = (user, ...roles) => userRoles(user).some((role) => roles.includes(role));
  const isAdminOrDept = (user) => hasRole(user, "admin", "department_head");
  const isLecturerOnly = (user) =>
    hasRole(user, "lecturer") && !isAdminOrDept(user);
  const isStudentOnly = (user) =>
    userRoles(user).length > 0 && userRoles(user).every((role) => role === "student");

  const emptyPage = (query) => {
    const pagination = parsePagination(query);
    return { data: [], ...pagination, total: 0 };
  };

  const assertCanReadClass = async (cls, user) => {
    if (isAdminOrDept(user)) return;
    if (isLecturerOnly(user)) {
      if (Number(cls.lecturer_id) !== Number(user.id)) throw Forbidden("Class does not belong to you");
      return;
    }
    if (isStudentOnly(user)) {
      const student = await studentRepository.findByUserId(user.id);
      if (!student) throw Forbidden("Class does not belong to you");
      const enrollment = await enrollmentRepository.findByClassAndStudent(cls.id, student.id);
      if (!enrollment || String(enrollment.status) !== "enrolled") {
        throw Forbidden("Class does not belong to you");
      }
      return;
    }
    throw Forbidden("Class access denied");
  };

  /**
   * Đảm bảo tồn tại 1 học kỳ có semester_code = semCode.
   * Quy tắc:
   *   - Nếu đã có và chưa xóa mềm → trả về luôn.
   *   - Nếu có nhưng đang xóa mềm → restore.
   *   - Nếu chưa có → auto-create với điều kiện thời gian (≤ 3 tháng tương lai, ≤ 12 tháng quá khứ),
   *     ngoài khoảng đó thì throw BadRequest.
   * Dùng chung cho cả luồng tạo và sửa lớp.
   */
  const ensureSemester = async (semCode, semesterType, year) => {
    /** Nếu status trong DB lệch so với start/end (vd đã qua kỳ mà vẫn upcoming) → cập nhật */
    const syncSemesterRowStatusIfNeeded = async (sem) => {
      if (!sem?.start_date || !sem?.end_date) return sem;
      const correct = computeSemesterStatusFromDates(sem.start_date, sem.end_date);
      if (sem.status !== correct) {
        await semesterRepository.update(sem.id, { status: correct, updated_at: new Date() });
        return { ...sem, status: correct };
      }
      return sem;
    };

    const existing = await semesterRepository.findByCode(semCode);
    if (existing) return syncSemesterRowStatusIfNeeded(existing);

    const anySem = await semesterRepository.findAnyByCode(semCode);
    if (anySem) {
      await semesterRepository.restore(anySem.id);
      const restored = await semesterRepository.findById(anySem.id);
      if (!restored) throw BadRequest(`Không thể khôi phục học kỳ ${semCode}.`);
      return syncSemesterRowStatusIfNeeded(restored);
    }

    const startMonth = SEMESTER_START_MONTHS[semesterType] ?? 0;
    const startDate = new Date(year, startMonth, 1);
    const now = new Date();
    const diffMonths =
      (startDate.getFullYear() - now.getFullYear()) * 12 + (startDate.getMonth() - now.getMonth());

    // Cho phép tự tạo trước 3 tháng và quá khứ tối đa 12 tháng (an toàn cho thao tác chỉnh sửa)
    if (diffMonths > 3 || diffMonths < -12) {
      throw BadRequest(`Học kỳ ${semCode} chưa được mở (chỉ cho phép tạo trước tối đa 3 tháng).`);
    }

    const endDate = new Date(year, startMonth + 3, 30); // Giả định mỗi kỳ ~4 tháng
    const status = computeSemesterStatusFromDates(startDate, endDate);
    return semesterRepository.create({
      semester_code: semCode,
      semester_name: `${SEMESTER_NAMES[semesterType]} ${year}`,
      year,
      start_date: startDate,
      end_date: endDate,
      status,
    });
  };

  const resolveSemesters = async (query) => {
    const year = query.year != null ? Number(query.year) : null;
    if (query.semester_id != null) {
      return { semesterId: Number(query.semester_id), semesterIds: null };
    }
    if (query.semester_code) {
      const sem = await semesterRepository.findByCode(query.semester_code);
      if (!sem) return { semesterId: null, semesterIds: [] };
      if (year && Number(sem.year) !== year) return { semesterId: null, semesterIds: [] };
      return { semesterId: sem.id, semesterIds: null };
    }
    if (year) {
      const list = await semesterRepository.findManyByYear(year);
      const ids = list.map((s) => s.id);
      return { semesterId: null, semesterIds: ids };
    }
    return { semesterId: null, semesterIds: null };
  };

  const getById = async (id, user = null) => {
    const cls = await classRepository.findWithDetails(id);
    if (!cls) throw NotFound("Class");
    await assertCanReadClass(cls, user);
    return cls;
  };

  /**
   * Tổng hợp chi tiết lớp học: thông tin lớp + thống kê + groups + students
   * Dùng cho trang ClassDetailPage.
   */
  const getOverview = async (id, user = null) => {
    const cls = await classRepository.findWithDetails(id);
    if (!cls) throw NotFound("Class");
    await assertCanReadClass(cls, user);

    const classId = Number(id);
    const [enrollments, groups, memberRows] = await Promise.all([
      enrollmentRepository.findByClass(classId),
      groupRepository.findByClass(classId),
      groupMemberRepository.findMembersByClass(classId),
    ]);

    const studentCount = enrollments.length;
    const groupCount = groups.length;

    // Map student_id -> { groupId, groupName, isLeader } (mỗi sinh viên tối đa 1 nhóm)
    const studentToGroup = new Map();
    for (const row of memberRows) {
      studentToGroup.set(row.student_id, {
        groupId: row.group_id,
        groupName: row.group_name || row.group_code,
        isLeader: (row.role || "").toLowerCase() === "leader",
      });
    }

    const subject =
      cls.subject_code && cls.subject_name
        ? `${cls.subject_code} - ${cls.subject_name}`
        : cls.subject_name || cls.subject_code || "";

    // Nếu semester_name đã bao gồm cả năm (vd: "Spring 2026") thì dùng luôn,
    // nếu không có thì fallback sang semester_code.
    const semester = cls.semester_name || cls.semester_code || "";

    return {
      id: cls.id,
      classCode: cls.class_code,
      subject,
      lecturer: cls.lecturer_name || "",
      semester,
      semester_status: cls.semester_status || null,
      year: cls.year ?? null,
      semester_id: cls.semester_id ?? null,
      // Trả thêm semester_code để FE có thể derive đúng loại kỳ (SP/SU/FA → 1/2/3) khi sửa lớp
      semester_code: cls.semester_code || null,
      studentCount,
      groupCount,
      assignmentCount: 0,
      needGradingCount: 0,
      groups: groups.map((g) => ({
        id: g.id,
        name: g.group_name || g.group_code,
      })),
      students: enrollments.map((e) => {
        const gr = studentToGroup.get(e.student_id);
        const uid = e.user_id;
        const accountActivated = uid != null && uid !== "" && Number(uid) > 0;
        return {
          id: e.student_id,
          mssv: e.student_code,
          student_code: e.student_code,
          name: e.full_name,
          email: e.email,
          major: e.major,
          avatar: e.avatar_url || null,
          accountActivated,
          isLeader: gr ? gr.isLeader : false,
          groupId: gr ? gr.groupId : null,
          groupName: gr ? gr.groupName : null,
        };
      }),
      createdAt: cls.created_at,
      updatedAt: cls.updated_at,
      manipulationDays: appConfig.class.manipulationDays,
    };
  };

  /** Thống kê dashboard lecturer: số lớp, số nhóm (lọc theo year/semester) */
  const getStats = async (query, lecturerId) => {
    const { semesterId, semesterIds } = await resolveSemesters(query);
    const useIds = Array.isArray(semesterIds) && semesterIds.length > 0 ? semesterIds : null;
    const [
      classCount,
      groupCount,
      submissionStats,
      groupStats,
      needGradingCheckpoints,
      needGradingAssignments,
      managedStudentCount,
      totalStudentCount,
    ] = await Promise.all([
      classRepository.countByLecturer(lecturerId, semesterId, useIds),
      groupRepository.countByLecturer({ lecturerId, semesterId: semesterId ?? undefined, semesterIds: useIds || undefined }),
      checkpointRepository.getSubmissionStatsByLecturer(lecturerId, semesterId, useIds),
      groupRepository.getGroupStatsByLecturer(lecturerId, semesterId, useIds),
      checkpointRepository.countNeedGradingByLecturer(lecturerId, semesterId, useIds),
      assignmentRepository.countNeedGradingByLecturer(lecturerId, semesterId, useIds),
      classRepository.countStudentsByLecturer(lecturerId),
      studentRepository.countTotalActive(),
    ]);
    return {
      classCount,
      groupCount,
      checkpointStats: submissionStats,
      groupStats,
      assignmentCount: submissionStats.total_checkpoints,
      needGradingCount: needGradingCheckpoints + needGradingAssignments,
      managedStudentCount,
      totalStudentCount,
    };
  };

  /** Thống kê dashboard student: trạng thái nhóm, checkpoint cần xử lý */
  const getStudentStats = async (userId) => {
    const [checkpointStats, assignmentStats, groups] = await Promise.all([
      checkpointRepository.getStudentStats(userId),
      assignmentRepository.getStudentStats(userId),
      groupRepository.findByStudent(userId),
    ]);

    // Gộp thống kê từ cả Checkpoint và Assignment
    const combinedStats = {
      total: checkpointStats.total + assignmentStats.total,
      submitted: checkpointStats.submitted + assignmentStats.submitted,
      pending: checkpointStats.pending + assignmentStats.pending,
      late: checkpointStats.late + assignmentStats.late,
      avgScore: 0
    };

    // Tính điểm trung bình chung chính xác
    const totalSum = checkpointStats.sumScore + assignmentStats.sumScore;
    const totalCount = checkpointStats.scoredCount + assignmentStats.scoredCount;
    if (totalCount > 0) {
      combinedStats.avgScore = Number((totalSum / totalCount).toFixed(1));
    }

    // Lấy thông tin nhóm hiện tại (nhóm mới nhất hoặc đang hoạt động)
    const activeGroup = groups.length > 0 ? groups[0] : null;
    let groupMemberStats = null;

    if (activeGroup) {
      groupMemberStats = await groupRepository.getMemberStatsByGroupId(activeGroup.id);
    }

    return {
      checkpointStats: combinedStats,
      group: activeGroup ? {
        id: activeGroup.id,
        name: activeGroup.group_name || activeGroup.group_code,
        classCode: activeGroup.class_code,
        memberStats: groupMemberStats,
      } : null,
    };
  };

  const getList = async (query, user = null) => {
    const { semesterId, semesterIds } = await resolveSemesters(query);
    if (Array.isArray(semesterIds) && semesterIds.length === 0) return emptyPage(query);

    const filters = {
      ...(query.status && { status: query.status }),
      ...(query.subject_id && { subject_id: query.subject_id }),
      ...(semesterId != null && { semester_id: semesterId }),
    };

    if (isLecturerOnly(user)) {
      const pagination = parsePagination(query);
      const [data, total] = await Promise.all([
        classRepository.findManyWithCountsByLecturer(user.id, {
          semesterId: semesterId ?? undefined,
          semesterIds: semesterIds && semesterIds.length ? semesterIds : undefined,
          limit: pagination.limit,
          offset: pagination.offset,
        }),
        classRepository.countByLecturer(
          user.id,
          semesterId ?? undefined,
          semesterIds && semesterIds.length ? semesterIds : null
        ),
      ]);
      return { data, ...pagination, total };
    }

    if (isStudentOnly(user)) {
      const pagination = parsePagination(query);
      const student = await studentRepository.findByUserId(user.id);
      if (student) {
        const data = await classRepository.findEnrolledByStudent(student.id, {
          semesterId: semesterId ?? undefined,
          year: query.year ? Number(query.year) : undefined,
        });
        return { data, total: data.length, page: pagination.page, limit: pagination.limit };
      }
      return { data: [], total: 0, page: pagination.page, limit: pagination.limit };
    }

    if (!isAdminOrDept(user)) throw Forbidden("Class access denied");

    return base.getList(query, {
      allowedSortColumns: ["class_code", "class_name", "status", "max_students", "created_at"],
      filters,
    });
  };

  const create = async (data) => {
    const subjectCode = data.subject ?? data.monHoc;
    const classSection = data.classSection ?? data.lop;
    const semesterType = data.semester ?? data.ky;
    const useNewFormat = subjectCode != null && data.year != null && semesterType != null && classSection != null;
    logger.debug("[createClass] Request received", {
      use_new_format: useNewFormat,
      student_count: data?.students?.list?.length ?? data?.students?.length ?? 0,
    });
    if (useNewFormat) return createWithStudents({ ...data, subject: subjectCode, classSection, semester: semesterType });
    return base.create(data);
  };

  const createWithStudents = async (data) => {
    const { subject: subjectCode, classSection, year, semester: semesterType, students, created_by } = data;
    const subject = await subjectRepository.findByCode(subjectCode);
    if (!subject) throw BadRequest(`Subject not found: ${subjectCode}`);
    if (subject.status === "inactive") {
      throw BadRequest(
        `Học phần "${subject.subject_name}" (${subjectCode}) đang ở trạng thái không hoạt động (Inactive). Không thể tạo lớp học.`
      );
    }
    const semCode = `${SEMESTER_CODES[semesterType] || "SP"}${year}`;
    const semester = await ensureSemester(semCode, semesterType, year);

    const classCode = `${subjectCode}-${String(classSection).padStart(2, "0")}-${semCode}`;

    const lockKey = `lock:upload:${classCode}`;
    const locked = redis ? await acquireUploadLock(redis, lockKey) : true;
    if (!locked) throw BadRequest("Upload in progress, please try again later");
    try {
      const { classId, insertedCount, pendingInvitees, mailDispatchPublicId } = await transaction.run(async (conn) => {
        // 1) Guard: cấm tạo trùng mã lớp đang active trong cùng học kỳ.
        //    Re-check trong transaction để tránh race condition khi 2 request chạy song song.
        const [activeRows] = await conn.execute(
          "SELECT id FROM `classes` WHERE class_code = ? AND semester_id = ? AND deleted_at IS NULL LIMIT 1",
          [classCode, semester.id]
        );
        if (activeRows.length > 0) {
          throw BadRequest(`Lớp học "${classCode}" đã tồn tại trong học kỳ này.`);
        }

        // 2) Nếu tồn tại bản ghi đã xóa mềm cùng class_code + semester_id → restore và làm mới.
        //    Thao tác này nằm trong transaction để đảm bảo atomic: nếu bước sau fail thì rollback sạch.
        const [softDeletedRows] = await conn.execute(
          "SELECT id FROM `classes` WHERE class_code = ? AND semester_id = ? AND deleted_at IS NOT NULL LIMIT 1",
          [classCode, semester.id]
        );
        let classId = null;
        if (softDeletedRows.length > 0) {
          classId = softDeletedRows[0].id;
          await conn.execute(
            `UPDATE \`classes\`
               SET deleted_at = NULL,
                   subject_id = ?,
                   class_name = ?,
                   lecturer_id = ?,
                   max_students = ?,
                   min_group_members = ?,
                   max_group_members = ?,
                   status = 'draft',
                   created_by = ?,
                   updated_at = NOW()
             WHERE id = ?`,
            [
              subject.id,
              data.class_name || classCode,
              data.lecturer_id || null,
              data.max_students || 40,
              data.min_group_members || 4,
              data.max_group_members || 6,
              data.created_by || null,
              classId,
            ]
          );
          // Xóa sạch danh sách SV cũ để nạp danh sách mới
          await conn.execute("DELETE FROM class_students WHERE class_id = ?", [classId]);
        }

        // 3) Pre-check: 1 sinh viên không được thuộc 2 lớp bất kỳ trong cùng học kỳ (toàn cục, bỏ qua subject).
        //    Gom thành 1 query IN để tránh N+1.
        const studentList = Array.isArray(students?.list) ? students.list : Array.isArray(students) ? students : [];
        const studentCodes = [
          ...new Set(
            studentList
              .map((s) => String(s.memberCode || s.rollNumber || "").trim())
              .filter(Boolean)
          ),
        ];
        if (studentCodes.length > 0) {
          const placeholders = studentCodes.map(() => "?").join(",");
          const conflictSql = `
            SELECT s.student_code, c.class_code
              FROM class_students cs
              JOIN students s ON s.id = cs.student_id
              JOIN \`classes\` c ON c.id = cs.class_id AND c.deleted_at IS NULL
             WHERE s.student_code IN (${placeholders})
               AND c.semester_id = ?
               ${classId ? "AND c.id <> ?" : ""}
          `;
          const conflictParams = classId
            ? [...studentCodes, semester.id, classId]
            : [...studentCodes, semester.id];
          const [conflictRows] = await conn.execute(conflictSql, conflictParams);
          if (conflictRows.length > 0) {
            const preview = conflictRows
              .slice(0, 10)
              .map((r) => `${r.student_code} (đã ở ${r.class_code})`)
              .join(", ");
            const suffix = conflictRows.length > 10
              ? `, ... và ${conflictRows.length - 10} sinh viên khác`
              : "";
            throw BadRequest(
              `Một sinh viên không thể học 2 lớp trong cùng học kỳ. Các sinh viên trùng: ${preview}${suffix}.`
            );
          }
        }

        // 4) Insert class mới nếu không phải trường hợp restore
        if (!classId) {
          const [classRow] = await conn.execute(
            `INSERT INTO \`classes\` (subject_id, semester_id, class_code, class_name, lecturer_id, max_students, min_group_members, max_group_members, status, created_by)
             VALUES (:subject_id, :semester_id, :class_code, :class_name, :lecturer_id, :max_students, :min_group_members, :max_group_members, :status, :created_by)`,
            {
              subject_id: subject.id,
              semester_id: semester.id,
              class_code: classCode,
              class_name: data.class_name || classCode,
              lecturer_id: data.lecturer_id || null,
              max_students: data.max_students || 40,
              min_group_members: data.min_group_members || 4,
              max_group_members: data.max_group_members || 6,
              status: "draft",
              created_by: data.created_by || null,
            }
          );
          classId = classRow.insertId;
        }

        const pendingInvitees = [];

        const chunks = chunkArray(studentList, 10);
        let insertedCount = 0;
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          logger.debug("[createClass] Insert chunk", {
            chunk_index: i + 1,
            chunk_total: chunks.length,
            chunk_size: chunk.length,
          });
          for (let j = 0; j < chunk.length; j++) {
            const s = chunk[j];
            const studentCode = String(s.memberCode || s.rollNumber || "").trim();
            const fullName = String(s.fullname || s.full_name || "").trim();
            const emailVal = String(s.email || "").trim();
            const majorVal = String(s.major || "").trim();
            const importStatus = ["active", "inactive", "graduated", "suspended", "pending"].includes(s?.status) ? s.status : null;
            logger.debug("[createClass] Processing student import row", {
              chunk_index: i + 1,
              row_index: j + 1,
              row_total: chunk.length,
              student_code: studentCode || null,
              email: emailVal || null,
              full_name: fullName || null,
              major: majorVal || null,
            });
            if (!studentCode || !emailVal || !fullName) {
              logger.debug("[createClass] Skip student import row with missing required fields", {
                row_index: j + 1,
              });
              continue;
            }

            const [existingRows] = await conn.execute(
              "SELECT id, user_id, status FROM students WHERE student_code = ? LIMIT 1",
              [studentCode]
            );
            let studentId;
            let linkedUserId = null;
            let statusVal;
            if (existingRows && existingRows.length > 0) {
              studentId = existingRows[0].id;
              linkedUserId = existingRows[0].user_id;
              const prevStatus = existingRows[0].status;
              if (linkedUserId) {
                statusVal =
                  importStatus && importStatus !== "pending"
                    ? importStatus
                    : ["active", "inactive", "graduated", "suspended"].includes(prevStatus)
                      ? prevStatus
                      : "active";
              } else {
                statusVal = "pending";
              }
              await conn.execute(
                "UPDATE students SET full_name = ?, email = ?, major = ?, status = ?, user_id = ?, updated_at = NOW(), deleted_at = NULL WHERE id = ?",
                [fullName, emailVal, majorVal || null, statusVal, linkedUserId, studentId]
              );
            } else {
              const [insResult] = await conn.execute(
                "INSERT INTO students (student_code, full_name, email, major, status, user_id) VALUES (?, ?, ?, ?, 'pending', NULL)",
                [studentCode, fullName, emailVal, majorVal || null]
              );
              studentId = insResult.insertId;
              linkedUserId = null;
              statusVal = "pending";
            }
            await conn.execute(
              "INSERT INTO class_students (class_id, student_id, status) VALUES (?, ?, 'enrolled') ON DUPLICATE KEY UPDATE status = 'enrolled'",
              [classId, studentId]
            );
            insertedCount++;
            if (!linkedUserId) pendingInvitees.push({ studentId, email: emailVal });
          }
          logger.debug("[createClass] Chunk done", {
            chunk_index: i + 1,
            inserted_count: insertedCount,
          });
        }
        let mailDispatchPublicId = null;
        if (pendingInvitees.length > 0) {
          const inviteIds = [];
          const expiryMs = Math.max(1, appConfig.invite.expiryDays) * 24 * 60 * 60 * 1000;
          const expiresAt = new Date(Date.now() + expiryMs);
          for (const p of pendingInvitees) {
            await inviteRepository.invalidateUnusedForPairConn(conn, p.studentId, classId);
            const token = crypto.randomBytes(32).toString("hex");
            const insId = await inviteRepository.insertQueuedInviteConn(conn, {
              email: p.email,
              student_id: p.studentId,
              class_id: classId,
              token,
              expires_at: expiresAt,
            });
            inviteIds.push(insId);
          }
          const chunkSize = appConfig.outbox.inviteChunkSize;
          const idChunks = chunkArray(inviteIds, chunkSize);
          let dispatchPid = null;
          for (const chunk of idChunks) {
            const { id: outboxRowId, dispatchPublicId } = await outboxRepository.insertWithConn(conn, {
              eventType: OUTBOX_CLASS_INVITE_EMAIL_DISPATCH,
              payload: { classId, classCode, inviteIds: chunk },
              dispatchPublicId: dispatchPid,
            });
            if (!dispatchPid) dispatchPid = dispatchPublicId;
            await inviteRepository.setOutboxIdForInvitesConn(conn, outboxRowId, chunk);
          }
          mailDispatchPublicId = dispatchPid;
        }
        return { classId, insertedCount, pendingInvitees, mailDispatchPublicId };
      });
      eventBus.emit(Events.CLASS_CREATED, {
        classId,
        classCode,
        studentCount: insertedCount,
      });
      eventBus.emit(Events.STUDENTS_UPLOADED, { classCode, semester: semCode, count: insertedCount });
      const cls = await classRepository.findWithDetails(classId);
      
      // Ghi log audit
      await auditService.log({
        userId: created_by || null,
        action: "create_class",
        tableName: "classes",
        recordId: classId,
        title: classCode,
        newValues: { class_code: classCode, student_count: insertedCount }
      });

      return {
        ...cls,
        student_count: insertedCount,
        ...(mailDispatchPublicId && { mail_dispatch_id: mailDispatchPublicId }),
      };
    } finally {
      if (redis) await releaseUploadLock(redis, lockKey);
    }
  };

  const update = async (id, data, user = null) => {
    const cls = await classRepository.findWithDetails(id);
    if (!cls) throw NotFound("Class");
    
    if (isLecturerOnly(user)) {
      if (Number(cls.lecturer_id) !== Number(user.id)) throw Forbidden("Lớp học không thuộc quyền quản lý của bạn");

      const createdAt = new Date(cls.created_at);
      const now = new Date();
      const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);
      const isNewlyCreated = diffDays <= appConfig.class.manipulationDays;
      if (cls.semester_status !== "upcoming" && !isNewlyCreated) {
        throw BadRequest(`Chỉ có thể sửa thông tin lớp học ở học kỳ sắp diễn ra hoặc lớp mới được tạo trong vòng ${appConfig.class.manipulationDays} ngày.`);
      }
    }

    const { subject: subjectCode, classSection, year, semester: semesterType, ...otherData } = data;
    const updateData = { ...otherData };

    // Chỉ recompute mã lớp khi có thay đổi 1 trong 4 field định danh
    const wantsRecompute = subjectCode != null || classSection != null || year != null || semesterType != null;
    if (wantsRecompute) {
      const targetSubjectCode = subjectCode ?? cls.subject_code;
      const targetClassSection =
        classSection ?? parseInt(String(cls.class_code || "").split("-")[1], 10) ?? 1;
      const targetYear = year ?? cls.year;

      // Derive semester type: ưu tiên FE truyền lên, nếu không có thì lấy prefix của semester_code hiện tại.
      // Lưu ý: cls.semester_id là ID DB, KHÔNG phải type 1/2/3 → bug cũ ở đây.
      const currentPrefix = String(cls.semester_code || "").slice(0, 2).toUpperCase();
      const targetSemesterType = semesterType ?? SEMESTER_TYPE_FROM_PREFIX[currentPrefix] ?? 1;
      if (!SEMESTER_CODES[targetSemesterType]) {
        throw BadRequest(`Học kỳ không hợp lệ: ${targetSemesterType}.`);
      }

      const subject = await subjectRepository.findByCode(targetSubjectCode);
      if (!subject) throw BadRequest(`Subject not found: ${targetSubjectCode}`);
      if (subject.status === "inactive") {
        throw BadRequest(
          `Học phần "${subject.subject_name}" (${targetSubjectCode}) đang ở trạng thái không hoạt động (Inactive). Không thể cập nhật lớp học.`
        );
      }

      const semCode = `${SEMESTER_CODES[targetSemesterType]}${targetYear}`;
      const semester = await ensureSemester(semCode, targetSemesterType, targetYear);

      updateData.subject_id = subject.id;
      updateData.semester_id = semester.id;
      updateData.class_code = `${targetSubjectCode}-${String(targetClassSection).padStart(2, "0")}-${semCode}`;

      // Chặn trùng mã lớp với lớp khác đang active trong cùng học kỳ
      if (updateData.class_code !== cls.class_code || semester.id !== cls.semester_id) {
        const conflict = await classRepository.findByCode(updateData.class_code, semester.id);
        if (conflict && Number(conflict.id) !== Number(id)) {
          throw BadRequest(`Lớp học "${updateData.class_code}" đã tồn tại trong học kỳ này.`);
        }
      }
    }

    // Luôn cập nhật thời gian thay đổi
    updateData.updated_at = new Date();

    const updated = await base.update(id, updateData);

    // Ghi log audit
    await auditService.log({
      userId: user?.id || null,
      action: "update_class",
      tableName: "classes",
      recordId: id,
      title: updateData.class_code || cls.class_code,
      oldValues: { class_code: cls.class_code },
      newValues: { class_code: updateData.class_code || cls.class_code }
    });

    return updated;
  };

  const remove = async (id, user = null) => {
    const cls = await classRepository.findWithDetails(id);
    if (!cls) throw NotFound("Class");
    
    if (isLecturerOnly(user)) {
      if (Number(cls.lecturer_id) !== Number(user.id)) throw Forbidden("Lớp học không thuộc quyền quản lý của bạn");
      
      const createdAt = new Date(cls.created_at);
      const now = new Date();
      const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);
      const isNewlyCreated = diffDays <= appConfig.class.manipulationDays;

      // Cho phép xóa nếu học kỳ sắp diễn ra (upcoming) HOẶC lớp mới tạo trong manipulationDays ngày
      if (cls.semester_status !== "upcoming" && !isNewlyCreated) {
        throw BadRequest(`Chỉ có thể xóa lớp học ở học kỳ sắp diễn ra hoặc lớp mới được tạo trong vòng ${appConfig.class.manipulationDays} ngày.`);
      }
    }

    // Chặn xóa nếu đã có bất kỳ bài nộp checkpoint nào thuộc các nhóm của lớp này
    const submittedCount = await checkpointRepository.countSubmittedByClass(id);
    if (submittedCount > 0) {
      throw BadRequest(
        `Không thể xóa lớp "${cls.class_code}" vì đã có ${submittedCount} bài nộp checkpoint. Vui lòng xử lý các bài nộp trước khi xóa lớp.`
      );
    }

    const result = await base.remove(id, true);

    // Ghi log audit
    await auditService.log({
      userId: user?.id || null,
      action: "delete_class",
      tableName: "classes",
      recordId: id,
      title: cls.class_code,
      oldValues: { class_code: cls.class_code }
    });

    return result;
  };

  return {
    getById,
    getOverview,
    getStats,
    getStudentStats,
    getList,
    create,
    update,
    remove,
  };
};
