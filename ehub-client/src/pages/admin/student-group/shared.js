import { statusOptions } from "@/utils/i18nOptions";

export { toSelectOptions } from "@/utils/i18nOptions";

export const pageLimit = 10;

export { formatDate, formatDateOnly } from "@/utils/dateTimeDisplay";

export const getStudentStatusOptions = (t) =>
  statusOptions(t, ["", "active", "inactive", "graduated", "suspended", "pending"]);

export const getEnrollmentStatusOptions = (t) =>
  statusOptions(t, ["", "enrolled", "dropped", "completed"]);

export const getGroupStatusOptions = (t) =>
  statusOptions(t, ["", "forming", "active", "inactive", "completed", "dissolved"]);

export const getInviteStatusOptions = (t) =>
  statusOptions(t, ["", "pending", "accepted", "declined", "expired", "revoked"]);

export const getIssueTypeOptions = (t) =>
  statusOptions(t, ["", "group_name", "category", "topic", "member", "other"]);

export const buildClassLabel = (cls) =>
  `${cls.class_code}${cls.class_name ? ` - ${cls.class_name}` : ""} · ${cls.semester_code || ""}`;

export const buildStudentLabel = (student) =>
  `${student.student_code} - ${student.full_name}${student.email ? ` (${student.email})` : ""}`;
