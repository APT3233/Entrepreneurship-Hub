import { createBaseRepository } from "app/core/database/baseRepository.js";

export const createStudentRepository = ({ db }) => {
  const base = createBaseRepository(db, "students");

  const findByCode = async (code) => {
    return base.findOne({ student_code: code });
  };

  /** Sinh viên còn hiệu lực (deleted_at NULL), so khớp MSSV không phân biệt hoa thường. */
  const findActiveByStudentCode = async (code) => {
    const sql = `
      SELECT * FROM students
      WHERE deleted_at IS NULL
        AND LOWER(TRIM(student_code)) = LOWER(TRIM(:code))
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { code });
    return rows[0] || null;
  };

  const findByEmail = async (email) => {
    return base.findOne({ email });
  };

  const findByUserId = async (userId) => {
    return base.findOne({ user_id: userId });
  };

  const search = async (keyword) => {
    const sql = `
      SELECT * FROM students
      WHERE deleted_at IS NULL
        AND (student_code LIKE :kw OR full_name LIKE :kw OR email LIKE :kw)
      ORDER BY student_code ASC
      LIMIT 50
    `;
    const [rows] = await db.execute(sql, { kw: `%${keyword}%` });
    return rows;
  };

  return {
    ...base,
    findByCode,
    findActiveByStudentCode,
    findByEmail,
    findByUserId,
    search,
  };
};
