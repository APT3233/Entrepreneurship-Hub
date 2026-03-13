import {
  NotFound,
  AlreadyExists,
  BadRequest,
  Forbidden,
} from "app/core/errors/errorFactory.js";

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

  /**
   * Enroll a student into a class. When user is lecturer-only, verify class belongs to them.
   */
  const enroll = async (classId, studentId, user = null) => {
    const cls = await classRepository.findById(classId);
    if (!cls) throw NotFound("Class");
    if (isLecturerOnly(user) && Number(cls.lecturer_id) !== Number(user.id)) throw Forbidden("Class does not belong to you");

    const student = await studentRepository.findById(studentId);
    if (!student) throw NotFound("Student");

    // Check duplicate
    const existing = await enrollmentRepository.findByClassAndStudent(
      classId,
      studentId,
    );
    if (existing) throw AlreadyExists("Enrollment");

    // Check max students
    const count = await enrollmentRepository.countByClass(classId);
    if (count >= cls.max_students) {
      throw BadRequest("Class is full — max students reached");
    }

    return enrollmentRepository.create({
      class_id: classId,
      student_id: studentId,
      status: "enrolled",
    });
  };

  /**
   * Remove a student from a class. When user is lecturer-only, verify class belongs to them.
   */
  const unenroll = async (classId, studentId, user = null) => {
    const cls = await classRepository.findById(classId);
    if (!cls) throw NotFound("Class");
    if (isLecturerOnly(user) && Number(cls.lecturer_id) !== Number(user.id)) throw Forbidden("Class does not belong to you");
    const enrollment = await enrollmentRepository.findByClassAndStudent(classId, studentId);
    if (!enrollment) throw NotFound("Enrollment");
    return enrollmentRepository.hardDelete(enrollment.id);
  };

  return { getByClass, enroll, unenroll };
};
