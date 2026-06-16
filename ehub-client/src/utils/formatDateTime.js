export function parseDate(value) {
  if (!value) return null;
  let date;
  if (typeof value === "string") {
    // If it's a MySQL format "YYYY-MM-DD HH:mm:ss" without offset, treat it as UTC
    if (!value.endsWith("Z") && !value.includes("+") && !/-\d{2}:\d{2}$/.test(value)) {
      const isoStr = value.replace(" ", "T");
      date = new Date(isoStr.endsWith("Z") ? isoStr : `${isoStr}Z`);
    } else {
      date = new Date(value);
    }
  } else {
    date = new Date(value);
  }
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getLocale(language) {
  return language === "en" ? "en-US" : "vi-VN";
}

export function getDateLine(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getTimeLine(date, language = "vi") {
  return new Intl.DateTimeFormat(getLocale(language), {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

export function getDateTimeParts(value, language = "vi") {
  const date = parseDate(value);
  if (!date) return null;
  return {
    dateLine: getDateLine(date),
    timeLine: getTimeLine(date, language),
  };
}

export function getDateOnlyParts(value, language = "vi") {
  const date = parseDate(value);
  if (!date) return null;
  return {
    dateLine: getDateLine(date),
    timeLine: null,
  };
}

/** Plain string for labels, DetailGrid, template literals. */
export function formatDateOnlyText(value, language = "vi") {
  return getDateOnlyParts(value, language)?.dateLine ?? "—";
}

export function formatDateTimeText(value, language = "vi") {
  const parts = getDateTimeParts(value, language);
  if (!parts) return "—";
  return `${parts.dateLine} ${parts.timeLine}`;
}

export function toDatetimeLocalInput(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** NULL open_at + status open => effective open time is created_at (schema: NULL = mở ngay). */
export function resolveCheckpointOpenAt(checkpoint) {
  if (!checkpoint) return null;
  if (checkpoint.open_at) return checkpoint.open_at;
  if (checkpoint.status === "open" && checkpoint.created_at) return checkpoint.created_at;
  return null;
}
