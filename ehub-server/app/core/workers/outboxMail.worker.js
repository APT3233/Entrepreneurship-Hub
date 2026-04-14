import pLimit from "p-limit";
import { logger } from "app/core/logger/index.js";
import { appConfig } from "app/config/app.js";
import { Events } from "app/core/constants/events.js";
import {
  OUTBOX_CLASS_INVITE_EMAIL_DISPATCH,
  OUTBOX_GROUP_INVITE_EMAIL_DISPATCH,
} from "app/core/constants/outboxEventTypes.js";
import {
  GROUP_INVITE_EMAIL_ERR_NO_CLASS_INVITE,
  GROUP_INVITE_EMAIL_SKIP_NOT_PENDING,
  MAIL_HEADER_GROUP_INVITE_ID,
  MAIL_HEADER_INVITE_ID,
  OUTBOX_MAIL_LAST_ERROR_PARTIAL_BATCH,
  OUTBOX_MAIL_STALE_RESET_MARKER,
  inboxIdempotencyKeyGroupInviteSmtp,
  inboxIdempotencyKeyInviteSmtp,
  mailDispatchRedisChannel,
} from "app/core/constants/mailPipeline.js";
import { maskEmail } from "app/core/utils/maskEmail.js";
import { buildInviteActivationUrl, buildClassInviteMailParts } from "app/modules/mail/core/inviteMail.helper.js";
import {
  buildGroupInviteDashboardUrl,
  buildGroupInviteMailPartsActiveUser,
  buildGroupInviteMailPartsPendingUser,
} from "app/modules/mail/core/groupInviteMail.helper.js";

const parsePayload = (raw) => {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw && typeof raw === "object" ? raw : {};
};

const publishProgressFromRows = async (redis, publicId, outboxDbId, rows) => {
  if (!redis || !publicId) return;
  try {
    const counts = { total: 0, queued: 0, sending: 0, sent: 0, failed: 0, other: 0 };
    for (const r of rows) {
      const k = String(r.s || "unknown").toLowerCase();
      const n = Number(r.c) || 0;
      counts.total += n;
      if (k in counts) counts[k] += n;
      else counts.other += n;
    }
    await redis.publish(
      mailDispatchRedisChannel(publicId),
      JSON.stringify({ ...counts, publicId, outboxId: outboxDbId })
    );
  } catch (err) {
    logger.warn("[OutboxMailWorker] redis publish progress failed", { err });
  }
};

/**
 * Poll outbox: class-invite emails + group-invite emails (idempotency inbox + row updates).
 */
export const startOutboxMailWorker = ({ db, redis, container }) => {
  const cfg = appConfig.outbox;
  if (!cfg.workerEnabled) {
    logger.info("[OutboxMailWorker] disabled (OUTBOX_WORKER_ENABLED=false)");
    return async () => {};
  }

  let timer = null;
  let stopped = false;
  /** Tracks overlapping `processOneOutbox` runs (interval can fire before previous tick finishes). */
  const inFlight = new Set();

  /** Backoff minutes for partial batch re-queue (uses outbox row attempts after claim). */
  const schedulePartialRetry = async (outboxDbId) => {
    const [[row]] = await db.execute("SELECT attempts FROM outbox_events WHERE id = ?", [outboxDbId]);
    const a = Number(row?.attempts) || 1;
    const backoffMin = Math.min(15, Math.max(1, Math.floor(a / 2) + 1));
    await db.execute(
      `UPDATE outbox_events SET status = 'pending', next_retry_at = DATE_ADD(NOW(), INTERVAL ? MINUTE), last_error = ? WHERE id = ?`,
      [backoffMin, OUTBOX_MAIL_LAST_ERROR_PARTIAL_BATCH, outboxDbId]
    );
  };

  const processClassInviteOutbox = async (cand, payload) => {
    const { transaction, email, inviteRepository, inboxRepository, outboxRepository, eventBus } =
      container.cradle;

    const outboxDbId = cand.id;
    const publicId = cand.public_id;
    const progressPublicId = cand.dispatch_public_id || cand.public_id;
    const inviteIds = Array.isArray(payload?.inviteIds) ? payload.inviteIds : [];
    const classCode = payload?.classCode || "";
    const maxA = cfg.maxAttemptsPerInvite;

    await db.execute(
      "UPDATE class_invites SET email_delivery_status = 'queued' WHERE outbox_id = ? AND email_delivery_status = 'sending'",
      [outboxDbId]
    );

    const concurrency = Math.max(1, Math.min(50, cfg.mailInviteConcurrency || 10));

    const processSingleInvite = async (inviteId) => {
      if (stopped) return;

      const key = inboxIdempotencyKeyInviteSmtp(inviteId);
      const already = await inboxRepository.existsByKey(key);
      if (already) return;

      const inv = await inviteRepository.findById(inviteId);
      if (!inv || Number(inv.outbox_id) !== Number(outboxDbId)) return;
      if (String(inv.email_delivery_status) === "sent") return;

      if (String(inv.email_delivery_status) === "failed") {
        const attempts = Number(inv.email_attempts) || 0;
        if (attempts >= maxA) return;
        const next = inv.email_next_retry_at ? new Date(inv.email_next_retry_at) : null;
        if (next && next > new Date()) return;
        await db.execute(
          "UPDATE class_invites SET email_delivery_status = 'queued', email_next_retry_at = NULL WHERE id = ? AND outbox_id = ?",
          [inviteId, outboxDbId]
        );
      }

      const claimed = await transaction.run(async (conn) => {
        const [u] = await conn.execute(
          "UPDATE class_invites SET email_delivery_status = 'sending' WHERE id = ? AND outbox_id = ? AND email_delivery_status = 'queued'",
          [inviteId, outboxDbId]
        );
        return (u.affectedRows ?? 0) > 0;
      });
      if (!claimed) return;

      const inv2 = await inviteRepository.findById(inviteId);
      const activationUrl = buildInviteActivationUrl(inv2.token);
      const { subject, text, html } = buildClassInviteMailParts({ classCode, activationUrl });
      const to = inv2.email;

      try {
        await email.send({
          to,
          subject,
          text,
          html,
          headers: { [MAIL_HEADER_INVITE_ID]: String(inviteId) },
        });
        await transaction.run(async (conn) => {
          await inboxRepository.insertWithConn(conn, {
            idempotencyKey: key,
            outboxId: outboxDbId,
            inviteId,
            groupInviteId: null,
          });
          await conn.execute(
            `UPDATE class_invites SET email_delivery_status = 'sent', email_sent_at = NOW(), email_last_error = NULL WHERE id = ?`,
            [inviteId]
          );
        });
        logger.info("[OutboxMailWorker] invite email sent", {
          inviteId,
          outboxId: outboxDbId,
          publicId,
          to: maskEmail(to),
        });
      } catch (err) {
        const msg = String(err?.message || err).slice(0, 500);
        const attempts = (Number(inv2.email_attempts) || 0) + 1;
        const terminal = attempts >= maxA;
        const backoffMin = Math.min(60, 2 ** Math.min(attempts, 6));
        const nextRetry = terminal ? null : new Date(Date.now() + backoffMin * 60 * 1000);
        await db.execute(
          `UPDATE class_invites SET email_delivery_status = 'failed', email_last_error = ?, email_attempts = ?, email_next_retry_at = ?
           WHERE id = ?`,
          [msg, attempts, nextRetry, inviteId]
        );
        logger.error("[OutboxMailWorker] invite email failed", {
          inviteId,
          outboxId: outboxDbId,
          publicId,
          to: maskEmail(to),
          attempts,
          terminal,
          err: msg,
        });
      }
    };

    if (!stopped && inviteIds.length > 0) {
      const limit = pLimit(concurrency);
      await Promise.all(inviteIds.map((id) => limit(() => processSingleInvite(id))));
      const [rows] = await db.execute(
        `SELECT email_delivery_status AS s, COUNT(*) AS c FROM class_invites WHERE outbox_id = ? GROUP BY email_delivery_status`,
        [outboxDbId]
      );
      await publishProgressFromRows(redis, progressPublicId, outboxDbId, rows);
    }

    const [leftRows] = await db.execute(
      `SELECT COUNT(*) AS n FROM class_invites WHERE outbox_id = ?
       AND NOT (
         email_delivery_status = 'sent'
         OR (email_delivery_status = 'failed' AND email_attempts >= ?)
       )`,
      [outboxDbId, maxA]
    );
    const left = Number(leftRows[0]?.n) || 0;

    if (left === 0) {
      await transaction.run(async (conn) => {
        await outboxRepository.markDone(conn, outboxDbId);
      });
      eventBus.emit(Events.MAIL_DISPATCH_COMPLETED, {
        publicId: progressPublicId,
        outboxId: outboxDbId,
        classId: payload?.classId,
      });
      logger.info("[OutboxMailWorker] class outbox completed", { publicId, outboxId: outboxDbId });
    } else {
      await schedulePartialRetry(outboxDbId);
    }

    const [rows2] = await db.execute(
      `SELECT email_delivery_status AS s, COUNT(*) AS c FROM class_invites WHERE outbox_id = ? GROUP BY email_delivery_status`,
      [outboxDbId]
    );
    await publishProgressFromRows(redis, progressPublicId, outboxDbId, rows2);
  };

  const processGroupInviteOutbox = async (cand, payload) => {
    const { transaction, email, inviteRepository, groupInviteRepository, inboxRepository, outboxRepository, eventBus } =
      container.cradle;

    const outboxDbId = cand.id;
    const publicId = cand.public_id;
    const progressPublicId = cand.dispatch_public_id || cand.public_id;
    const groupInviteIds = Array.isArray(payload?.groupInviteIds) ? payload.groupInviteIds : [];
    const groupName = payload?.groupName || "";
    const classCode = payload?.classCode || "";
    const maxA = cfg.maxAttemptsPerInvite;

    await db.execute(
      "UPDATE group_invites SET email_delivery_status = 'queued' WHERE outbox_id = ? AND email_delivery_status = 'sending'",
      [outboxDbId]
    );

    const concurrency = Math.max(1, Math.min(50, cfg.mailInviteConcurrency || 10));

    const processSingleGroupInvite = async (groupInviteId) => {
      if (stopped) return;

      const key = inboxIdempotencyKeyGroupInviteSmtp(groupInviteId);
      const already = await inboxRepository.existsByKey(key);
      if (already) return;

      const gi = await groupInviteRepository.findById(groupInviteId);
      if (!gi || Number(gi.outbox_id) !== Number(outboxDbId)) return;

      if (String(gi.status) !== "pending") {
        await db.execute(
          `UPDATE group_invites SET email_delivery_status = 'sent', email_sent_at = NOW(), email_last_error = ?
           WHERE id = ? AND outbox_id = ?`,
          [GROUP_INVITE_EMAIL_SKIP_NOT_PENDING, groupInviteId, outboxDbId]
        );
        return;
      }

      if (String(gi.email_delivery_status) === "sent") return;

      if (String(gi.email_delivery_status) === "failed") {
        const attempts = Number(gi.email_attempts) || 0;
        if (attempts >= maxA) return;
        const next = gi.email_next_retry_at ? new Date(gi.email_next_retry_at) : null;
        if (next && next > new Date()) return;
        await db.execute(
          "UPDATE group_invites SET email_delivery_status = 'queued', email_next_retry_at = NULL WHERE id = ? AND outbox_id = ?",
          [groupInviteId, outboxDbId]
        );
      }

      const claimed = await transaction.run(async (conn) => {
        const [u] = await conn.execute(
          "UPDATE group_invites SET email_delivery_status = 'sending' WHERE id = ? AND outbox_id = ? AND email_delivery_status = 'queued'",
          [groupInviteId, outboxDbId]
        );
        return (u.affectedRows ?? 0) > 0;
      });
      if (!claimed) return;

      const gi2 = await groupInviteRepository.findById(groupInviteId);
      const to = gi2.email;
      let subject;
      let text;
      let html;

      if (gi2.student_user_id) {
        const dashboardUrl = buildGroupInviteDashboardUrl(gi2.token);
        const parts = buildGroupInviteMailPartsActiveUser({
          groupName,
          classCode,
          dashboardUrl,
        });
        subject = parts.subject;
        text = parts.text;
        html = parts.html;
      } else {
        const classInv = await inviteRepository.findLatestPendingClassInvite(gi2.student_id, gi2.class_id);
        if (!classInv) {
          const msg = GROUP_INVITE_EMAIL_ERR_NO_CLASS_INVITE;
          const attempts = (Number(gi2.email_attempts) || 0) + 1;
          const terminal = attempts >= maxA;
          const backoffMin = Math.min(60, 2 ** Math.min(attempts, 6));
          const nextRetry = terminal ? null : new Date(Date.now() + backoffMin * 60 * 1000);
          await db.execute(
            `UPDATE group_invites SET email_delivery_status = 'failed', email_last_error = ?, email_attempts = ?, email_next_retry_at = ?
             WHERE id = ?`,
            [msg, attempts, nextRetry, groupInviteId]
          );
          logger.error("[OutboxMailWorker] group invite TH1 missing class invite row", {
            groupInviteId,
            studentId: gi2.student_id,
            classId: gi2.class_id,
          });
          return;
        }
        const activationUrl = buildInviteActivationUrl(classInv.token);
        const parts = buildGroupInviteMailPartsPendingUser({
          groupName,
          classCode,
          activationUrl,
        });
        subject = parts.subject;
        text = parts.text;
        html = parts.html;
      }

      try {
        await email.send({
          to,
          subject,
          text,
          html,
          headers: { [MAIL_HEADER_GROUP_INVITE_ID]: String(groupInviteId) },
        });
        await transaction.run(async (conn) => {
          await inboxRepository.insertWithConn(conn, {
            idempotencyKey: key,
            outboxId: outboxDbId,
            inviteId: null,
            groupInviteId,
          });
          await conn.execute(
            `UPDATE group_invites SET email_delivery_status = 'sent', email_sent_at = NOW(), email_last_error = NULL WHERE id = ?`,
            [groupInviteId]
          );
        });
        logger.info("[OutboxMailWorker] group invite email sent", {
          groupInviteId,
          outboxId: outboxDbId,
          publicId,
          to: maskEmail(to),
        });
      } catch (err) {
        const msg = String(err?.message || err).slice(0, 500);
        const attempts = (Number(gi2.email_attempts) || 0) + 1;
        const terminal = attempts >= maxA;
        const backoffMin = Math.min(60, 2 ** Math.min(attempts, 6));
        const nextRetry = terminal ? null : new Date(Date.now() + backoffMin * 60 * 1000);
        await db.execute(
          `UPDATE group_invites SET email_delivery_status = 'failed', email_last_error = ?, email_attempts = ?, email_next_retry_at = ?
           WHERE id = ?`,
          [msg, attempts, nextRetry, groupInviteId]
        );
        logger.error("[OutboxMailWorker] group invite email failed", {
          groupInviteId,
          outboxId: outboxDbId,
          publicId,
          to: maskEmail(to),
          attempts,
          terminal,
          err: msg,
        });
      }
    };

    if (!stopped && groupInviteIds.length > 0) {
      const limit = pLimit(concurrency);
      await Promise.all(groupInviteIds.map((id) => limit(() => processSingleGroupInvite(id))));
      const [rows] = await db.execute(
        `SELECT email_delivery_status AS s, COUNT(*) AS c FROM group_invites WHERE outbox_id = ? GROUP BY email_delivery_status`,
        [outboxDbId]
      );
      await publishProgressFromRows(redis, progressPublicId, outboxDbId, rows);
    }

    const [leftRows] = await db.execute(
      `SELECT COUNT(*) AS n FROM group_invites WHERE outbox_id = ?
       AND NOT (
         email_delivery_status = 'sent'
         OR (email_delivery_status = 'failed' AND email_attempts >= ?)
       )`,
      [outboxDbId, maxA]
    );
    const left = Number(leftRows[0]?.n) || 0;

    if (left === 0) {
      await transaction.run(async (conn) => {
        await outboxRepository.markDone(conn, outboxDbId);
      });
      eventBus.emit(Events.MAIL_DISPATCH_COMPLETED, {
        publicId: progressPublicId,
        outboxId: outboxDbId,
        groupId: payload?.groupId,
        classId: payload?.classId,
      });
      logger.info("[OutboxMailWorker] group-invite outbox completed", { publicId, outboxId: outboxDbId });
    } else {
      await schedulePartialRetry(outboxDbId);
    }

    const [rows2] = await db.execute(
      `SELECT email_delivery_status AS s, COUNT(*) AS c FROM group_invites WHERE outbox_id = ? GROUP BY email_delivery_status`,
      [outboxDbId]
    );
    await publishProgressFromRows(redis, progressPublicId, outboxDbId, rows2);
  };

  const POLL_LOCK_KEY = "ehub:outbox:mail:poll";
  const POLL_LOCK_RELEASE = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`;

  const processOneOutbox = async () => {
    let lockToken = null;
    const lockTtl = Math.max(10, Number(cfg.redisPollLockTtlSec) || 90);
    const maxRowsPerTick = Math.max(1, Math.min(20, Number(cfg.maxRowsPerTick) || 5));
    if (redis) {
      lockToken = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const ok = await redis.set(POLL_LOCK_KEY, lockToken, "EX", lockTtl, "NX");
      if (ok !== "OK") return;
    }
    try {
      await db.execute(
        `UPDATE outbox_events SET status = 'pending',
         last_error = CONCAT(IFNULL(last_error,''), ?)
       WHERE status = 'processing' AND updated_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
        [OUTBOX_MAIL_STALE_RESET_MARKER, cfg.staleProcessingMinutes]
      );

      for (let i = 0; i < maxRowsPerTick && !stopped; i += 1) {
        const [candidates] = await db.execute(
          `SELECT id, public_id, dispatch_public_id, payload, event_type FROM outbox_events
         WHERE status = 'pending' AND event_type IN (?, ?) AND (next_retry_at IS NULL OR next_retry_at <= NOW())
         ORDER BY id ASC LIMIT 1`,
          [OUTBOX_CLASS_INVITE_EMAIL_DISPATCH, OUTBOX_GROUP_INVITE_EMAIL_DISPATCH]
        );
        const cand = candidates[0];
        if (!cand) break;

        const [upd] = await db.execute(
          `UPDATE outbox_events SET status = 'processing', attempts = attempts + 1, updated_at = NOW()
         WHERE id = ? AND status = 'pending'`,
          [cand.id]
        );
        if (!(upd.affectedRows > 0)) continue;

        const payload = parsePayload(cand.payload);

        try {
          if (cand.event_type === OUTBOX_GROUP_INVITE_EMAIL_DISPATCH) {
            await processGroupInviteOutbox(cand, payload);
          } else {
            await processClassInviteOutbox(cand, payload);
          }
        } catch (err) {
          logger.error("[OutboxMailWorker] batch processor error", { err, outboxId: cand.id, eventType: cand.event_type });
          await db.execute(
            `UPDATE outbox_events SET status = 'pending', next_retry_at = DATE_ADD(NOW(), INTERVAL 2 MINUTE), last_error = ? WHERE id = ?`,
            [String(err?.message || err).slice(0, 500), cand.id]
          );
        }
      }
    } finally {
      if (redis && lockToken) {
        try {
          await redis.eval(POLL_LOCK_RELEASE, 1, POLL_LOCK_KEY, lockToken);
        } catch (err) {
          logger.warn("[OutboxMailWorker] poll lock release failed", { err });
        }
      }
    }
  };

  const tick = () => {
    if (stopped) return;
    const run = processOneOutbox().catch((err) => logger.error("[OutboxMailWorker] tick error", { err }));
    inFlight.add(run);
    run.finally(() => inFlight.delete(run));
  };

  timer = setInterval(tick, cfg.pollMs);
  tick();

  return async () => {
    stopped = true;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    const grace = Math.max(0, Number(cfg.workerShutdownGraceMs) || 25_000);
    if (inFlight.size === 0) return;
    await Promise.race([
      Promise.allSettled([...inFlight]),
      new Promise((resolve) => setTimeout(resolve, grace)),
    ]);
  };
};
