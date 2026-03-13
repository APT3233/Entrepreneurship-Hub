/**
 * Mock data cho trang lecture/groups — thống kê, danh sách nhóm, options filter.
 * Dùng cho development / demo. Khi gắn API thay bằng data từ server.
 */

export const mockStats = {
  classCount: 2,
  assignmentCount: 3,
  groupCount: 12,
  needGradingCount: 3,
};

/**
 * Tính trạng thái nhóm từ majors (đồng bộ với logic trong GroupCard).
 * @returns {"eligible"|"warning"|"ineligible"}
 */
export function calcGroupStatus(majors) {
  if (!Array.isArray(majors)) return "ineligible";
  const missing = majors.filter((m) => m.count === 0);
  const underMin = majors.filter((m) => m.count > 0 && m.count < (m.minRequired ?? 1));
  if (missing.length > 0) return "ineligible";
  if (underMin.length > 0) return "warning";
  return "eligible";
}

/**
 * Danh sách nhóm — mỗi item có id, name, classCode, members, majors, avatars, semester.
 */
export const mockGroups = [
  {
    id: 1,
    name: "Nhóm Alpha",
    classCode: "GD18D01",
    members: 6,
    semester: "Spring",
    semesterId: 1,
    majors: [
      { name: "Design", count: 1, minRequired: 1 },
      { name: "IT", count: 3, minRequired: 1 },
      { name: "Kinh tế", count: 2, minRequired: 1 },
    ],
    avatars: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=a1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=a2",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=a3",
    ],
  },
  {
    id: 2,
    name: "Nhóm Beta",
    classCode: "GD18D02",
    members: 5,
    semester: "Spring",
    semesterId: 1,
    majors: [
      { name: "Design", count: 2, minRequired: 1 },
      { name: "IT", count: 0, minRequired: 1 },
      { name: "Kinh tế", count: 3, minRequired: 1 },
    ],
    avatars: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=b1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=b2",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=b3",
    ],
  },
  {
    id: 3,
    name: "Nhóm Gamma",
    classCode: "GD18D03",
    members: 3,
    semester: "Fall",
    semesterId: 3,
    majors: [
      { name: "Design", count: 2, minRequired: 1 },
      { name: "IT", count: 0, minRequired: 1 },
      { name: "Kinh tế", count: 1, minRequired: 1 },
    ],
    avatars: [],
  },
];

/** Options dropdown Tất cả lớp */
export const mockClassOptions = [
  { label: "Tất cả lớp", value: "all" },
  ...[...new Set(mockGroups.map((g) => g.classCode))].map((code) => ({ label: code, value: code })),
];

/** Options dropdown Tất cả trạng thái */
export const mockStatusOptions = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Đủ điều kiện", value: "eligible" },
  { label: "Cần kiểm tra", value: "warning" },
  { label: "Chưa đủ điều kiện", value: "ineligible" },
];

/** Options dropdown Học kì */
export const mockSemesterOptions = [
  { label: "Tất cả kỳ", value: "all" },
  { label: "Spring", value: "Spring" },
  { label: "Summer", value: "Summer" },
  { label: "Fall", value: "Fall" },
];
