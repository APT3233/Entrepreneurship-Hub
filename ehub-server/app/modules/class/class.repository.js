import { createBaseRepository } from "app/core/database/baseRepository.js";

export const createClassRepository = ({ db }) => {
  const base = createBaseRepository(db, "classes");

  const findByCode = async (code, semesterId) => {
    return base.findOne({ class_code: code, semester_id: semesterId });
  };

  const findBySubjectAndSemester = async (subjectId, semesterId) => {
    const sql = `
      SELECT c.*, sub.subject_code, sub.subject_name, sem.semester_code, sem.semester_name,
             u.full_name AS teacher_name
      FROM \`classes\` c
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN users u ON u.id = c.teacher_id
      WHERE c.subject_id = :subjectId
        AND c.semester_id = :semesterId
        AND c.deleted_at IS NULL
    `;
    const [rows] = await db.execute(sql, { subjectId, semesterId });
    return rows;
  };

  const findWithDetails = async (id) => {
    const sql = `
      SELECT c.*, sub.subject_code, sub.subject_name, sem.semester_code, sem.semester_name,
             u.full_name AS teacher_name
      FROM \`classes\` c
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN users u ON u.id = c.teacher_id
      WHERE c.id = :id AND c.deleted_at IS NULL
    `;
    const [rows] = await db.execute(sql, { id });
    return rows[0] || null;
  };

  return {
    ...base,
    findByCode,
    findBySubjectAndSemester,
    findWithDetails,
  };
};
