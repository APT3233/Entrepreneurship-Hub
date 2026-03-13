/**
 * Mock data cho trang lecture/classes — bám theo schema DB (classes, subjects, semesters, class_students, groups).
 * Dùng cho development / demo. Khi gắn API thay bằng data từ server.
 */

// Mã học phần (subjects) — bảng subjects
const SUBJECTS = [
  { id: 1, subject_code: "EXE101", subject_name: "Experiential Entrepreneurship 1" },
  { id: 2, subject_code: "EXE201", subject_name: "Experiential Entrepreneurship 2" },
  { id: 3, subject_code: "PRJ301", subject_name: "Project 301" },
];

// Học kỳ (semesters) — bảng semesters
const SEMESTERS = [
  { id: 1, semester_code: "SP2026", semester_name: "Spring", year: 2026 },
  { id: 2, semester_code: "SU2026", semester_name: "Summer", year: 2026 },
  { id: 3, semester_code: "FA2025", semester_name: "Fall", year: 2025 },
];

/**
 * Danh sách lớp (classes) — mỗi lớp gắn subject + semester.
 * Các field tương ứng: classes.class_code, subject_id, semester_id; đếm students/groups từ class_students & groups.
 */
export const mockClasses = [
  {
    id: 1,
    code: "GD18D01",
    subject: "EXE101 - Học kì Spring 2026",
    subject_id: 1,
    semester_id: 1,
    students: 32,
    groups: 6,
    completion: 85,
    avatars: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
    ],
  },
  {
    id: 2,
    code: "GD18D02",
    subject: "EXE101 - Học kì Spring 2026",
    subject_id: 1,
    semester_id: 1,
    students: 38,
    groups: 7,
    completion: 72,
    avatars: [],
  },
  {
    id: 3,
    code: "GD18D03",
    subject: "EXE201 - Học kì Fall 2025",
    subject_id: 2,
    semester_id: 3,
    students: 35,
    groups: 6,
    completion: 91,
    avatars: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=a",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=b",
    ],
  },
  {
    id: 4,
    code: "SE1856",
    subject: "PRJ301 - Học kì Summer 2026",
    subject_id: 3,
    semester_id: 2,
    students: 28,
    groups: 5,
    completion: 64,
    avatars: [],
  },
];

/**
 * Số liệu thống kê tổng (tương ứng aggregate từ classes + groups + assignments/grading).
 */
export const mockStats = {
  classCount: mockClasses.length,
  groupCount: 12,
  assignmentCount: 3,
  needGradingCount: 3,
};

/**
 * Options cho dropdown Năm — từ semesters.year
 */
export const mockYearOptions = [
  { label: "2025", value: 2025 },
  { label: "2026", value: 2026 },
];

/**
 * Options cho dropdown Kỳ — từ semesters.semester_name
 */
export const mockSemesterOptions = [
  { label: "Spring", value: "Spring" },
  { label: "Summer", value: "Summer" },
  { label: "Fall", value: "Fall" },
];

/**
 * Options cho dropdown Tất cả lớp — từ classes.class_code
 */
export const mockClassFilterOptions = [
  { label: "Tất cả lớp", value: "all" },
  ...mockClasses.map((c) => ({ label: c.code, value: c.code })),
];

/**
 * Chi tiết từng lớp — cho trang /lecturer/classes/:id
 * Gồm: classCode, subject, lecturer, semester, studentCount, groupCount, assignmentCount, needGradingCount, students, groups (options filter)
 */
const mockClassDetails = {
  1: {
    classCode: "GD18D01",
    subject: "EXE404",
    lecturer: "TS. Nguyễn Văn B",
    semester: "Fall 2026",
    studentCount: 14,
    groupCount: 6,
    assignmentCount: 3,
    needGradingCount: 3,
    groups: [
      { id: 1, name: "Alpha" },
      { id: 2, name: "Beta" },
      { id: 3, name: "Gammar" },
    ],
    students: [
      { id: 1, mssv: "DE180180", name: "Nguyễn Văn A", email: "nguyenvana@gmail.com", major: "IT", isLeader: true, groupId: 1 },
      { id: 2, mssv: "DE189283", name: "Nguyễn Văn C", email: "nguyenvanc@gmail.com", major: "IT", isLeader: false, groupId: 2 },
      { id: 3, mssv: "DS189273", name: "Trần Huy B", email: "tranhuyB@gmail.com", major: "Kinh tế", isLeader: false, groupId: 1 },
      { id: 4, mssv: "DS189273", name: "Lê Thị V", email: "Lethiv@gmail.com", major: "Kinh tế", isLeader: false, groupId: 1 },
      { id: 5, mssv: "DE189283", name: "Huỳnh Lê C", email: "HuynhleC@gmail.com", major: "Design", isLeader: false, groupId: 2 },
      { id: 6, mssv: "DS189263", name: "Lê Ngọc H", email: "lengoch@gmail.com", major: "Design", isLeader: false, groupId: 3 },
      { id: 7, mssv: "SE170001", name: "Phạm Minh K", email: "phamminhk@gmail.com", major: "IT", isLeader: false, groupId: 1 },
      { id: 8, mssv: "SE170002", name: "Hoàng Thu L", email: "hoangthul@gmail.com", major: "Design", isLeader: false, groupId: 2 },
      // Sinh viên chưa có nhóm — dùng để test modal "Tạo nhóm mới"
      { id: 9, mssv: "DE180301", name: "Võ Minh M", email: "vominhm@gmail.com", major: "IT" },
      { id: 13, mssv: "DS180401", name: "Ngô Thị N", email: "ngothin@gmail.com", major: "Kinh tế" },
      { id: 14, mssv: "DE180502", name: "Đinh Văn P", email: "dinhvanp@gmail.com", major: "Design" },
      { id: 15, mssv: "SE180603", name: "Bùi Thị Q", email: "buithiq@gmail.com", major: "IT" },
      { id: 16, mssv: "DS180704", name: "Trương Văn R", email: "truongvanr@gmail.com", major: "Kinh tế" },
      { id: 17, mssv: "DE180805", name: "Lý Thị S", email: "lythis@gmail.com", major: "Design" },
    ],
  },
  2: {
    classCode: "GD18D02",
    subject: "EXE101",
    lecturer: "TS. Nguyễn Văn B",
    semester: "Spring 2026",
    studentCount: 38,
    groupCount: 7,
    assignmentCount: 2,
    needGradingCount: 5,
    groups: [{ id: 1, name: "G01" }, { id: 2, name: "G02" }, { id: 3, name: "G03" }, { id: 4, name: "G04" }, { id: 5, name: "G05" }, { id: 6, name: "G06" }, { id: 7, name: "G07" }],
    students: [
      { id: 10, mssv: "DE180200", name: "Trần Văn D", email: "tranvand@gmail.com", major: "IT", isLeader: true, groupId: 1 },
      { id: 11, mssv: "DE180201", name: "Lê Thị E", email: "lethie@gmail.com", major: "Kinh tế", isLeader: false, groupId: 1 },
      { id: 12, mssv: "DE180202", name: "Phan Văn F", email: "phanvanf@gmail.com", major: "Design", isLeader: false, groupId: 2 },
    ],
  },
  3: {
    classCode: "GD18D03",
    subject: "EXE201",
    lecturer: "TS. Nguyễn Văn B",
    semester: "Fall 2025",
    studentCount: 35,
    groupCount: 6,
    assignmentCount: 4,
    needGradingCount: 2,
    groups: [{ id: 1, name: "G01" }, { id: 2, name: "G02" }, { id: 3, name: "G03" }, { id: 4, name: "G04" }, { id: 5, name: "G05" }, { id: 6, name: "G06" }],
    students: [
      { id: 20, mssv: "SE185001", name: "Ngô Văn G", email: "ngovang@gmail.com", major: "IT", isLeader: true, groupId: 1 },
      { id: 21, mssv: "SE185002", name: "Võ Thị H", email: "vothih@gmail.com", major: "Kinh tế", isLeader: false, groupId: 1 },
      { id: 22, mssv: "SE185003", name: "Đặng Văn I", email: "dangvani@gmail.com", major: "IT", isLeader: false, groupId: 2 },
    ],
  },
  4: {
    classCode: "SE1856",
    subject: "PRJ301",
    lecturer: "TS. Nguyễn Văn B",
    semester: "Summer 2026",
    studentCount: 28,
    groupCount: 5,
    assignmentCount: 3,
    needGradingCount: 4,
    groups: [{ id: 1, name: "G01" }, { id: 2, name: "G02" }, { id: 3, name: "G03" }, { id: 4, name: "G04" }, { id: 5, name: "G05" }],
    students: [
      { id: 30, mssv: "HE170010", name: "Bùi Văn J", email: "buivanj@gmail.com", major: "IT", isLeader: true, groupId: 1 },
      { id: 31, mssv: "HE170011", name: "Đinh Thị K", email: "dinhthik@gmail.com", major: "Design", isLeader: false, groupId: 2 },
    ],
  },
};

/**
 * Lấy chi tiết lớp theo id (cho trang chi tiết). Trả về null nếu không tồn tại.
 */
export function getClassDetail(id) {
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId < 1) return null;
  return mockClassDetails[numId] ?? null;
}
