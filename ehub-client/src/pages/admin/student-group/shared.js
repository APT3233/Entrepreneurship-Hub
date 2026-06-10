import { statusOptions } from "@/utils/i18nOptions";

export { toSelectOptions } from "@/utils/i18nOptions";

export const pageLimit = 10;

export { formatDate, formatDateOnly } from "@/utils/dateTimeDisplay";

export const getStudentStatusOptions = (t) =>
  statusOptions(t, ["", "active", "inactive", "graduated", "suspended", "pending"]);

export const getEnrollmentStatusOptions = (t) =>
  statusOptions(t, ["", "enrolled", "dropped", "completed"]);

export const getGroupStatusOptions = (t) =>
  statusOptions(t, ["", "forming", "active", "inactive", "completed", "dissolved"]);

export const getInviteStatusOptions = (t) =>
  statusOptions(t, ["", "pending", "accepted", "declined", "expired", "revoked"]);

export const getIssueTypeOptions = (t) =>
  statusOptions(t, ["", "group_name", "category", "topic", "member", "other"]);

export const buildClassLabel = (cls) =>
  `${cls.class_code}${cls.class_name ? ` - ${cls.class_name}` : ""} · ${cls.semester_code || ""}`;

export const buildStudentLabel = (student) =>
  `${student.student_code} - ${student.full_name}${student.email ? ` (${student.email})` : ""}`;

export const parseGroupSummaries = (value) => {
  if (!value) return [];
  return String(value)
    .split("||")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [name, status = "unknown"] = item.split("::");
      return { name: name?.trim() || "—", status: status?.trim() || "unknown" };
    });
};

export const getShortClassCode = (classCode, semesterCode) => {
  if (classCode && semesterCode && classCode.endsWith(`-${semesterCode}`)) {
    return classCode.slice(0, -(semesterCode.length + 1));
  }
  return classCode;
};

export const CAMPUS_OPTIONS = [
  { value: "Hà Nội", label: "Hà Nội" },
  { value: "Hồ Chí Minh", label: "Hồ Chí Minh" },
  { value: "Đà Nẵng", label: "Đà Nẵng" },
  { value: "Quy Nhơn", label: "Quy Nhơn" },
  { value: "Cần Thơ", label: "Cần Thơ" },
];

export const MAJOR_OPTIONS = [
  { value: "Kỹ thuật phần mềm", label: "Kỹ thuật phần mềm (Software Engineering)" },
  { value: "Thiết kế mỹ thuật số", label: "Thiết kế mỹ thuật số (Digital Art Design)" },
  { value: "An toàn thông tin", label: "An toàn thông tin (Information Assurance)" },
  { value: "Quản trị kinh doanh", label: "Quản trị kinh doanh (Business Administration)" },
  { value: "Truyền thông đa phương tiện", label: "Truyền thông đa phương tiện (Multimedia)" },
];
