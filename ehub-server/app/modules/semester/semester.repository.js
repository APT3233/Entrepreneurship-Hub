import { createBaseRepository } from "app/core/database/baseRepository.js";

export const createSemesterRepository = ({ db }) => {
  const base = createBaseRepository(db, "semesters");

  const findByCode = async (code) => {
    return base.findOne({ semester_code: code });
  };

  const findCurrentSemester = async () => {
    const sql = `SELECT * FROM \`semesters\` WHERE status = 'ongoing' AND deleted_at IS NULL LIMIT 1`;
    const [rows] = await db.execute(sql);
    return rows[0] || null;
  };

  return {
    ...base,
    findByCode,
    findCurrentSemester,
  };
};
