import { createBaseRepository } from "app/core/database/baseRepository.js";

export const createGroupRepository = ({ db }) => {
  const base = createBaseRepository(db, "groups");

  const insertWithConn = async (conn, data) => {
    const now = new Date();
    const row = {
      class_id: data.class_id,
      group_code: data.group_code,
      group_name: data.group_name,
      description: data.description ?? null,
      category: data.category ?? null,
      topic: data.topic ?? null,
      topic_desc: data.topic_desc ?? null,
      zalo_link: data.zalo_link ?? null,
      mentor_name: data.mentor_name ?? null,
      mentor_dept: data.mentor_dept ?? null,
      max_members: data.max_members ?? 6,
      status: data.status ?? "forming",
      created_by: data.created_by ?? null,
      created_at: now,
      updated_at: now,
    };
    const keys = Object.keys(row);
    const cols = keys.map((k) => `\`${k}\``).join(", ");
    const ph = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO \`groups\` (${cols}) VALUES (${ph})`;
    const [res] = await conn.execute(sql, keys.map((k) => row[k]));
    return res.insertId;
  };

  const findByCode = async (code, classId) => {
    return base.findOne({ group_code: code, class_id: classId, deleted_at: null });
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
             c.class_code, c.class_name,
             sub.subject_code, sub.subject_name,
             sem.semester_name, sem.year,
             lec.full_name AS lecturer_name, 
             lec.email AS lecturer_email
      FROM \`groups\` g
        JOIN classes c ON c.id = g.class_id
        JOIN subjects sub ON sub.id = c.subject_id
        JOIN semesters sem ON sem.id = c.semester_id
        LEFT JOIN users lec ON lec.id = c.lecturer_id
      WHERE g.id = :id AND g.deleted_at IS NULL
    `;
    const [rows] = await db.execute(sql, { id });
    return rows[0] || null;
  };

  /** List groups filtered by lecturer (groups in classes taught by lecturer) */
  const findManyByLecturer = async ({ lecturerId, status, classId, semesterId, semesterIds, pagination, sort }) => {
    const params = { lecturerId };
    const clauses = ["g.deleted_at IS NULL", "c.deleted_at IS NULL", "c.lecturer_id = :lecturerId"];
    if (status) { clauses.push("g.`status` = :status"); params.status = status; }
    if (classId) { clauses.push("g.class_id = :classId"); params.classId = classId; }
    if (Array.isArray(semesterIds) && semesterIds.length > 0) {
      const placeholders = semesterIds.map((_, idx) => `:sem${idx}`).join(", ");
      clauses.push(`c.semester_id IN (${placeholders})`);
      semesterIds.forEach((id, idx) => { params[`sem${idx}`] = id; });
    } else if (semesterId != null) {
      clauses.push("c.semester_id = :semesterId");
      params.semesterId = semesterId;
    }
    let sql = `SELECT g.*, c.class_code, c.semester_id,
         sem.semester_name,
         (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'active') AS member_count,
         (SELECT COUNT(*) FROM group_members gm JOIN students s ON s.id = gm.student_id WHERE gm.group_id = g.id AND gm.status = 'active' AND s.student_code LIKE 'DE%') AS de_count,
         (SELECT COUNT(*) FROM group_members gm JOIN students s ON s.id = gm.student_id WHERE gm.group_id = g.id AND gm.status = 'active' AND (s.student_code LIKE 'DS%' OR s.student_code LIKE 'DA%')) AS dsda_count
      FROM \`groups\` g
      JOIN classes c ON c.id = g.class_id
      JOIN semesters sem ON sem.id = c.semester_id
      WHERE ${clauses.join(" AND ")}`;
    if (sort?.length) {
      const orderParts = sort.map(({ column, order }) => `g.\`${column}\` ${order.toUpperCase() === "DESC" ? "DESC" : "ASC"}`);
      sql += ` ORDER BY ${orderParts.join(", ")}`;
    } else sql += " ORDER BY g.created_at DESC";
    if (pagination) sql += ` LIMIT ${pagination.limit} OFFSET ${pagination.offset}`;
    const [rows] = await db.execute(sql, params);
    return rows;
  };

  /** Lấy thông tin lớp kèm trạng thái học kỳ (để kiểm tra điều kiện tạo nhóm: chỉ khi ongoing) */
  const findClassWithSemesterStatus = async (classId) => {
    const sql = `
      SELECT c.id, c.lecturer_id, c.class_code, sem.status AS semester_status, sub.status AS subject_status, sub.subject_name
      FROM \`classes\` c
      JOIN semesters sem ON sem.id = c.semester_id
      JOIN subjects sub ON sub.id = c.subject_id
      WHERE c.id = :classId AND c.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, { classId });
    return rows[0] || null;
  };

  const countByLecturer = async ({ lecturerId, status, classId, semesterId, semesterIds }) => {
    const params = { lecturerId };
    const clauses = ["g.deleted_at IS NULL", "c.deleted_at IS NULL", "c.lecturer_id = :lecturerId"];
    if (status) { clauses.push("g.`status` = :status"); params.status = status; }
    if (classId) { clauses.push("g.class_id = :classId"); params.classId = classId; }
    if (Array.isArray(semesterIds) && semesterIds.length > 0) {
      const placeholders = semesterIds.map((_, idx) => `:sem${idx}`).join(", ");
      clauses.push(`c.semester_id IN (${placeholders})`);
      semesterIds.forEach((id, idx) => { params[`sem${idx}`] = id; });
    } else if (semesterId != null) {
      clauses.push("c.semester_id = :semesterId");
      params.semesterId = semesterId;
    }
    const sql = `SELECT COUNT(g.id) as total FROM \`groups\` g JOIN classes c ON c.id = g.class_id WHERE ${clauses.join(" AND ")}`;
    const [rows] = await db.execute(sql, params);
    return Number(rows[0].total);
  };

  /**
   * Get group stats (eligible, needsReview, ineligible) for lecturer
   */
  const getGroupStatsByLecturer = async (lecturerId, semesterId = null, semesterIds = null) => {
    const params = { lecturerId };
    let whereClause = "c.lecturer_id = :lecturerId AND g.deleted_at IS NULL AND c.deleted_at IS NULL";
    
    if (Array.isArray(semesterIds) && semesterIds.length > 0) {
      const placeholders = semesterIds.map((_, idx) => `:sem${idx}`).join(", ");
      whereClause += ` AND c.semester_id IN (${placeholders})`;
      semesterIds.forEach((id, idx) => { params[`sem${idx}`] = id; });
    } else if (semesterId != null) {
      whereClause += " AND c.semester_id = :semesterId";
      params.semesterId = semesterId;
    }

    const sql = `
      SELECT 
        g.id,
        (SELECT COUNT(*) FROM group_members gm JOIN students s ON s.id = gm.student_id WHERE gm.group_id = g.id AND gm.status = 'active' AND s.student_code LIKE 'DE%') AS de_count,
        (SELECT COUNT(*) FROM group_members gm JOIN students s ON s.id = gm.student_id WHERE gm.group_id = g.id AND gm.status = 'active' AND (s.student_code LIKE 'DS%' OR s.student_code LIKE 'DA%')) AS dsda_count
      FROM \`groups\` g
      JOIN classes c ON c.id = g.class_id
      WHERE ${whereClause}
    `;
    const [rows] = await db.execute(sql, params);
    
    let eligible = 0;
    let needsReview = 0;
    let ineligible = 0;

    for (const row of rows) {
      const de = Number(row.de_count);
      const dsda = Number(row.dsda_count);
      
      if (de === 0 || dsda === 0) {
        ineligible++;
      } else if (de < 2 || dsda < 2) {
        needsReview++;
      } else {
        eligible++;
      }
    }

    return { eligible, needsReview, ineligible };
  };

  /**
   * Get member stats (DE vs DSDA) for a single group
   */
  const getMemberStatsByGroupId = async (groupId) => {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM group_members gm JOIN students s ON s.id = gm.student_id WHERE gm.group_id = :groupId AND gm.status = 'active' AND s.student_code LIKE 'DE%') AS de_count,
        (SELECT COUNT(*) FROM group_members gm JOIN students s ON s.id = gm.student_id WHERE gm.group_id = :groupId AND gm.status = 'active' AND (s.student_code LIKE 'DS%' OR s.student_code LIKE 'DA%')) AS dsda_count
    `;
    const [rows] = await db.execute(sql, { groupId });
    const row = rows[0];
    const de = Number(row?.de_count || 0);
    const dsda = Number(row?.dsda_count || 0);

    let status = "ineligible";
    if (de >= 2 && dsda >= 2) status = "eligible";
    else if (de > 0 && dsda > 0) status = "needs_review";

    return { de, dsda, status };
  };

  /** Find groups where student is a member */
  const findByStudent = async (studentUserId) => {
    const sql = `
      SELECT g.*, 
             c.class_code, c.class_name,
             sem.semester_name, sem.year,
             gm.role as my_role
      FROM \`groups\` g
      JOIN group_members gm ON gm.group_id = g.id
      JOIN students s ON s.id = gm.student_id
      JOIN classes c ON c.id = g.class_id
      JOIN semesters sem ON sem.id = c.semester_id
      WHERE s.user_id = :studentUserId 
        AND g.deleted_at IS NULL 
        AND gm.status = 'active'
      ORDER BY sem.year DESC, sem.semester_name DESC
    `;
    const [rows] = await db.execute(sql, { studentUserId });
    return rows;
  };

  const update = async (id, data) => {
    const keys = Object.keys(data);
    if (!keys.length) return null;

    const payload = { ...data };
    if (!payload.updated_at) payload.updated_at = new Date();

    const updateData = { ...payload, whereId: id };
    const updateKeys = Object.keys(updateData).filter((k) => k !== "whereId");
    const setClause = updateKeys.map((k) => `\`${k}\` = :${k}`).join(", ");

    const sql = `UPDATE \`groups\` SET ${setClause} WHERE id = :whereId`;
    await db.execute(sql, updateData);
    return findWithMembers(id);
  };

  return {
    ...base,
    insertWithConn,
    update,
    findByCode,
    findByClass,
    findWithMembers,
    findManyByLecturer,
    findClassWithSemesterStatus,
    countByLecturer,
    getGroupStatsByLecturer,
    getMemberStatsByGroupId,
    findByStudent,
  };
};
