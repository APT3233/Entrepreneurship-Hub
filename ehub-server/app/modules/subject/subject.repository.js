import { createBaseRepository } from "app/core/database/baseRepository.js";

export const createSubjectRepository = ({ db }) => {
  const base = createBaseRepository(db, "subjects");

  const findByCode = async (code) => {
    return base.findOne({ subject_code: code });
  };

  const findActive = async (pagination, sort) => {
    const sql = `SELECT * FROM \`subjects\` WHERE deleted_at IS NULL ORDER BY created_at DESC`;
    const [rows] = await db.execute(sql);
    return rows;
  };

  return {
    ...base,
    findByCode,
    findActive,
  };
};
