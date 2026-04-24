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

  /** Tìm SV theo MSSV bất kể trạng thái (cả đã xóa) */
  const findAnyByStudentCode = async (code) => {
    const sql = `
      SELECT * FROM students
      WHERE LOWER(TRIM(student_code)) = LOWER(TRIM(:code))
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { code });
    return rows[0] || null;
  };

  /** Tìm SV theo Email bất kể trạng thái */
  const findAnyByEmail = async (email) => {
    const sql = `
      SELECT * FROM students
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(:email))
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { email });
    return rows[0] || null;
  };

  const restore = async (id) => {
    return base.update(id, { deleted_at: null, updated_at: new Date() });
  };

  const countTotalActive = async () => {
    const sql = "SELECT COUNT(*) AS total FROM students WHERE deleted_at IS NULL";
    const [rows] = await db.execute(sql);
    return Number(rows[0]?.total || 0);
  };

  return {
    ...base,
    findByCode,
    findActiveByStudentCode,
    findAnyByStudentCode,
    findAnyByEmail,
    findByEmail,
    findByUserId,
    search,
    restore,
    countTotalActive,
  };
};
