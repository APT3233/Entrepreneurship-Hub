
export const ALLOWED_EXT = [".xls", ".xlsx", ".csv"];

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getFileExt(name) {
  if (!name) return "";
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

export function normalizeHeader(raw) {
  if (!raw) return "";
  return String(raw).trim().toLowerCase().replace(/\s+/g, "");
}

export const HeaderAliases = Object.freeze({
  class: ["class", "lớp", "lop"],
  rollnumber: ["rollnumber", "mssv", "mãsinhviên", "masinhvien"],
  email: ["email"],
  membercode: ["membercode", "mãthànhviên", "mathanhvien", "mssv"],
  fullname: ["fullname", "họvàtên", "hovaten", "full_name"],
  major: ["major", "chuyênngành", "chuyennganh", "ngành", "nganh"],
});

export function mapHeaders(headerRow) {
  const map = {};
  headerRow.forEach((h, idx) => {
    const key = normalizeHeader(h);
    if (!key) return;

    // Tìm xem key này thuộc alias nào
    for (const [standardKey, aliases] of Object.entries(HeaderAliases)) {
      if (aliases.includes(key)) {
        map[standardKey] = idx;
        break;
      }
    }
  });
  return map;
}

export function buildStudent(row, headerMap) {
  const get = (key) => {
    const idx = headerMap[key];
    return idx == null ? "" : (row[idx] ?? "").toString().trim();
  };
  return {
    id: `${get("class")}-${get("rollnumber")}-${get("email")}-${get("major")}`,
    classCode: get("class"),
    rollNumber: get("rollnumber"),
    email: get("email"),
    memberCode: get("membercode"),
    fullname: get("fullname"),
    major: get("major"),
  };
}

export function validateStudent(student, index) {
  const errors = [];
  if (!student.classCode) errors.push("Missing class.");
  if (!student.rollNumber) errors.push("Missing roll number.");
  if (!student.email) errors.push("Missing email.");
  else if (!emailRegex.test(student.email)) errors.push("Invalid email format.");
  if (!student.memberCode) errors.push("Missing member code.");
  if (!student.fullname) errors.push("Missing fullname.");
  return {
    index,
    student,
    ok: errors.length === 0,
    messages: errors,
  };
}

