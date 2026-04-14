/**
 * Hằng số dùng chung cho outbox mail worker, Redis pub/sub tiến độ gửi mail, SMTP headers.
 */

/** Redis channel: `ehub:mail:{publicId}` — worker publish + SSE subscribe */
export const MAIL_DISPATCH_REDIS_CHANNEL_PREFIX = "ehub:mail:";
export const mailDispatchRedisChannel = (publicId) =>
  `${MAIL_DISPATCH_REDIS_CHANNEL_PREFIX}${publicId}`;

/** Khóa idempotency trong `inbox_events` sau SMTP thành công */
export const inboxIdempotencyKeyInviteSmtp = (inviteId) => `invite_smtp:${inviteId}`;
export const inboxIdempotencyKeyGroupInviteSmtp = (groupInviteId) =>
  `group_invite_smtp:${groupInviteId}`;

/** Header tùy chọn để trace log phía provider */
export const MAIL_HEADER_INVITE_ID = "X-EHUB-Invite-Id";
export const MAIL_HEADER_GROUP_INVITE_ID = "X-EHUB-Group-Invite-Id";

/** Ghi vào `outbox_events.last_error` khi batch chưa xong hết */
export const OUTBOX_MAIL_LAST_ERROR_PARTIAL_BATCH = "partial_batch_pending";

/** Nối vào `last_error` khi reset job processing quá lâu (stale) */
export const OUTBOX_MAIL_STALE_RESET_MARKER = " [stale-reset]";

/** `group_invites.email_last_error` — bỏ qua gửi mail vì invite không còn pending */
export const GROUP_INVITE_EMAIL_SKIP_NOT_PENDING = "skipped_invite_not_pending";

/** TH1: không có dòng `class_invites` pending để lấy link kích hoạt */
export const GROUP_INVITE_EMAIL_ERR_NO_CLASS_INVITE = "no_pending_class_invite_for_activation";
