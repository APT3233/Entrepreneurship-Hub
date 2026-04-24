/**
 * Pending email invites to join a group (accept / decline).
 */
export const createGroupInviteRepository = ({ db }) => {
  const statusRank = Object.freeze({ declined: 1, pending: 2, accepted: 3 });

  const insertQueuedConn = async (conn, row) => {
    const [res] = await conn.execute(
      `INSERT INTO group_invites (
        group_id, student_id, token, intended_role, status, expires_at, invited_by,
        outbox_id, email_delivery_status, email_attempts
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?, NULL, 'queued', 0)`,
      [
        row.group_id,
        row.student_id,
        row.token,
        row.intended_role ?? "member",
        row.expires_at,
        row.invited_by ?? null,
      ]
    );
    return res.insertId;
  };

  const setOutboxIdConn = async (conn, outboxId, ids) => {
    if (!ids?.length) return 0;
    const ph = ids.map(() => "?").join(",");
    const [r] = await conn.execute(`UPDATE group_invites SET outbox_id = ? WHERE id IN (${ph})`, [
      outboxId,
      ...ids,
    ]);
    return r.affectedRows ?? 0;
  };

  const findById = async (id) => {
    const [rows] = await db.execute(
      `SELECT gi.*, s.email, s.user_id AS student_user_id, s.full_name AS student_full_name,
              g.class_id, c.class_code AS class_code
       FROM group_invites gi
       JOIN students s ON s.id = gi.student_id AND s.deleted_at IS NULL
       JOIN \`groups\` g ON g.id = gi.group_id AND g.deleted_at IS NULL
       JOIN classes c ON c.id = g.class_id AND c.deleted_at IS NULL
       WHERE gi.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  };

  const findByToken = async (token) => {
    const [rows] = await db.execute(
      `SELECT gi.*, s.email, s.user_id AS student_user_id,
              g.class_id, g.group_name, g.group_code, c.class_code
       FROM group_invites gi
       JOIN students s ON s.id = gi.student_id AND s.deleted_at IS NULL
       JOIN \`groups\` g ON g.id = gi.group_id AND g.deleted_at IS NULL
       JOIN classes c ON c.id = g.class_id AND c.deleted_at IS NULL
       WHERE gi.token = ? LIMIT 1`,
      [token]
    );
    return rows[0] || null;
  };

  const findByTokenForUpdate = async (conn, token) => {
    const [rows] = await conn.execute(
      `SELECT gi.*, s.email, s.user_id AS student_user_id
       FROM group_invites gi
       JOIN students s ON s.id = gi.student_id AND s.deleted_at IS NULL
       WHERE gi.token = ?
       LIMIT 1 FOR UPDATE`,
      [token]
    );
    return rows[0] || null;
  };

  const findPendingByGroupAndStudentConn = async (conn, groupId, studentId) => {
    const [rows] = await conn.execute(
      `SELECT id, token, expires_at
       FROM group_invites
       WHERE group_id = ? AND student_id = ? AND status = 'pending' AND expires_at > NOW()
       ORDER BY id DESC
       LIMIT 1
       FOR UPDATE`,
      [groupId, studentId]
    );
    return rows[0] || null;
  };

  const countPendingByGroupConn = async (conn, groupId) => {
    const [rows] = await conn.execute(
      `SELECT COUNT(*) AS n
       FROM group_invites
       WHERE group_id = ? AND status = 'pending' AND expires_at > NOW()`,
      [groupId]
    );
    return Number(rows[0]?.n) || 0;
  };

  const listPendingByStudentUserId = async (userId) => {
    const [rows] = await db.execute(
      `SELECT gi.id, gi.token, gi.group_id, gi.expires_at, gi.status,
              g.group_name, g.group_code, g.zalo_link,
              c.class_code, c.id AS class_id,
              COALESCE(NULLIF(TRIM(g.mentor_name), ''), lec.full_name) AS mentor_display_name
       FROM group_invites gi
       JOIN students s ON s.id = gi.student_id AND s.deleted_at IS NULL
       JOIN \`groups\` g ON g.id = gi.group_id AND g.deleted_at IS NULL
       JOIN classes c ON c.id = g.class_id AND c.deleted_at IS NULL
       LEFT JOIN users lec ON lec.id = c.lecturer_id AND lec.deleted_at IS NULL
       WHERE s.user_id = ? AND gi.status = 'pending' AND gi.expires_at > NOW()
       ORDER BY gi.created_at DESC`,
      [userId]
    );
    return rows;
  };

  const hasActiveGroupByStudentId = async (studentId) => {
    const [rows] = await db.execute(
      `SELECT 1
       FROM group_members gm
       JOIN \`groups\` g ON g.id = gm.group_id
       WHERE gm.student_id = ?
         AND gm.status = 'active'
         AND g.deleted_at IS NULL
       LIMIT 1`,
      [studentId]
    );
    return rows.length > 0;
  };

  const listInvitePreviewMembersByGroupIds = async (groupIds) => {
    if (!Array.isArray(groupIds) || groupIds.length === 0) return [];
    const placeholders = groupIds.map(() => "?").join(",");
    const [rows] = await db.execute(
      `SELECT src.group_id, src.student_id, src.student_code, src.full_name, src.status
       FROM (
         SELECT gm.group_id,
                s.id AS student_id,
                s.student_code,
                s.full_name,
                'accepted' AS status,
                UNIX_TIMESTAMP(gm.joined_at) AS ts
         FROM group_members gm
         JOIN students s ON s.id = gm.student_id AND s.deleted_at IS NULL
         JOIN \`groups\` g ON g.id = gm.group_id AND g.deleted_at IS NULL
         WHERE gm.status = 'active' AND gm.group_id IN (${placeholders})
         UNION ALL
         SELECT gi.group_id,
                s.id AS student_id,
                s.student_code,
                s.full_name,
                gi.status AS status,
                UNIX_TIMESTAMP(gi.created_at) AS ts
         FROM group_invites gi
         JOIN students s ON s.id = gi.student_id AND s.deleted_at IS NULL
         JOIN \`groups\` g ON g.id = gi.group_id AND g.deleted_at IS NULL
         WHERE gi.group_id IN (${placeholders})
           AND gi.status IN ('pending','accepted','declined')
       ) src
       ORDER BY src.group_id ASC, src.student_code ASC, src.ts DESC`,
      [...groupIds, ...groupIds]
    );

    const dedup = new Map();
    for (const row of rows) {
      const key = `${row.group_id}:${row.student_id}`;
      const prev = dedup.get(key);
      if (!prev) {
        dedup.set(key, row);
        continue;
      }
      const currentRank = statusRank[String(row.status)] || 0;
      const prevRank = statusRank[String(prev.status)] || 0;
      if (currentRank > prevRank) dedup.set(key, row);
    }
    return Array.from(dedup.values());
  };

  const findActiveGroupSnapshotByStudentId = async (studentId) => {
    const [rows] = await db.execute(
      `SELECT g.id AS group_id, g.group_name, g.group_code, g.max_members, g.created_at, g.zalo_link,
              g.category, g.topic,
              c.class_code,
              COALESCE(NULLIF(TRIM(g.mentor_name), ''), lec.full_name) AS mentor_display_name,
              sem.semester_name AS semester_name,
              (
                SELECT COUNT(*) FROM group_members gm2
                WHERE gm2.group_id = g.id AND gm2.status = 'active'
              ) AS active_members
       FROM group_members gm
       JOIN \`groups\` g ON g.id = gm.group_id AND g.deleted_at IS NULL
       JOIN classes c ON c.id = g.class_id AND c.deleted_at IS NULL
       LEFT JOIN users lec ON lec.id = c.lecturer_id AND lec.deleted_at IS NULL
       LEFT JOIN semesters sem ON sem.id = c.semester_id AND sem.deleted_at IS NULL
       WHERE gm.student_id = ? AND gm.status = 'active'
       ORDER BY gm.joined_at DESC
       LIMIT 1`,
      [studentId]
    );
    return rows[0] || null;
  };

  const listActiveMembersByGroupId = async (groupId) => {
    const [rows] = await db.execute(
      `SELECT s.id AS student_id, s.student_code, s.full_name, gm.role
       FROM group_members gm
       JOIN students s ON s.id = gm.student_id AND s.deleted_at IS NULL
       WHERE gm.group_id = ? AND gm.status = 'active'
       ORDER BY
         CASE WHEN gm.role = 'leader' THEN 0 ELSE 1 END ASC,
         s.student_code ASC`,
      [groupId]
    );
    return rows;
  };

  const insertInviteReportConn = async (conn, { groupInviteId, groupId, studentId, issueType, description }) => {
    const [res] = await conn.execute(
      `INSERT INTO group_invite_reports (group_invite_id, group_id, student_id, issue_type, description)
       VALUES (?, ?, ?, ?, ?)`,
      [groupInviteId, groupId, studentId, issueType, description]
    );
    return res.insertId;
  };

  return {
    insertQueuedConn,
    setOutboxIdConn,
    findById,
    findByToken,
    findByTokenForUpdate,
    findPendingByGroupAndStudentConn,
    countPendingByGroupConn,
    listPendingByStudentUserId,
    hasActiveGroupByStudentId,
    listInvitePreviewMembersByGroupIds,
    findActiveGroupSnapshotByStudentId,
    listActiveMembersByGroupId,
    insertInviteReportConn,
  };
};
