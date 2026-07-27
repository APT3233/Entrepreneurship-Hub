/**
 * Giá trị cột `outbox_events.event_type` dùng cho pipeline gửi mail (worker + transaction).
 * @see mailPipeline.js — Redis channel, idempotency key SMTP, header mail.
 */
export const OUTBOX_CLASS_INVITE_EMAIL_DISPATCH = "CLASS_INVITE_EMAIL_DISPATCH";
export const OUTBOX_GROUP_INVITE_EMAIL_DISPATCH = "GROUP_INVITE_EMAIL_DISPATCH";
/** Thông báo nghiệp vụ mentor (phân công, phản hồi, lịch mentoring, duyệt hồ sơ) — gửi một lần, không theo dõi từng người nhận. */
export const OUTBOX_MENTOR_NOTIFICATION_EMAIL_DISPATCH = "MENTOR_NOTIFICATION_EMAIL_DISPATCH";
