import { createBaseRepository } from "app/core/database/baseRepository.js";

export const createClassRepository = ({ db }) => {
  const base = createBaseRepository(db, "classes");

  const findByCode = async (code, semesterId) => {
    return base.findOne({ class_code: code, semester_id: semesterId });
  };

  const findBySubjectAndSemester = async (subjectId, semesterId) => {
    const sql = `
      SELECT c.*, sub.subject_code, sub.subject_name, sem.semester_code, sem.semester_name,
             u.full_name AS lecturer_name
      FROM \`classes\` c
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN users u ON u.id = c.lecturer_id
      WHERE c.subject_id = :subjectId
        AND c.semester_id = :semesterId
        AND c.deleted_at IS NULL
    `;
    const [rows] = await db.execute(sql, { subjectId, semesterId });
    return rows;
  };

  const findWithDetails = async (id) => {
    const sql = `
      SELECT c.*, sub.subject_code, sub.subject_name,
             sem.semester_code, sem.semester_name, sem.status AS semester_status, sem.year,
             u.full_name AS lecturer_name
      FROM \`classes\` c
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN users u ON u.id = c.lecturer_id
      WHERE c.id = :id AND c.deleted_at IS NULL
    `;
    const [rows] = await db.execute(sql, { id });
    return rows[0] || null;
  };

  /** Số lớp của lecturer, có thể lọc theo semester_id */
  const countByLecturer = async (lecturerId, semesterId = null, semesterIds = null) => {
    if (Array.isArray(semesterIds) && semesterIds.length > 0) {
      const params = { lecturerId };
      const placeholders = semesterIds.map((_, idx) => `:sem${idx}`).join(", ");
      semesterIds.forEach((id, idx) => { params[`sem${idx}`] = id; });
      const sql = `
        SELECT COUNT(*) AS total
        FROM \`classes\` c
        WHERE c.deleted_at IS NULL
          AND c.lecturer_id = :lecturerId
          AND c.semester_id IN (${placeholders})
      `;
      const [rows] = await db.execute(sql, params);
      return Number(rows[0]?.total || 0);
    }
    const conditions = { lecturer_id: lecturerId };
    if (semesterId != null) conditions.semester_id = semesterId;
    return base.count(conditions);
  };

  /** Danh sách lớp của lecturer kèm student_count, group_count (cho dashboard) */
  const findManyWithCountsByLecturer = async (lecturerId, { semesterId, semesterIds, limit = 10, offset = 0 } = {}) => {
    const params = { lecturerId };
    let whereClause = "c.deleted_at IS NULL AND c.lecturer_id = :lecturerId";
    if (Array.isArray(semesterIds) && semesterIds.length > 0) {
      const placeholders = semesterIds.map((_, idx) => `:sem${idx}`).join(", ");
      whereClause += ` AND c.semester_id IN (${placeholders})`;
      semesterIds.forEach((id, idx) => { params[`sem${idx}`] = id; });
    } else if (semesterId != null) {
      whereClause += " AND c.semester_id = :semesterId";
      params.semesterId = semesterId;
    }
    const limitNum = Number(limit) || 10;
    const offsetNum = Number(offset) || 0;
    const sql = `
      SELECT c.id, c.class_code, c.class_name,
             (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id) AS student_count,
             (SELECT COUNT(*) FROM \`groups\` g WHERE g.class_id = c.id AND g.deleted_at IS NULL) AS group_count
      FROM \`classes\` c
      WHERE ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;
    const [rows] = await db.execute(sql, params);
    return rows;
  };

  return {
    ...base,
    findByCode,
    findBySubjectAndSemester,
    findWithDetails,
    countByLecturer,
    findManyWithCountsByLecturer,
  };
};
