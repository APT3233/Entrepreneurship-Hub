export const parseJsonValue = (value, fallback = null) => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const toJsonString = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};

export const sanitizeDocument = (document) => {
  if (!document) return null;
  const { file_path: _filePath, ...safe } = document;
  return safe;
};

export const normalizeStartupRow = (row) => row ? ({
  ...row,
  technology_tags: parseJsonValue(row.technology_tags, []),
  selected_score: row.selected_score === null || row.selected_score === undefined ? null : Number(row.selected_score),
  founder_count: Number(row.founder_count || 0),
  document_count: Number(row.document_count || 0),
  milestone_count: Number(row.milestone_count || 0),
}) : null;

export const normalizeHistoryRow = (row) => row ? ({
  ...row,
  old_values: parseJsonValue(row.old_values, null),
  new_values: parseJsonValue(row.new_values, null),
}) : null;
