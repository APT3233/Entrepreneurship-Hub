/**
 * Idempotency records written in the same transaction as marking invite sent.
 * Core mail pipeline — có thể tái sử dụng cho các luồng gửi khác.
 */
export const createInboxRepository = ({ db }) => {
  const insertWithConn = async (conn, { idempotencyKey, outboxId, inviteId = null, groupInviteId = null }) => {
    await conn.execute(
      "INSERT INTO inbox_events (idempotency_key, outbox_id, invite_id, group_invite_id) VALUES (?, ?, ?, ?)",
      [idempotencyKey, outboxId, inviteId, groupInviteId]
    );
  };

  const existsByKey = async (idempotencyKey) => {
    const [rows] = await db.execute(
      "SELECT 1 FROM inbox_events WHERE idempotency_key = ? LIMIT 1",
      [idempotencyKey]
    );
    return rows.length > 0;
  };

  return { insertWithConn, existsByKey };
};
