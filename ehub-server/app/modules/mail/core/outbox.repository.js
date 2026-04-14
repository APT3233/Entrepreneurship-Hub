import { v4 as uuidv4 } from "uuid";

/**
 * Transactional outbox persistence (MySQL JSON column).
 * Core mail pipeline — dùng lại cho mọi loại event gửi qua outbox mail worker.
 */
export const createOutboxRepository = ({ db }) => {
  /**
   * @param {object} opts
   * @param {string} [opts.dispatchPublicId] - All chunks of one send share this (client mail_dispatch_id). If omitted, equals new public_id.
   */
  const insertWithConn = async (conn, { eventType, payload, dispatchPublicId = null }) => {
    const publicId = uuidv4();
    const dispatchId = dispatchPublicId ?? publicId;
    const json = JSON.stringify(payload);
    const [res] = await conn.execute(
      "INSERT INTO outbox_events (public_id, dispatch_public_id, event_type, payload, status) VALUES (?, ?, ?, ?, 'pending')",
      [publicId, dispatchId, eventType, json]
    );
    return { id: res.insertId, publicId, dispatchPublicId: dispatchId };
  };

  const findByPublicId = async (publicId) => {
    const sql = `SELECT id, public_id, dispatch_public_id, event_type, payload, status, attempts, next_retry_at, last_error, created_at, processed_at FROM outbox_events WHERE public_id = ? OR dispatch_public_id = ? ORDER BY id ASC LIMIT 1`;
    const [rows] = await db.execute(sql, [publicId, publicId]);
    return rows[0] || null;
  };

  const markDone = async (conn, outboxId) => {
    await conn.execute(
      "UPDATE outbox_events SET status = 'done', processed_at = NOW(), last_error = NULL WHERE id = ?",
      [outboxId]
    );
  };

  const markDead = async (conn, outboxId, errMsg) => {
    await conn.execute(
      "UPDATE outbox_events SET status = 'dead', last_error = ?, processed_at = NOW() WHERE id = ?",
      [String(errMsg || "").slice(0, 2000), outboxId]
    );
  };

  return {
    insertWithConn,
    findByPublicId,
    markDone,
    markDead,
  };
};
