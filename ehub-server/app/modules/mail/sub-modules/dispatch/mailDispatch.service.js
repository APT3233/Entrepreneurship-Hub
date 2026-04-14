import { NotFound, Forbidden } from "app/core/errors/errorFactory.js";
import { maskEmail } from "app/core/utils/maskEmail.js";
import { OUTBOX_GROUP_INVITE_EMAIL_DISPATCH } from "app/core/constants/outboxEventTypes.js";

const isLecturerOnly = (user) =>
  user?.roles?.length && !user.roles.some((r) => ["admin", "department_head"].includes(String(r).toLowerCase()));

const parsePayload = (raw) => {
  if (raw == null) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return typeof raw === "object" ? raw : {};
};

/**
 * Lecturer-scoped read model for outbox invite email progress (class + group; chunked outbox rows).
 */
export const createMailDispatchService = ({ db, outboxRepository, classRepository }) => {
  const assertCanView = async (publicId, user) => {
    if (!user) throw Forbidden("Authentication required");
    const ob = await outboxRepository.findByPublicId(publicId);
    if (!ob) throw NotFound("Mail dispatch");
    const payload = parsePayload(ob.payload);
    const classId = payload?.classId;
    if (classId == null) throw NotFound("Mail dispatch");
    const cls = await classRepository.findWithDetails(classId);
    if (!cls) throw NotFound("Class");
    if (isLecturerOnly(user) && Number(cls.lecturer_id) !== Number(user.id)) {
      throw Forbidden("You cannot view this dispatch");
    }
    return { ob, payload, classId, cls };
  };

  const combinedOutboxStatus = (chunks) => {
    const st = chunks.map((c) => String(c.status || ""));
    if (st.some((s) => s === "pending")) return "pending";
    if (st.some((s) => s === "processing")) return "processing";
    if (st.length && st.every((s) => s === "done" || s === "dead" || s === "failed")) return "done";
    return chunks[0]?.status || "pending";
  };

  const getProgress = async (publicId, user) => {
    const { ob, payload, classId, cls } = await assertCanView(publicId, user);
    const dispatchPid = ob.dispatch_public_id || ob.public_id;
    const [chunks] = await db.execute(
      "SELECT id, status, event_type FROM outbox_events WHERE dispatch_public_id = ? ORDER BY id ASC",
      [dispatchPid]
    );
    const outboxIds = chunks.map((c) => c.id);
    if (outboxIds.length === 0) throw NotFound("Mail dispatch");
    const ph = outboxIds.map(() => "?").join(",");
    const eventType = String(chunks[0]?.event_type || ob.event_type || "");
    const outboxStatus = combinedOutboxStatus(chunks);

    if (eventType === OUTBOX_GROUP_INVITE_EMAIL_DISPATCH) {
      const [items] = await db.execute(
        `SELECT gi.id, s.email AS email, gi.email_delivery_status, gi.email_attempts, gi.email_last_error, gi.email_sent_at, gi.email_next_retry_at
         FROM group_invites gi INNER JOIN students s ON s.id = gi.student_id AND s.deleted_at IS NULL
         WHERE gi.outbox_id IN (${ph}) ORDER BY gi.id ASC`,
        outboxIds
      );
      const [agg] = await db.execute(
        `SELECT gi.email_delivery_status AS s, COUNT(*) AS c FROM group_invites gi WHERE gi.outbox_id IN (${ph}) GROUP BY gi.email_delivery_status`,
        outboxIds
      );
      const summary = { total: 0, queued: 0, sending: 0, sent: 0, failed: 0, other: 0 };
      for (const r of agg) {
        const k = String(r.s || "unknown").toLowerCase();
        const n = Number(r.c) || 0;
        summary.total += n;
        if (k in summary) summary[k] += n;
        else summary.other += n;
      }
      return {
        publicId: dispatchPid,
        outboxStatus,
        dispatchKind: "group",
        classId,
        classCode: cls.class_code || payload?.classCode,
        summary,
        items: items.map((row) => ({
          groupInviteId: row.id,
          emailMasked: maskEmail(row.email),
          deliveryStatus: row.email_delivery_status,
          attempts: row.email_attempts,
          lastError: row.email_last_error,
          sentAt: row.email_sent_at,
          nextRetryAt: row.email_next_retry_at,
        })),
      };
    }

    const [items] = await db.execute(
      `SELECT id, email, email_delivery_status, email_attempts, email_last_error, email_sent_at, email_next_retry_at
       FROM class_invites WHERE outbox_id IN (${ph}) ORDER BY id ASC`,
      outboxIds
    );
    const [agg] = await db.execute(
      `SELECT email_delivery_status AS s, COUNT(*) AS c FROM class_invites WHERE outbox_id IN (${ph}) GROUP BY email_delivery_status`,
      outboxIds
    );
    const summary = { total: 0, queued: 0, sending: 0, sent: 0, failed: 0, other: 0 };
    for (const r of agg) {
      const k = String(r.s || "unknown").toLowerCase();
      const n = Number(r.c) || 0;
      summary.total += n;
      if (k in summary) summary[k] += n;
      else summary.other += n;
    }
    return {
      publicId: dispatchPid,
      outboxStatus,
      dispatchKind: "class",
      classId,
      classCode: cls.class_code || payload?.classCode,
      summary,
      items: items.map((row) => ({
        classInviteId: row.id,
        emailMasked: maskEmail(row.email),
        deliveryStatus: row.email_delivery_status,
        attempts: row.email_attempts,
        lastError: row.email_last_error,
        sentAt: row.email_sent_at,
        nextRetryAt: row.email_next_retry_at,
      })),
    };
  };

  return { assertCanView, getProgress };
};
