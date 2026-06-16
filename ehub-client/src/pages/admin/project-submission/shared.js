import { booleanYesNoOptions, deadlineFilterOptions, statusOptions } from "@/utils/i18nOptions";
import { toDatetimeLocalInput, resolveCheckpointOpenAt } from "@/utils/formatDateTime";

export { toSelectOptions } from "@/utils/i18nOptions";

export const pageLimit = 10;

export { formatDate, formatDateOnly } from "@/utils/dateTimeDisplay";

export const toDateTimeInputValue = toDatetimeLocalInput;

export const toCheckpointOpenAtInput = (checkpoint) =>
  toDatetimeLocalInput(resolveCheckpointOpenAt(checkpoint));

export { resolveCheckpointOpenAt };

/**
 * Fetch all pages for admin list endpoints (respecting backend max limit=100).
 * @param {(query: any) => Promise<any>} listFn - service.list(query) returning axios response { data, meta }
 * @param {Record<string, any>} query
 */
export async function fetchAllAdminRows(listFn, query) {
  const all = [];
  let page = 1;
  const limit = 100;
  // Avoid infinite loops on bad meta
  for (let i = 0; i < 200; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await listFn({ ...(query || {}), page, limit });
    const rows = res?.data || [];
    all.push(...rows);
    const totalPages = Number(res?.meta?.totalPages || res?.meta?.total_pages || 1);
    if (!rows.length || page >= totalPages) break;
    page += 1;
  }
  return all;
}

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
