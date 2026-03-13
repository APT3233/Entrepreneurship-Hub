/**
 * Dashboard — data reset để gắn API backend.
 * Thay mock bằng state + fetch từ API (vd: GET /api/v1/lecturer/dashboard?year=&semester=).
 *
 * Shape API gợi ý:
 * - stats: { classCount, groupCount, assignmentCount, needGradingCount }
 * - yearOptions, semesterOptions: [{ label, value }]
 * - recentClasses: [{ id, code, studentCount, groupCount }]
 * - groupStatus: { eligible, needsReview, ineligible }
 * - assignmentStatus: { submitted, pending, late }, assignmentUnit: "%" | "bài"
 * - gradingOverviewItems: [{ label, count, percent, note, color }]
 */

/** Số liệu 4 thẻ — trả về từ API, tạm 0 */
export const mockStats = {
  classCount: 0,
  groupCount: 0,
  assignmentCount: 0,
  needGradingCount: 0,
};

/** Options dropdown — có thể lấy từ API (semesters) */
export const mockYearOptions = [
  { label: "2025", value: 2025 },
  { label: "2026", value: 2026 },
];

export const mockSemesterOptions = [
  { label: "Spring", value: "Spring" },
  { label: "Summer", value: "Summer" },
  { label: "Fall", value: "Fall" },
];

/** Lớp học gần đây — API trả về [], tạm reset */
export const mockRecentClasses = [];

/** Trạng thái nhóm — API trả về, tạm 0 */
export const mockGroupStatus = {
  eligible: 0,
  needsReview: 0,
  ineligible: 0,
};

/** Trạng thái bài tập — API trả về, tạm 0 */
export const mockAssignmentStatus = {
  submitted: 0,
  pending: 0,
  late: 0,
};

export const mockAssignmentUnit = "%";

/** Tổng quan chấm điểm — API trả về [], tạm reset */
export const mockGradingOverviewItems = [];
