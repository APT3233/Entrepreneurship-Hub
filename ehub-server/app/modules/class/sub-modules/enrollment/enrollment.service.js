import {
  NotFound,
  AlreadyExists,
  BadRequest,
} from "app/core/errors/errorFactory.js";

export const createEnrollmentService = ({
  enrollmentRepository,
  classRepository,
  studentRepository,
}) => {
  /**
   * List students enrolled in a class
   */
  const getByClass = async (classId) => {
    const cls = await classRepository.findById(classId);
    if (!cls) throw NotFound("Class");
    return enrollmentRepository.findByClass(classId);
  };

  /**
   * Enroll a student into a class
   */
  const enroll = async (classId, studentId) => {
    const cls = await classRepository.findById(classId);
    if (!cls) throw NotFound("Class");

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
   * Remove a student from a class (hard delete enrollment record)
   */
  const unenroll = async (classId, studentId) => {
    const enrollment = await enrollmentRepository.findByClassAndStudent(
      classId,
      studentId,
    );
    if (!enrollment) throw NotFound("Enrollment");

    return enrollmentRepository.hardDelete(enrollment.id);
  };

  return { getByClass, enroll, unenroll };
};
