import { createBaseRepository } from "app/core/database/baseRepository.js";

export const createSemesterRepository = ({ db }) => {
  const base = createBaseRepository(db, "semesters");

  const findByCode = async (code) => {
    return base.findOne({ semester_code: code });
  };

  const findManyByYear = async (year) => {
    const sql = `SELECT * FROM \`semesters\` WHERE year = :year AND deleted_at IS NULL ORDER BY start_date ASC`;
    const [rows] = await db.execute(sql, { year });
    return rows;
  };

  const findCurrentSemester = async () => {
    const sql = `SELECT * FROM \`semesters\` WHERE status = 'ongoing' AND deleted_at IS NULL LIMIT 1`;
    const [rows] = await db.execute(sql);
    return rows[0] || null;
  };

  return {
    ...base,
    findByCode,
    findManyByYear,
    findCurrentSemester,
  };
};
