import { booleanYesNoOptions, deadlineFilterOptions, statusOptions } from "@/utils/i18nOptions";

export { toSelectOptions } from "@/utils/i18nOptions";

export const pageLimit = 10;

export { formatDate, formatDateOnly } from "@/utils/dateTimeDisplay";

export const toDateTimeInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const buildClassLabel = (cls) =>
  `${cls.class_code}${cls.class_name ? ` - ${cls.class_name}` : ""} · ${cls.semester_code || ""}`;

export const getCheckpointStatusOptions = (t) =>
  statusOptions(t, ["", "draft", "open", "closed", "archived"]);

export const getAssignmentStatusOptions = (t) =>
  statusOptions(t, ["", "open", "closed", "archived"]);

export const getSubmissionStatusOptions = (t) =>
  statusOptions(t, ["", "not_submitted", "submitted", "resubmitted", "pending_grading", "graded"]);

export const getDeadlineOptions = (t) => deadlineFilterOptions(t);
export const getBooleanOptions = (t) => booleanYesNoOptions(t);

export const getFileSourceOptions = (t) =>
  statusOptions(t, ["", "checkpoint", "assignment"]);

export const getDeadlineState = (deadline, status) => {
  if (status === "closed" || status === "archived") return "closed";
  if (!deadline) return "unknown";
  return new Date(deadline).getTime() < Date.now() ? "overdue" : "open";
};

export const formatBytes = (value) => {
  const size = Number(value || 0);
  if (!size) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};
