import { statusOptions } from "@/utils/i18nOptions";

export { toSelectOptions } from "@/utils/i18nOptions";

export { formatDate, formatDateOnly, formatDateOnlyText } from "@/utils/dateTimeDisplay";
export const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export const pageLimit = 10;

export const getSubjectStatusOptions = (t) => statusOptions(t, ["", "active", "inactive"]);
export const getSemesterStatusOptions = (t) => statusOptions(t, ["", "upcoming", "ongoing", "completed"]);
export const getClassStatusOptions = (t) => statusOptions(t, ["", "draft", "active", "completed", "archived"]);
