import { createBaseRepository } from "app/core/database/baseRepository.js";

export const createStudentRepository = ({ db }) => {
  const base = createBaseRepository(db, "students");

  const findByCode = async (code) => {
    return base.findOne({ student_code: code });
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
    findByEmail,
    findByUserId,
    search,
  };
};
