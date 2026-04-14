/**
 * MSSV định dạng phổ biến (VD: DE123456, DS180001): 2 chữ cái + 4–10 chữ số.
 * Không coi là MSSV nếu có @ (email giảng viên).
 */
export function isWellFormedStudentCode(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s.includes("@")) return false;
  return /^[A-Za-z]{2}\d{4,10}$/.test(s);
}
