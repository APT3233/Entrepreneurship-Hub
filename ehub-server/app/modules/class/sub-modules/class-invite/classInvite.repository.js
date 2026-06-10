/**
 * Persistence for class enrollment (`class_invites` table) — link email → activate account / join class.
 * Dùng bởi ClassService (bulk invite), GroupService (TH1 reuse token), AuthService (activate), outbox mail worker.
 */
export const createClassInviteRepository = ({ db }) => {
  const invalidateUnusedForPair = async (studentId, classId) => {
    const [res] = await db.execute(
      "UPDATE class_invites SET used = 1 WHERE student_id = ? AND class_id = ? AND used = 0",
      [studentId, classId]
    );
    return res.affectedRows ?? 0;
  };

  /** Same as invalidateUnusedForPair but inside an open transaction connection. */
  const invalidateUnusedForPairConn = async (conn, studentId, classId) => {
    const [res] = await conn.execute(
      "UPDATE class_invites SET used = 1 WHERE student_id = ? AND class_id = ? AND used = 0",
      [studentId, classId]
    );
    return res.affectedRows ?? 0;
  };

  const insert = async ({ email, student_id, class_id, token, expires_at, outbox_id = null }) => {
    const [res] = await db.execute(
      `INSERT INTO class_invites (email, student_id, class_id, outbox_id, token, expires_at, used, email_delivery_status, email_attempts)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [email, student_id, class_id, outbox_id, token, expires_at, outbox_id ? "queued" : null, 0]
    );
    return res.insertId;
  };

  /**
   * Insert invite row for outbox mail pipeline (queued). outbox_id set later in same transaction.
   */
  const insertQueuedInviteConn = async (conn, { email, student_id, class_id, token, expires_at }) => {
    const [res] = await conn.execute(
      `INSERT INTO class_invites (email, student_id, class_id, outbox_id, token, expires_at, used, email_delivery_status, email_attempts)
       VALUES (?, ?, ?, NULL, ?, ?, 0, 'queued', 0)`,
      [email, student_id, class_id, token, expires_at]
    );
    return res.insertId;
  };

  const setOutboxIdForInvitesConn = async (conn, outboxId, inviteIds) => {
    if (!inviteIds?.length) return 0;
    const ph = inviteIds.map(() => "?").join(",");
    const [res] = await conn.execute(`UPDATE class_invites SET outbox_id = ? WHERE id IN (${ph})`, [
      outboxId,
      ...inviteIds,
    ]);
    return res.affectedRows ?? 0;
  };

  /** Class invite chưa dùng, còn hạn (TH1 group mail: reuse token). */
  const findPendingUnusedByStudentClassConn = async (conn, studentId, classId) => {
    const [rows] = await conn.execute(
      `SELECT id, token, expires_at FROM class_invites
       WHERE student_id = ? AND class_id = ? AND used = 0 AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1 FOR UPDATE`,
      [studentId, classId]
    );
    return rows[0] || null;
  };

  /** Cho worker gửi mail nhóm (TH1): lấy token kích hoạt lớp mới nhất. */
  const findLatestPendingClassInvite = async (studentId, classId) => {
    const [rows] = await db.execute(
      `SELECT id, token, email FROM class_invites
       WHERE student_id = ? AND class_id = ? AND used = 0 AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [studentId, classId]
    );
    return rows[0] || null;
  };

  const findById = async (id) => {
    const [rows] = await db.execute(
      `SELECT id, email, student_id, class_id, outbox_id, token, expires_at, used,
              email_delivery_status, email_attempts, email_last_error, email_sent_at, email_next_retry_at
       FROM class_invites WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  };

  /** Preview: no row lock (public GET). */
  const findByTokenWithClass = async (token) => {
    const sql = `
      SELECT i.id, i.email, i.used, i.expires_at, i.student_id, i.class_id, c.class_code
      FROM class_invites i
      INNER JOIN classes c ON c.id = i.class_id AND c.deleted_at IS NULL
      WHERE i.token = ?
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, [token]);
    return rows[0] || null;
  };

  /** Activation: lock row inside an open transaction. */
  const findByTokenForUpdate = async (conn, token) => {
    const sql = `
      SELECT i.id, i.email, i.used, i.expires_at, i.student_id, i.class_id,
             s.user_id AS student_user_id, s.status AS student_status, s.full_name AS student_full_name,
             s.student_code AS student_code,
             c.class_code
      FROM class_invites i
      INNER JOIN students s ON s.id = i.student_id AND s.deleted_at IS NULL
      INNER JOIN classes c ON c.id = i.class_id AND c.deleted_at IS NULL
      WHERE i.token = ?
      LIMIT 1
      FOR UPDATE
    `;
    const [rows] = await conn.execute(sql, [token]);
    return rows[0] || null;
  };

  const markUsed = async (conn, inviteId) => {
    const [res] = await conn.execute("UPDATE class_invites SET used = 1 WHERE id = ? AND used = 0", [inviteId]);
    return (res.affectedRows ?? 0) > 0;
  };

  const deleteByClassId = async (classId, conn = db) => {
    const [res] = await conn.execute("DELETE FROM class_invites WHERE class_id = ?", [Number(classId)]);
    return res.affectedRows ?? 0;
  };

  return {
    invalidateUnusedForPair,
    invalidateUnusedForPairConn,
    insert,
    insertQueuedInviteConn,
    setOutboxIdForInvitesConn,
    findPendingUnusedByStudentClassConn,
    findLatestPendingClassInvite,
    findById,
    findByTokenWithClass,
    findByTokenForUpdate,
    markUsed,
    deleteByClassId,
  };
};
