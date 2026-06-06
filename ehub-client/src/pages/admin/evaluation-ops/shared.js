import { booleanYesNoOptions, httpMethodOptions, statusOptions } from "@/utils/i18nOptions";

export { toSelectOptions } from "@/utils/i18nOptions";

export const pageLimit = 10;

export { formatDate, formatDateOnly, formatDateTimeText } from "@/utils/dateTimeDisplay";
export const formatPercent = (value) => value === null || value === undefined ? "—" : `${Number(value).toFixed(1)}%`;
export const formatScore = (score, maxScore) => {
  if (score === null || score === undefined) return "—";
  return maxScore ? `${Number(score).toFixed(2)} / ${Number(maxScore).toFixed(2)}` : Number(score).toFixed(2);
};

export const getSourceTypeOptions = (t) => statusOptions(t, ["", "checkpoint", "assignment"]);
export const getResultStatusOptions = (t) =>
  statusOptions(t, ["", "submitted", "resubmitted", "graded", "not_submitted"]);
export const getRubricTypeOptions = (t) => statusOptions(t, ["", "checkpoint", "assignment", "final"]);
export const getRubricStatusOptions = (t) => statusOptions(t, ["", "draft", "active", "archived"]);
export const getInvitationTypeOptions = (t) =>
  statusOptions(t, ["", "class_invite", "group_invite", "email_event"]);
export const getImportStatusOptions = (t) =>
  statusOptions(t, ["", "processing", "completed", "failed", "cancelled"]);
export const getMethodOptions = (t) => httpMethodOptions(t);
export const getBooleanOptions = (t) => booleanYesNoOptions(t);

export const getInvitationStatusOptions = (t) =>
  statusOptions(t, ["", "pending", "used", "accepted", "declined", "expired", "revoked", "failed", "dead"]);

export const getEmailDeliveryStatusOptions = (t) =>
  statusOptions(t, ["", "queued", "sending", "sent", "failed", "pending", "processing", "done", "dead"]);

export const buildClassLabel = (cls) =>
  `${cls.class_code}${cls.class_name ? ` - ${cls.class_name}` : ""}${cls.semester_code ? ` · ${cls.semester_code}` : ""}`;
