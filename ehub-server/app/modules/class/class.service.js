import crypto from "node:crypto";
import { createBaseService } from "app/core/services/baseService.js";
import { NotFound, Forbidden, BadRequest } from "app/core/errors/errorFactory.js";
import { parsePagination } from "app/core/utils/pagination.js";
import { chunkArray } from "app/core/utils/chunk.js";
import { acquireUploadLock, releaseUploadLock } from "app/core/utils/uploadLock.js";
import { Events } from "app/core/constants/events.js";
import { OUTBOX_CLASS_INVITE_EMAIL_DISPATCH } from "app/core/constants/outboxEventTypes.js";
import { appConfig } from "app/config/app.js";

const SEMESTER_CODES = { 1: "SP", 2: "SU", 3: "FA" };
const SEMESTER_NAMES = { 1: "Spring", 2: "Summer", 3: "Fall" };
const SEMESTER_START_MONTHS = { 1: 0, 2: 4, 3: 8 }; // Jan, May, Sept

export const createClassService = ({
  classRepository,
  semesterRepository,
  subjectRepository,
  studentRepository,
  groupRepository,
  enrollmentRepository,
  groupMemberRepository,
  transaction,
  eventBus,
  redis,
  inviteRepository,
  outboxRepository,
}) => {
  const base = createBaseService(classRepository, "Class");

  const isLecturerOnly = (user) =>
    user?.roles?.length && !user.roles.some((r) => ["admin", "department_head"].includes(String(r).toLowerCase()));

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
    if (isLecturerOnly(user) && Number(cls.lecturer_id) !== Number(user.id)) throw Forbidden("Class does not belong to you");
    return cls;
  };

  /**
   * Tổng hợp chi tiết lớp học: thông tin lớp + thống kê + groups + students
   * Dùng cho trang ClassDetailPage.
   */
  const getOverview = async (id, user = null) => {
    const cls = await classRepository.findWithDetails(id);
    if (!cls) throw NotFound("Class");
    if (isLecturerOnly(user) && Number(cls.lecturer_id) !== Number(user.id)) throw Forbidden("Class does not belong to you");

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
    };
  };

  /** Thống kê dashboard lecturer: số lớp, số nhóm (lọc theo year/semester) */
  const getStats = async (query, lecturerId) => {
    const { semesterId, semesterIds } = await resolveSemesters(query);
    const useIds = Array.isArray(semesterIds) && semesterIds.length > 0 ? semesterIds : null;
    const [classCount, groupCount] = await Promise.all([
      classRepository.countByLecturer(lecturerId, semesterId, useIds),
      groupRepository.countByLecturer({ lecturerId, semesterId: semesterId ?? undefined, semesterIds: useIds || undefined }),
    ]);
    return {
      classCount,
      groupCount,
      assignmentCount: 0,
      needGradingCount: 0,
    };
  };

  const getList = async (query, lecturerId = null) => {
    const { semesterId, semesterIds } = await resolveSemesters(query);
    const filters = {
      ...(query.status && { status: query.status }),
      ...(query.subject_id && { subject_id: query.subject_id }),
      ...(semesterId != null && { semester_id: semesterId }),
      ...(query.lecturerScope === "mine" && lecturerId && { lecturer_id: lecturerId }),
    };

    if (query.lecturerScope === "mine" && lecturerId) {
      const pagination = parsePagination(query);
      const [data, total] = await Promise.all([
        classRepository.findManyWithCountsByLecturer(lecturerId, {
          semesterId: semesterId ?? undefined,
          semesterIds: semesterIds && semesterIds.length ? semesterIds : undefined,
          limit: pagination.limit,
          offset: pagination.offset,
        }),
        classRepository.countByLecturer(
          lecturerId,
          semesterId ?? undefined,
          semesterIds && semesterIds.length ? semesterIds : null
        ),
      ]);
      return { data, ...pagination, total };
    }

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
    console.log(`[createClass] Request received, useNewFormat=${useNewFormat}, students.list.length=${data?.students?.list?.length ?? data?.students?.length ?? 0}`);
    if (useNewFormat) return createWithStudents({ ...data, subject: subjectCode, classSection, semester: semesterType });
    return base.create(data);
  };

  const createWithStudents = async (data) => {
    const { subject: subjectCode, classSection, year, semester: semesterType, students, created_by } = data;
    const subject = await subjectRepository.findByCode(subjectCode);
    if (!subject) throw BadRequest(`Subject not found: ${subjectCode}`);
    const semCode = `${SEMESTER_CODES[semesterType] || "SP"}${year}`;
    let semester = await semesterRepository.findByCode(semCode);
    
    // Nếu học kỳ chưa tồn tại, kiểm tra xem có cho phép tạo trước không
    if (!semester) {
      const startMonth = SEMESTER_START_MONTHS[semesterType] ?? 0;
      const startDate = new Date(year, startMonth, 1);
      const now = new Date();
      
      // Tính khoảng cách thời gian (đơn vị tháng)
      const diffMonths = (startDate.getFullYear() - now.getFullYear()) * 12 + (startDate.getMonth() - now.getMonth());
      
      if (diffMonths <= 3 && diffMonths >= -12) { // Cho phép tạo trước 3 tháng và cũ không quá 1 năm (để an toàn)
        console.log(`[createClass] Tự động tạo học kỳ mới: ${semCode}`);
        const endDate = new Date(year, startMonth + 3, 30); // Giả định mỗi kỳ 4 tháng
        semester = await semesterRepository.create({
          semester_code: semCode,
          semester_name: `${SEMESTER_NAMES[semesterType]} ${year}`,
          year: year,
          start_date: startDate,
          end_date: endDate,
          status: "upcoming",
        });
      } else {
        throw BadRequest(`Học kỳ ${semCode} chưa được mở (chỉ cho phép tạo trước tối đa 3 tháng).`);
      }
    }
    
    const classCode = `${subjectCode}-${String(classSection).padStart(2, "0")}-${semCode}`;

    // Kiểm tra lớp đã tồn tại chưa
    const existingClass = await classRepository.findByCode(classCode, semester.id);
    if (existingClass) {
      throw BadRequest(`Lớp học "${classCode}" đã tồn tại trong học kỳ này.`);
    }

    const lockKey = `lock:upload:${classCode}`;
    const locked = redis ? await acquireUploadLock(redis, lockKey) : true;
    if (!locked) throw BadRequest("Upload in progress, please try again later");
    try {
      const { classId, insertedCount, pendingInvitees, mailDispatchPublicId } = await transaction.run(async (conn) => {
        // Kiểm tra trước: sinh viên đã ở lớp khác cùng môn cùng kỳ?
        const studentList = Array.isArray(students?.list) ? students.list : Array.isArray(students) ? students : [];
        const pendingInvitees = [];
        const preCheckConflicts = [];
        for (const s of studentList) {
          const studentCode = String(s.memberCode || s.rollNumber || "").trim();
          if (!studentCode || !s.email || !(s.fullname || s.full_name)) continue;
          const [existingRows] = await conn.execute("SELECT id FROM students WHERE student_code = ? LIMIT 1", [studentCode]);
          if (!existingRows?.length) continue;
          const studentId = existingRows[0].id;
          const [enrolled] = await conn.execute(
            `SELECT c.class_code FROM class_students cs
             JOIN classes c ON c.id = cs.class_id AND c.deleted_at IS NULL
             WHERE cs.student_id = ? AND c.semester_id = ? AND c.subject_id = ? LIMIT 1`,
            [studentId, semester.id, subject.id]
          );
          if (enrolled?.length > 0) {
            preCheckConflicts.push({ studentCode, existingClass: enrolled[0].class_code });
          }
        }
        if (preCheckConflicts.length > 0) {
          const list = preCheckConflicts.map((c) => `${c.studentCode} (đã ở ${c.existingClass})`).join(", ");
          throw BadRequest(
            `Một sinh viên không thể học 2 lớp cùng môn trong cùng kỳ. Các sinh viên trùng: ${list}`
          );
        }

        const [classRow] = await conn.execute(
          `INSERT INTO \`classes\` (subject_id, semester_id, class_code, class_name, lecturer_id, max_students, min_group_members, max_group_members, status, created_by)
           VALUES (:subject_id, :semester_id, :class_code, :class_name, :lecturer_id, :max_students, :min_group_members, :max_group_members, :status, :created_by)`,
          {
            subject_id: subject.id,
            semester_id: semester.id,
            class_code: classCode,
            class_name: data.class_name || null,
            lecturer_id: data.lecturer_id || created_by || null,
            max_students: data.max_students ?? 40,
            min_group_members: data.min_group_members ?? 4,
            max_group_members: data.max_group_members ?? 6,
            status: data.status || "draft",
            created_by: created_by || null,
          }
        );
        const classId = classRow.insertId;
        const chunks = chunkArray(studentList, 10);
        let insertedCount = 0;
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          console.log(`[createClass] Insert chunk ${i + 1}/${chunks.length}, size=${chunk.length}`);
          for (let j = 0; j < chunk.length; j++) {
            const s = chunk[j];
            const studentCode = String(s.memberCode || s.rollNumber || "").trim();
            const fullName = String(s.fullname || s.full_name || "").trim();
            const emailVal = String(s.email || "").trim();
            const majorVal = String(s.major || "").trim();
            const importStatus = ["active", "inactive", "graduated", "suspended", "pending"].includes(s?.status) ? s.status : null;
            console.log(`[createClass] Chunk ${i + 1} student ${j + 1}/${chunk.length}: code=${studentCode || "(empty)"} email=${emailVal || "(empty)"} fullname=${fullName || "(empty)"} major=${majorVal || "(empty)"}`);
            if (!studentCode || !emailVal || !fullName) {
              console.log(`[createClass] SKIP student ${j + 1}: missing code/email/fullname`);
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
          console.log(`[createClass] Chunk ${i + 1} done, inserted so far: ${insertedCount}`);
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
    if (isLecturerOnly(user) && Number(cls.lecturer_id) !== Number(user.id)) throw Forbidden("Class does not belong to you");
    return base.update(id, data);
  };

  const remove = async (id, user = null) => {
    const cls = await classRepository.findWithDetails(id);
    if (!cls) throw NotFound("Class");
    if (isLecturerOnly(user) && Number(cls.lecturer_id) !== Number(user.id)) throw Forbidden("Class does not belong to you");
    return base.remove(id, true);
  };

  return {
    getById,
    getOverview,
    getStats,
    getList,
    create,
    update,
    remove,
  };
};
