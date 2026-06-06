export const pageLimit = 10;

export const formatScore = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return Number(value).toFixed(2);
};

export const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return `${Number(value).toFixed(1)}%`;
};

export const formatHours = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return `${Number(value).toFixed(1)}h`;
};

export const toOptionList = (rows = [], valueFn, labelFn, allLabel) => [
  { value: "", label: allLabel },
  ...rows.map((row) => ({ value: String(valueFn(row)), label: labelFn(row) })),
];

export const buildClassLabel = (item) =>
  `${item.class_code}${item.class_name ? ` - ${item.class_name}` : ""}${item.semester_code ? ` · ${item.semester_code}` : ""}`;

export const exportRowsToCsv = (fileName, rows = []) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => escape(row[key])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const hasRows = (rows) => Array.isArray(rows) && rows.length > 0;
