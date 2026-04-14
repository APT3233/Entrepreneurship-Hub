import { createBaseRepository } from "app/core/database/baseRepository.js";

export const createGroupMemberRepository = ({ db }) => {
  const base = createBaseRepository(db, "group_members");

  /** Bảng group_members có joined_at, không có created_at/updated_at — insert thủ công */
  const buildInsertPayload = (data) => ({
    group_id: data.group_id,
    student_id: data.student_id,
    role: data.role ?? "member",
    status: data.status ?? "active",
    joined_at: data.joined_at ?? new Date(),
  });

  const insertWithConn = async (conn, data) => {
    const payload = buildInsertPayload(data);
    const keys = Object.keys(payload);
    const cols = keys.map((k) => `\`${k}\``).join(", ");
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO group_members (${cols}) VALUES (${placeholders})`;
    await conn.execute(sql, keys.map((k) => payload[k]));
  };

  const create = async (data) => {
    const payload = buildInsertPayload(data);
    const keys = Object.keys(payload);
    const cols = keys.map((k) => `\`${k}\``).join(", ");
    const placeholders = keys.map((k) => `:${k}`).join(", ");
    const sql = `INSERT INTO group_members (${cols}) VALUES (${placeholders})`;
    const [result] = await db.execute(sql, payload);
    if (result.insertId) return base.findById(result.insertId);
    return result;
  };

  const findByGroupAndStudent = async (groupId, studentId) => {
    return base.findOne({ group_id: groupId, student_id: studentId });
  };

  const findByGroup = async (groupId) => {
    const sql = `
      SELECT gm.*, s.student_code, s.full_name, s.email, s.phone, s.major
      FROM group_members gm
        JOIN students s ON s.id = gm.student_id
      WHERE gm.group_id = :groupId
      ORDER BY gm.role DESC, s.student_code ASC
    `;
    const [rows] = await db.execute(sql, { groupId });
    return rows;
  };

  /** Cập nhật từng field (bảng không có updated_at — không dùng base.update) */
  const updateById = async (id, fields) => {
    const allowed = ["role", "status", "left_at", "note"];
    const data = {};
    for (const k of allowed) {
      if (fields[k] !== undefined) data[k] = fields[k];
    }
    const keys = Object.keys(data);
    if (!keys.length) return base.findById(id);
    const setClause = keys.map((k) => `\`${k}\` = :${k}`).join(", ");
    await db.execute(`UPDATE group_members SET ${setClause} WHERE id = :id`, { ...data, id });
    return base.findById(id);
  };

  const demoteLeadersExcept = async (groupId, exceptStudentId) => {
    await db.execute(
      `UPDATE group_members SET role = 'member' WHERE group_id = ? AND role = 'leader' AND student_id != ?`,
      [groupId, exceptStudentId],
    );
  };

  const findJoinedById = async (id) => {
    const sql = `
      SELECT gm.*, s.student_code, s.full_name, s.email, s.phone, s.major
      FROM group_members gm
        JOIN students s ON s.id = gm.student_id
      WHERE gm.id = :id
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { id });
    return rows[0] || null;
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

  /**
   * Tất cả thành viên nhóm trong một lớp (để hiển thị sinh viên thuộc nhóm nào / chưa có nhóm)
   * Trả về: [{ student_id, group_id, group_name, group_code, role }]
   */
  const findMembersByClass = async (classId) => {
    const sql = `
      SELECT gm.student_id, gm.group_id, gm.role,
             g.group_name, g.group_code
      FROM group_members gm
        JOIN \`groups\` g ON g.id = gm.group_id
      WHERE g.class_id = :classId
        AND g.deleted_at IS NULL
        AND gm.status = 'active'
      ORDER BY g.group_code, gm.role DESC
    `;
    const [rows] = await db.execute(sql, { classId });
    return rows;
  };

  return {
    ...base,
    insertWithConn,
    create,
    findByGroupAndStudent,
    findByGroup,
    updateById,
    demoteLeadersExcept,
    findJoinedById,
    countActiveByGroup,
    findStudentGroupInClass,
    findMembersByClass,
  };
};
