function escapeCell(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

/** @param {{ filename: string, headers: string[], rows: Array<Record<string, unknown> | unknown[]> }} opts */
export function downloadCsv({ filename, headers, rows }) {
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) {
    const cells = Array.isArray(row)
      ? row
      : headers.map((header) => row[header] ?? row[header.toLowerCase()] ?? "");
    lines.push(cells.map(escapeCell).join(","));
  }
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
