import { createBaseRepository } from "app/core/database/baseRepository.js";

export const createGroupRepository = ({ db }) => {
  const base = createBaseRepository(db, "groups");

  const findByCode = async (code, classId) => {
    return base.findOne({ group_code: code, class_id: classId });
  };

  const findByClass = async (classId) => {
    const sql = `
      SELECT g.*,
             COUNT(gm.id) AS member_count
      FROM \`groups\` g
        LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.status = 'active'
      WHERE g.class_id = :classId AND g.deleted_at IS NULL
      GROUP BY g.id
      ORDER BY g.group_code ASC
    `;
    const [rows] = await db.execute(sql, { classId });
    return rows;
  };

  const findWithMembers = async (id) => {
    const sql = `
      SELECT g.*,
             c.class_code, sub.subject_code
      FROM \`groups\` g
        JOIN classes c ON c.id = g.class_id
        JOIN subjects sub ON sub.id = c.subject_id
      WHERE g.id = :id AND g.deleted_at IS NULL
    `;
    const [rows] = await db.execute(sql, { id });
    return rows[0] || null;
  };

  return {
    ...base,
    findByCode,
    findByClass,
    findWithMembers,
  };
};
