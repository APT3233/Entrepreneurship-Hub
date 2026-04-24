import {
  NotFound,
  AlreadyExists,
  BadRequest,
  Forbidden,
} from "app/core/errors/errorFactory.js";
import { appConfig } from "app/config/app.js";

export const createEnrollmentService = ({
  enrollmentRepository,
  classRepository,
  studentRepository,
}) => {
  const isLecturerOnly = (user) =>
    user?.roles?.length && !user.roles.some((r) => ["admin", "department_head"].includes(String(r).toLowerCase()));

  /**
   * List students enrolled in a class. When user is lecturer-only, verify class belongs to them.
   */
  const getByClass = async (classId, user = null) => {
    const cls = await classRepository.findById(classId);
    if (!cls) throw NotFound("Class");
    if (isLecturerOnly(user) && Number(cls.lecturer_id) !== Number(user.id)) throw Forbidden("Class does not belong to you");
    return enrollmentRepository.findByClass(classId);
  };

  const checkAccessAndTimeline = async (classId, user) => {
    const cls = await classRepository.findWithDetails(classId);
    if (!cls) throw NotFound("Class");

    if (isLecturerOnly(user)) {
      if (Number(cls.lecturer_id) !== Number(user.id)) throw Forbidden("Lớp học không thuộc quyền quản lý của bạn");

      const createdAt = new Date(cls.created_at);
      const now = new Date();
      const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);
      const isNewlyCreated = diffDays <= appConfig.class.manipulationDays;

      if (cls.semester_status !== "upcoming" && !isNewlyCreated) {
        throw BadRequest(`Chỉ có thể thay đổi danh sách sinh viên ở học kỳ sắp diễn ra hoặc lớp mới được tạo trong vòng ${appConfig.class.manipulationDays} ngày.`);
      }
    }
    return cls;
  };

  /**
   * Kiểm tra xung đột MSSV/Email khi enroll hoặc update sinh viên trong 1 lớp.
   *
   * Quy tắc (đồng bộ với luồng tạo lớp):
   * - Nếu MSSV/Email đã thuộc SV khác đang ở cùng lớp hiện tại → block.
   * - Nếu SV (theo MSSV/Email) đã thuộc bất kỳ lớp nào khác trong cùng học kỳ (bất kể môn) → block,
   *   yêu cầu xóa khỏi lớp cũ trước. Áp dụng cả cho SV hiện tại (studentId đã biết) để chặn "thêm
   *   trực tiếp" SV đang enroll ở lớp khác cùng kỳ.
   * - Nếu MSSV/Email không gắn với SV nào đang enroll cùng kỳ → cho phép (chuyển lớp).
   */
  const validateStudentUniqueness = async (classId, studentId, studentCode, email) => {
    const cls = await classRepository.findById(classId);
    if (!cls) return;

    // 1) Trước tiên: nếu biết studentId (thêm SV đã tồn tại hoặc sửa info), chặn nếu SV đó đang ở lớp khác cùng kỳ
    if (studentId) {
      const conflictSelf = await enrollmentRepository.findConflictInSemester(
        studentId, cls.semester_id, classId
      );
      if (conflictSelf) {
        throw BadRequest(
          `Sinh viên đang thuộc lớp ${conflictSelf.class_code} trong học kỳ này. Một sinh viên không thể học 2 lớp trong cùng 1 kỳ.`
        );
      }
    }

    const checks = [
      { value: studentCode, label: "Mã sinh viên (MSSV)", findFn: studentRepository.findActiveByStudentCode },
      { value: email, label: "Email", findFn: studentRepository.findAnyByEmail },
    ];

    for (const check of checks) {
      if (!check.value) continue;

      const existing = await check.findFn(check.value);
      if (!existing || String(existing.id) === String(studentId)) continue;

      // SV khác cùng MSSV/Email tồn tại → kiểm tra trong cùng lớp
      const sameClass = await enrollmentRepository.findByClassAndStudent(classId, existing.id);
      if (sameClass) {
        throw BadRequest(
          `${check.label} "${check.value}" đã thuộc sinh viên khác trong lớp này (${existing.full_name}).`
        );
      }

      // Kiểm tra SV khác đang enroll ở bất kỳ lớp nào trong cùng kỳ (toàn cục, bất kể môn)
      const conflict = await enrollmentRepository.findConflictInSemester(
        existing.id, cls.semester_id, classId
      );
      if (conflict) {
        throw BadRequest(
          `${check.label} "${check.value}" đang thuộc lớp ${conflict.class_code} trong học kỳ này. Cần xóa sinh viên khỏi lớp đó trước khi thêm vào lớp này.`
        );
      }
    }

    // Free up student_code from soft-deleted records to avoid DB unique constraint
    if (studentCode) {
      const deleted = await studentRepository.findAnyByStudentCode(studentCode);
      if (deleted && deleted.deleted_at && String(deleted.id) !== String(studentId)) {
        await studentRepository.update(deleted.id, { student_code: `${studentCode}_del_${deleted.id}` });
      }
    }
  };

  /**
   * Enroll a student into a class. Supports manual entry.
   */
  const enroll = async (classId, payload, user = null) => {
    const cls = await checkAccessAndTimeline(classId, user);

    let studentId = payload.student_id;

    // Handle manual entry
    if (!studentId && payload.student_code) {
      const existing = await studentRepository.findActiveByStudentCode(payload.student_code);
      if (existing) {
        studentId = existing.id;

        await validateStudentUniqueness(classId, studentId, payload.student_code, payload.email);

        // Update info if provided
        if (payload.full_name || payload.email || payload.major) {
          await studentRepository.update(studentId, {
            full_name: payload.full_name || existing.full_name,
            email: payload.email || existing.email,
            major: payload.major || existing.major,
          });
        }
      } else {
        if (!payload.full_name || !payload.email) {
          throw BadRequest("Họ tên và Email là bắt buộc khi thêm sinh viên mới.");
        }
        await validateStudentUniqueness(classId, null, payload.student_code, payload.email);

        const created = await studentRepository.create({
          student_code: payload.student_code,
          full_name: payload.full_name,
          email: payload.email,
          major: payload.major || null,
          status: "pending",
        });
        studentId = created.id;
      }
    } else if (studentId) {
      const student = await studentRepository.findById(studentId);
      if (student) {
        await validateStudentUniqueness(classId, studentId, student.student_code, student.email);
      }
    }

    if (!studentId) throw BadRequest("Thiếu thông tin sinh viên.");

    // Check duplicate in current class
    const existingEnroll = await enrollmentRepository.findByClassAndStudent(classId, studentId);
    if (existingEnroll) throw AlreadyExists("Sinh viên này đã có trong lớp học.");

    // Check max students
    const count = await enrollmentRepository.countByClass(classId);
    if (count >= cls.max_students) {
      throw BadRequest("Lớp học đã đầy.");
    }

    await enrollmentRepository.create({
      class_id: classId,
      student_id: studentId,
      status: "enrolled",
    });

    await classRepository.update(classId, { updated_at: new Date() });
    return { id: studentId };
  };

  /**
   * Remove a student from a class.
   */
  const unenroll = async (classId, studentId, user = null) => {
    await checkAccessAndTimeline(classId, user);

    const enrollment = await enrollmentRepository.findByClassAndStudent(classId, studentId);
    if (!enrollment) throw NotFound("Sinh viên không tồn tại trong lớp này.");
    
    await enrollmentRepository.hardDelete(enrollment.id);

    // Cập nhật thời gian thay đổi của lớp học
    await classRepository.update(classId, { updated_at: new Date() });

    return { success: true };
  };

  /**
   * Update student info in the context of a class (enforces 7-day rule).
   */
  const updateStudentInfo = async (classId, studentId, data, user = null) => {
    await checkAccessAndTimeline(classId, user);

    const student = await studentRepository.findById(studentId);
    if (!student) throw NotFound("Student");

    const newCode = data.student_code || student.student_code;
    const newEmail = data.email || student.email;
    const codeChanged = newCode !== student.student_code;
    const emailChanged = newEmail !== student.email;

    if (codeChanged || emailChanged) {
      await validateStudentUniqueness(classId, studentId, newCode, newEmail);
    }

    await studentRepository.update(studentId, {
      student_code: newCode,
      full_name: data.full_name || student.full_name,
      email: newEmail,
      major: data.major !== undefined ? data.major : student.major,
    });

    await classRepository.update(classId, { updated_at: new Date() });
    return { id: studentId };
  };

  return { getByClass, enroll, unenroll, updateStudentInfo };
};
