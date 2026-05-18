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

/**
 * Tên file hiển thị từ URL đính kèm.
 * Hỗ trợ proxy dạng /api/v1/files/download?path=...&name=real.docx (không lấy segment "download").
 */
export function getAttachmentDisplayFileName(url = "") {
  const raw = String(url).trim();
  if (!raw) return "";

  try {
    const base =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost";
    const u = new URL(raw, base);
    const nameParam = u.searchParams.get("name");
    if (nameParam) {
      const n = decodeURIComponent(nameParam.replace(/\+/g, " "));
      return n.replace(/^\d+_/, "") || n;
    }
    const pathParam = u.searchParams.get("path");
    if (pathParam) {
      const decoded = decodeURIComponent(pathParam.replace(/\+/g, " "));
      const seg = decoded.split("/").pop() || "";
      if (seg) return seg.replace(/^\d+_/, "");
    }
  } catch {
    /* fall through */
  }

  const fileWithQuery = raw.split("/").pop() || "";
  const fileName = decodeURIComponent((fileWithQuery.split("?")[0] || "").replace(/\+/g, " "));
  return (fileName || "file").replace(/^\d+_/, "");
}
