import { createBaseRepository } from "app/core/database/baseRepository.js";

export const createEnrollmentRepository = ({ db }) => {
  const base = createBaseRepository(db, "class_students");

  const findByClassAndStudent = async (classId, studentId) => {
    return base.findOne({ class_id: classId, student_id: studentId });
  };

  const findByClass = async (classId) => {
    const sql = `
      SELECT cs.*, s.student_code, s.full_name, s.email, s.phone, s.major, s.user_id,
             u.avatar_url AS avatar_url
      FROM class_students cs
        JOIN students s ON s.id = cs.student_id
        LEFT JOIN users u ON u.id = s.user_id AND u.deleted_at IS NULL
      WHERE cs.class_id = :classId
      ORDER BY s.student_code ASC
    `;
    const [rows] = await db.execute(sql, { classId });
    return rows;
  };

  const countByClass = async (classId) => {
    return base.count({ class_id: classId });
  };

  /**
   * Kiểm tra sinh viên đã thuộc 1 lớp khác trong cùng học kỳ (toàn cục, bất kể môn).
   * Dùng để thực thi ràng buộc: 1 SV chỉ được ở 1 lớp trong 1 kỳ.
   */
  const findConflictInSemester = async (studentId, semesterId, currentClassId) => {
    const sql = `
      SELECT c.class_code
      FROM class_students cs
      JOIN classes c ON c.id = cs.class_id AND c.deleted_at IS NULL
      WHERE cs.student_id = :studentId
        AND c.semester_id = :semesterId
        AND c.id != :currentClassId
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { studentId, semesterId, currentClassId });
    return rows[0] || null;
  };

  return {
    ...base,
    findByClassAndStudent,
    findByClass,
    countByClass,
    findConflictInSemester,
  };
};
