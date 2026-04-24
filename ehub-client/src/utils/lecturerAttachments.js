/** Parse cột DB: một URL thẳng, hoặc chuỗi JSON mảng URL. */
export function parseLecturerAttachmentUrls(raw) {
  if (raw == null || raw === "") return [];
  const s = String(raw).trim();
  if (s.startsWith("[")) {
    try {
      const p = JSON.parse(s);
      return Array.isArray(p) ? p.map(String).filter(Boolean) : [];
    } catch {
      return s ? [s] : [];
    }
  }
  return s ? [s] : [];
}

/** Lưu mảng URL vào DB (JSON). */
export function serializeLecturerAttachmentUrls(urls) {
  const u = (urls || []).map(String).filter(Boolean);
  if (u.length === 0) return "";
  return JSON.stringify(u);
}

export const LECTURER_ATTACH_MAX_FILES = 5;
export const LECTURER_ATTACH_MAX_BYTES = 25 * 1024 * 1024;
