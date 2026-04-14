/**
 * Giá trị cột `outbox_events.event_type` dùng cho pipeline gửi mail (worker + transaction).
 * @see mailPipeline.js — Redis channel, idempotency key SMTP, header mail.
 */
export const OUTBOX_CLASS_INVITE_EMAIL_DISPATCH = "CLASS_INVITE_EMAIL_DISPATCH";
export const OUTBOX_GROUP_INVITE_EMAIL_DISPATCH = "GROUP_INVITE_EMAIL_DISPATCH";
