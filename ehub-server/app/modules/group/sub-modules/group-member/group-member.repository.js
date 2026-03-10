import { createBaseRepository } from "app/core/database/baseRepository.js";

export const createGroupMemberRepository = ({ db }) => {
  const base = createBaseRepository(db, "group_members");

  const findByGroupAndStudent = async (groupId, studentId) => {
    return base.findOne({ group_id: groupId, student_id: studentId });
  };

  const findByGroup = async (groupId) => {
    const sql = `
      SELECT gm.*, s.student_code, s.full_name, s.email, s.phone
      FROM group_members gm
        JOIN students s ON s.id = gm.student_id
      WHERE gm.group_id = :groupId
      ORDER BY gm.role DESC, s.student_code ASC
    `;
    const [rows] = await db.execute(sql, { groupId });
    return rows;
  };

  const countActiveByGroup = async (groupId) => {
    return base.count({ group_id: groupId, status: "active" });
  };

  /**
   * Check if student is already in another group within the same class
   */
  const findStudentGroupInClass = async (studentId, classId) => {
    const sql = `
      SELECT gm.*, g.group_code, g.group_name
      FROM group_members gm
        JOIN \`groups\` g ON g.id = gm.group_id
      WHERE gm.student_id = :studentId
        AND g.class_id = :classId
        AND gm.status = 'active'
        AND g.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { studentId, classId });
    return rows[0] || null;
  };

  return {
    ...base,
    findByGroupAndStudent,
    findByGroup,
    countActiveByGroup,
    findStudentGroupInClass,
  };
};
