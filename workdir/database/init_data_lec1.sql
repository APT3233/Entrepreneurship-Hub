-- =============================================
-- INIT DATA CHO LEC1 — Test API
-- =============================================
-- Tạo ra:
--   Spring 2026: 2 lớp (GD18D01, GD18D02), 40 SV (MSSV 180xxx), 2 nhóm/lớp
--   Summer 2025: 2 lớp (GD18D05, GD18D06), 40 SV (MSSV 182xxx), 2 nhóm/lớp — năm 2025 có ≥2 kỳ
--   Fall 2025:   2 lớp (GD18D03, GD18D04), 40 SV (MSSV 181xxx), 2 nhóm/lớp
-- =============================================
SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci';

-- Lấy id của lec1 (phải tồn tại từ trước)
SET @lec1_id = (SELECT id FROM users WHERE username = 'lec1' LIMIT 1);

-- Đảm bảo có 1 học kỳ (nếu chưa có)
INSERT IGNORE INTO semesters (semester_code, semester_name, year, start_date, end_date, status, created_at, updated_at)
VALUES ('SP2026', 'Spring 2026', 2026, '2026-01-15', '2026-05-20', 'ongoing', NOW(), NOW());
SET @semester_id = (SELECT id FROM semesters WHERE semester_code = 'SP2026' LIMIT 1);

-- Đảm bảo có subject (seed thường đã có EXE101 id=1, EXE201 id=2)
SET @subject1_id = (SELECT id FROM subjects WHERE subject_code = 'EXE101' LIMIT 1);
SET @subject2_id = (SELECT id FROM subjects WHERE subject_code = 'EXE201' LIMIT 1);
SET @subject1_id = IFNULL(@subject1_id, 1);
SET @subject2_id = IFNULL(@subject2_id, 2);

-- -------------------------------------------
-- 1. Hai lớp học — lecturer = lec1
-- -------------------------------------------
INSERT INTO classes (subject_id, semester_id, class_code, class_name, lecturer_id, max_students, min_group_members, max_group_members, status, created_by, created_at, updated_at)
VALUES
  (@subject1_id, @semester_id, 'GD18D01', 'GD18D01', @lec1_id, 40, 4, 6, 'active', @lec1_id, NOW(), NOW()),
  (@subject2_id, @semester_id, 'GD18D02', 'GD18D02', @lec1_id, 40, 4, 6, 'active', @lec1_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE lecturer_id = @lec1_id;

SET @class1_id = (SELECT id FROM classes WHERE class_code = 'GD18D01' AND semester_id = @semester_id LIMIT 1);
SET @class2_id = (SELECT id FROM classes WHERE class_code = 'GD18D02' AND semester_id = @semester_id LIMIT 1);

-- -------------------------------------------
-- 2. 40 sinh viên — mix DE, DS, SE, HE (MSSV)
-- Lớp 1: 20 SV (DE/DS/SE/HE 001-005); Lớp 2: 20 SV (DE/DS/SE/HE 006-010)
-- -------------------------------------------
INSERT INTO students (student_code, full_name, email, major, status, created_at, updated_at) VALUES
('DE180001', 'Nguyễn Văn An',   'de180001@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DE180002', 'Trần Thị Bình',   'de180002@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DE180003', 'Lê Minh Cường',   'de180003@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DE180004', 'Phạm Thu Dung',   'de180004@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('DE180005', 'Hoàng Văn Em',    'de180005@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DS180001', 'Đỗ Thị Phương',   'ds180001@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('DS180002', 'Võ Minh Quân',    'ds180002@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DS180003', 'Bùi Thị Hương',   'ds180003@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('DS180004', 'Đinh Văn Kiên',   'ds180004@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DS180005', 'Lý Thị Lan',     'ds180005@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('SE180001', 'Trương Văn Mạnh', 'se180001@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('SE180002', 'Ngô Thị Nga',    'se180002@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('SE180003', 'Phan Văn Oanh',   'se180003@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('SE180004', 'Quách Thị Phượng','se180004@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('SE180005', 'Trần Văn Quang',  'se180005@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('HE180001', 'Lê Thị Hà',      'he180001@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('HE180002', 'Vũ Minh Đức',     'he180002@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('HE180003', 'Cao Thị Giang',   'he180003@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('HE180004', 'Kiều Văn Hùng',   'he180004@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('HE180005', 'Mai Thị Linh',    'he180005@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DE180006', 'Nguyễn Văn Bắc',  'de180006@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DE180007', 'Trần Thị Cúc',    'de180007@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DE180008', 'Lê Văn Dũng',     'de180008@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('DE180009', 'Phạm Thị Hằng',   'de180009@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DE180010', 'Hoàng Minh Khoa', 'de180010@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DS180006', 'Đỗ Văn Long',     'ds180006@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('DS180007', 'Võ Thị Mai',     'ds180007@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DS180008', 'Bùi Văn Nam',     'ds180008@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DS180009', 'Đinh Thị Oanh',   'ds180009@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('DS180010', 'Lý Văn Phúc',     'ds180010@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('SE180006', 'Trương Thị Quỳnh','se180006@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('SE180007', 'Ngô Văn Sơn',     'se180007@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('SE180008', 'Phan Thị Tuyết',  'se180008@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('SE180009', 'Quách Văn Uy',    'se180009@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('SE180010', 'Trần Thị Vân',    'se180010@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('HE180006', 'Lê Văn Xuân',     'he180006@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('HE180007', 'Vũ Thị Yến',      'he180007@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('HE180008', 'Cao Văn Zũ',      'he180008@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('HE180009', 'Kiều Thị Ánh',    'he180009@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('HE180010', 'Mai Văn Bình',    'he180010@fe.edu.vn', 'IT',        'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- -------------------------------------------
-- 3. Enrollment — 20 SV vào lớp 1, 20 SV vào lớp 2
-- -------------------------------------------
INSERT IGNORE INTO class_students (class_id, student_id, status, enrolled_at)
SELECT @class1_id, id, 'enrolled', NOW() FROM students WHERE student_code IN (
  'DE180001','DE180002','DE180003','DE180004','DE180005',
  'DS180001','DS180002','DS180003','DS180004','DS180005',
  'SE180001','SE180002','SE180003','SE180004','SE180005',
  'HE180001','HE180002','HE180003','HE180004','HE180005'
);
INSERT IGNORE INTO class_students (class_id, student_id, status, enrolled_at)
SELECT @class2_id, id, 'enrolled', NOW() FROM students WHERE student_code IN (
  'DE180006','DE180007','DE180008','DE180009','DE180010',
  'DS180006','DS180007','DS180008','DS180009','DS180010',
  'SE180006','SE180007','SE180008','SE180009','SE180010',
  'HE180006','HE180007','HE180008','HE180009','HE180010'
);

-- -------------------------------------------
-- 4. Nhóm — mỗi lớp 2 nhóm (G01, G02)
-- -------------------------------------------
INSERT INTO `groups` (class_id, group_code, group_name, description, max_members, status, created_by, created_at, updated_at)
VALUES
  (@class1_id, 'G01', 'Nhóm Alpha', 'Team lớp GD18D01', 6, 'active', @lec1_id, NOW(), NOW()),
  (@class1_id, 'G02', 'Nhóm Beta',  'Team lớp GD18D01', 6, 'active', @lec1_id, NOW(), NOW()),
  (@class2_id, 'G01', 'Nhóm Alpha', 'Team lớp GD18D02', 6, 'active', @lec1_id, NOW(), NOW()),
  (@class2_id, 'G02', 'Nhóm Beta',  'Team lớp GD18D02', 6, 'active', @lec1_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE group_name = VALUES(group_name);

SET @g1_c1 = (SELECT id FROM `groups` WHERE class_id = @class1_id AND group_code = 'G01' LIMIT 1);
SET @g2_c1 = (SELECT id FROM `groups` WHERE class_id = @class1_id AND group_code = 'G02' LIMIT 1);
SET @g1_c2 = (SELECT id FROM `groups` WHERE class_id = @class2_id AND group_code = 'G01' LIMIT 1);
SET @g2_c2 = (SELECT id FROM `groups` WHERE class_id = @class2_id AND group_code = 'G02' LIMIT 1);

-- -------------------------------------------
-- 5. Group members — phân bổ SV vào nhóm (mỗi nhóm 10 SV, 1 leader)
-- -------------------------------------------
INSERT IGNORE INTO group_members (group_id, student_id, role, status, joined_at)
SELECT @g1_c1, id, 'member', 'active', NOW()
FROM students WHERE student_code IN (
  'DE180001','DE180002','DE180003','DE180004','DE180005',
  'DS180001','DS180002','DS180003','DS180004','DS180005'
);
INSERT IGNORE INTO group_members (group_id, student_id, role, status, joined_at)
SELECT @g2_c1, id, 'member', 'active', NOW()
FROM students WHERE student_code IN (
  'SE180001','SE180002','SE180003','SE180004','SE180005',
  'HE180001','HE180002','HE180003','HE180004','HE180005'
);
INSERT IGNORE INTO group_members (group_id, student_id, role, status, joined_at)
SELECT @g1_c2, id, 'member', 'active', NOW()
FROM students WHERE student_code IN (
  'DE180006','DE180007','DE180008','DE180009','DE180010',
  'DS180006','DS180007','DS180008','DS180009','DS180010'
);
INSERT IGNORE INTO group_members (group_id, student_id, role, status, joined_at)
SELECT @g2_c2, id, 'member', 'active', NOW()
FROM students WHERE student_code IN (
  'SE180006','SE180007','SE180008','SE180009','SE180010',
  'HE180006','HE180007','HE180008','HE180009','HE180010'
);

-- Đặt 1 leader mỗi nhóm
SET @lead1 = (SELECT id FROM students WHERE student_code = 'DE180001' LIMIT 1);
SET @lead2 = (SELECT id FROM students WHERE student_code = 'SE180001' LIMIT 1);
SET @lead3 = (SELECT id FROM students WHERE student_code = 'DE180006' LIMIT 1);
SET @lead4 = (SELECT id FROM students WHERE student_code = 'SE180006' LIMIT 1);
UPDATE group_members SET role = 'leader' WHERE group_id = @g1_c1 AND student_id = @lead1 LIMIT 1;
UPDATE group_members SET role = 'leader' WHERE group_id = @g2_c1 AND student_id = @lead2 LIMIT 1;
UPDATE group_members SET role = 'leader' WHERE group_id = @g1_c2 AND student_id = @lead3 LIMIT 1;
UPDATE group_members SET role = 'leader' WHERE group_id = @g2_c2 AND student_id = @lead4 LIMIT 1;

-- =============================================
-- SUMMER 2025 — 2 lớp, 40 sinh viên mới (MSSV 182xxx). Năm 2025 có ≥2 kỳ để test.
-- =============================================
INSERT IGNORE INTO semesters (semester_code, semester_name, year, start_date, end_date, status, created_at, updated_at)
VALUES ('SU2025', 'Summer 2025', 2025, '2025-05-01', '2025-08-10', 'completed', NOW(), NOW());
SET @semester_su25_id = (SELECT id FROM semesters WHERE semester_code = 'SU2025' LIMIT 1);

-- Hai lớp Summer 2025 — lec1
INSERT INTO classes (subject_id, semester_id, class_code, class_name, lecturer_id, max_students, min_group_members, max_group_members, status, created_by, created_at, updated_at)
VALUES
  (@subject1_id, @semester_su25_id, 'GD18D05', 'GD18D05', @lec1_id, 40, 4, 6, 'active', @lec1_id, NOW(), NOW()),
  (@subject2_id, @semester_su25_id, 'GD18D06', 'GD18D06', @lec1_id, 40, 4, 6, 'active', @lec1_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE lecturer_id = @lec1_id;

SET @class5_id = (SELECT id FROM classes WHERE class_code = 'GD18D05' AND semester_id = @semester_su25_id LIMIT 1);
SET @class6_id = (SELECT id FROM classes WHERE class_code = 'GD18D06' AND semester_id = @semester_su25_id LIMIT 1);

-- 40 sinh viên Summer 2025 — MSSV 182xxx (không trùng 180xxx, 181xxx)
INSERT INTO students (student_code, full_name, email, major, status, created_at, updated_at) VALUES
('DE182001', 'Nguyễn Văn Cường', 'de182001@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DE182002', 'Trần Thị Duyên',   'de182002@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DE182003', 'Lê Văn Đạt',      'de182003@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('DE182004', 'Phạm Thị Hà',     'de182004@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DE182005', 'Hoàng Văn Khiêm',  'de182005@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DS182001', 'Đỗ Thị Lệ',       'ds182001@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('DS182002', 'Võ Văn Mạnh',     'ds182002@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DS182003', 'Bùi Thị Nhi',      'ds182003@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DS182004', 'Đinh Văn Phước',   'ds182004@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('DS182005', 'Lý Thị Quỳnh',    'ds182005@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('SE182001', 'Trương Văn Sang',  'se182001@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('SE182002', 'Ngô Thị Thảo',    'se182002@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('SE182003', 'Phan Văn Tuấn',   'se182003@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('SE182004', 'Quách Thị Vân',   'se182004@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('SE182005', 'Trần Văn Việt',   'se182005@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('HE182001', 'Lê Thị Yến',      'he182001@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('HE182002', 'Vũ Văn Anh',      'he182002@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('HE182003', 'Cao Thị Bích',     'he182003@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('HE182004', 'Kiều Văn Cường',  'he182004@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('HE182005', 'Mai Thị Dung',     'he182005@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DE182006', 'Nguyễn Văn Hùng', 'de182006@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('DE182007', 'Trần Thị Kiều',   'de182007@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DE182008', 'Lê Văn Long',     'de182008@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DE182009', 'Phạm Thị My',     'de182009@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('DE182010', 'Hoàng Minh Nhân', 'de182010@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DS182006', 'Đỗ Văn Oanh',     'ds182006@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DS182007', 'Võ Thị Phương',   'ds182007@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('DS182008', 'Bùi Văn Quang',   'ds182008@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DS182009', 'Đinh Thị Thơ',    'ds182009@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DS182010', 'Lý Văn Trung',    'ds182010@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('SE182006', 'Trương Thị Uyên', 'se182006@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('SE182007', 'Ngô Văn Vinh',    'se182007@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('SE182008', 'Phan Thị Xuân',   'se182008@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('SE182009', 'Quách Văn Yên',   'se182009@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('SE182010', 'Trần Thị Ánh',    'se182010@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('HE182006', 'Lê Văn Bình',     'he182006@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('HE182007', 'Vũ Thị Châu',     'he182007@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('HE182008', 'Cao Văn Dũng',    'he182008@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('HE182009', 'Kiều Thị Hương',  'he182009@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('HE182010', 'Mai Văn Khôi',    'he182010@fe.edu.vn', 'IT',        'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- Enrollment Summer 2025 — 20 SV lớp 5, 20 SV lớp 6
INSERT IGNORE INTO class_students (class_id, student_id, status, enrolled_at)
SELECT @class5_id, id, 'enrolled', NOW() FROM students WHERE student_code IN (
  'DE182001','DE182002','DE182003','DE182004','DE182005',
  'DS182001','DS182002','DS182003','DS182004','DS182005',
  'SE182001','SE182002','SE182003','SE182004','SE182005',
  'HE182001','HE182002','HE182003','HE182004','HE182005'
);
INSERT IGNORE INTO class_students (class_id, student_id, status, enrolled_at)
SELECT @class6_id, id, 'enrolled', NOW() FROM students WHERE student_code IN (
  'DE182006','DE182007','DE182008','DE182009','DE182010',
  'DS182006','DS182007','DS182008','DS182009','DS182010',
  'SE182006','SE182007','SE182008','SE182009','SE182010',
  'HE182006','HE182007','HE182008','HE182009','HE182010'
);

-- Nhóm Summer 2025 — 2 nhóm/lớp
INSERT INTO `groups` (class_id, group_code, group_name, description, max_members, status, created_by, created_at, updated_at)
VALUES
  (@class5_id, 'G01', 'Nhóm Alpha', 'Team lớp GD18D05', 6, 'active', @lec1_id, NOW(), NOW()),
  (@class5_id, 'G02', 'Nhóm Beta',  'Team lớp GD18D05', 6, 'active', @lec1_id, NOW(), NOW()),
  (@class6_id, 'G01', 'Nhóm Alpha', 'Team lớp GD18D06', 6, 'active', @lec1_id, NOW(), NOW()),
  (@class6_id, 'G02', 'Nhóm Beta',  'Team lớp GD18D06', 6, 'active', @lec1_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE group_name = VALUES(group_name);

SET @g1_c5 = (SELECT id FROM `groups` WHERE class_id = @class5_id AND group_code = 'G01' LIMIT 1);
SET @g2_c5 = (SELECT id FROM `groups` WHERE class_id = @class5_id AND group_code = 'G02' LIMIT 1);
SET @g1_c6 = (SELECT id FROM `groups` WHERE class_id = @class6_id AND group_code = 'G01' LIMIT 1);
SET @g2_c6 = (SELECT id FROM `groups` WHERE class_id = @class6_id AND group_code = 'G02' LIMIT 1);

INSERT IGNORE INTO group_members (group_id, student_id, role, status, joined_at)
SELECT @g1_c5, id, 'member', 'active', NOW()
FROM students WHERE student_code IN (
  'DE182001','DE182002','DE182003','DE182004','DE182005',
  'DS182001','DS182002','DS182003','DS182004','DS182005'
);
INSERT IGNORE INTO group_members (group_id, student_id, role, status, joined_at)
SELECT @g2_c5, id, 'member', 'active', NOW()
FROM students WHERE student_code IN (
  'SE182001','SE182002','SE182003','SE182004','SE182005',
  'HE182001','HE182002','HE182003','HE182004','HE182005'
);
INSERT IGNORE INTO group_members (group_id, student_id, role, status, joined_at)
SELECT @g1_c6, id, 'member', 'active', NOW()
FROM students WHERE student_code IN (
  'DE182006','DE182007','DE182008','DE182009','DE182010',
  'DS182006','DS182007','DS182008','DS182009','DS182010'
);
INSERT IGNORE INTO group_members (group_id, student_id, role, status, joined_at)
SELECT @g2_c6, id, 'member', 'active', NOW()
FROM students WHERE student_code IN (
  'SE182006','SE182007','SE182008','SE182009','SE182010',
  'HE182006','HE182007','HE182008','HE182009','HE182010'
);

SET @lead9  = (SELECT id FROM students WHERE student_code = 'DE182001' LIMIT 1);
SET @lead10 = (SELECT id FROM students WHERE student_code = 'SE182001' LIMIT 1);
SET @lead11 = (SELECT id FROM students WHERE student_code = 'DE182006' LIMIT 1);
SET @lead12 = (SELECT id FROM students WHERE student_code = 'SE182006' LIMIT 1);
UPDATE group_members SET role = 'leader' WHERE group_id = @g1_c5 AND student_id = @lead9  LIMIT 1;
UPDATE group_members SET role = 'leader' WHERE group_id = @g2_c5 AND student_id = @lead10 LIMIT 1;
UPDATE group_members SET role = 'leader' WHERE group_id = @g1_c6 AND student_id = @lead11 LIMIT 1;
UPDATE group_members SET role = 'leader' WHERE group_id = @g2_c6 AND student_id = @lead12 LIMIT 1;

-- =============================================
-- FALL 2025 — 2 lớp, 40 sinh viên mới (MSSV khác Spring 2026)
-- =============================================
INSERT IGNORE INTO semesters (semester_code, semester_name, year, start_date, end_date, status, created_at, updated_at)
VALUES ('FA2025', 'Fall 2025', 2025, '2025-08-15', '2025-12-20', 'completed', NOW(), NOW());
SET @semester_fa25_id = (SELECT id FROM semesters WHERE semester_code = 'FA2025' LIMIT 1);

-- Hai lớp Fall 2025 — lec1
INSERT INTO classes (subject_id, semester_id, class_code, class_name, lecturer_id, max_students, min_group_members, max_group_members, status, created_by, created_at, updated_at)
VALUES
  (@subject1_id, @semester_fa25_id, 'GD18D03', 'GD18D03', @lec1_id, 40, 4, 6, 'active', @lec1_id, NOW(), NOW()),
  (@subject2_id, @semester_fa25_id, 'GD18D04', 'GD18D04', @lec1_id, 40, 4, 6, 'active', @lec1_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE lecturer_id = @lec1_id;

SET @class3_id = (SELECT id FROM classes WHERE class_code = 'GD18D03' AND semester_id = @semester_fa25_id LIMIT 1);
SET @class4_id = (SELECT id FROM classes WHERE class_code = 'GD18D04' AND semester_id = @semester_fa25_id LIMIT 1);

-- 40 sinh viên Fall 2025 — MSSV 181xxx (không trùng 180xxx Spring 2026)
INSERT INTO students (student_code, full_name, email, major, status, created_at, updated_at) VALUES
('DE181001', 'Nguyễn Văn Đông',  'de181001@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DE181002', 'Trần Thị Hạnh',    'de181002@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DE181003', 'Lê Văn Khải',      'de181003@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('DE181004', 'Phạm Thị Lam',     'de181004@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DE181005', 'Hoàng Văn Minh',   'de181005@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DS181001', 'Đỗ Thị Ninh',      'ds181001@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('DS181002', 'Võ Văn Phong',     'ds181002@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DS181003', 'Bùi Thị Quế',      'ds181003@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DS181004', 'Đinh Văn Sơn',     'ds181004@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('DS181005', 'Lý Thị Tâm',       'ds181005@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('SE181001', 'Trương Văn Uyên',  'se181001@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('SE181002', 'Ngô Thị Vinh',     'se181002@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('SE181003', 'Phan Văn Yên',     'se181003@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('SE181004', 'Quách Thị An',     'se181004@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('SE181005', 'Trần Văn Bảo',     'se181005@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('HE181001', 'Lê Thị Chi',       'he181001@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('HE181002', 'Vũ Văn Dương',     'he181002@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('HE181003', 'Cao Thị Hoa',      'he181003@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('HE181004', 'Kiều Văn Khoa',    'he181004@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('HE181005', 'Mai Thị Ly',       'he181005@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DE181006', 'Nguyễn Văn Nam',   'de181006@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('DE181007', 'Trần Thị Oanh',    'de181007@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DE181008', 'Lê Văn Phú',       'de181008@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DE181009', 'Phạm Thị Quyên',   'de181009@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('DE181010', 'Hoàng Minh Sáng',  'de181010@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DS181006', 'Đỗ Văn Tài',       'ds181006@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DS181007', 'Võ Thị Uyên',     'ds181007@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('DS181008', 'Bùi Văn Việt',     'ds181008@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('DS181009', 'Đinh Thị Xuân',    'ds181009@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('DS181010', 'Lý Văn Yên',       'ds181010@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('SE181006', 'Trương Thị Anh',   'se181006@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('SE181007', 'Ngô Văn Bằng',     'se181007@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('SE181008', 'Phan Thị Châu',    'se181008@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('SE181009', 'Quách Văn Dũng',   'se181009@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('SE181010', 'Trần Thị Hương',   'se181010@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('HE181006', 'Lê Văn Khoa',      'he181006@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('HE181007', 'Vũ Thị Lan',       'he181007@fe.edu.vn', 'IT',        'active', NOW(), NOW()),
('HE181008', 'Cao Văn Mạnh',     'he181008@fe.edu.vn', 'Design',    'active', NOW(), NOW()),
('HE181009', 'Kiều Thị Nga',     'he181009@fe.edu.vn', 'Kinh tế',   'active', NOW(), NOW()),
('HE181010', 'Mai Văn Phúc',     'he181010@fe.edu.vn', 'IT',        'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- Enrollment Fall 2025 — 20 SV lớp 3, 20 SV lớp 4
INSERT IGNORE INTO class_students (class_id, student_id, status, enrolled_at)
SELECT @class3_id, id, 'enrolled', NOW() FROM students WHERE student_code IN (
  'DE181001','DE181002','DE181003','DE181004','DE181005',
  'DS181001','DS181002','DS181003','DS181004','DS181005',
  'SE181001','SE181002','SE181003','SE181004','SE181005',
  'HE181001','HE181002','HE181003','HE181004','HE181005'
);
INSERT IGNORE INTO class_students (class_id, student_id, status, enrolled_at)
SELECT @class4_id, id, 'enrolled', NOW() FROM students WHERE student_code IN (
  'DE181006','DE181007','DE181008','DE181009','DE181010',
  'DS181006','DS181007','DS181008','DS181009','DS181010',
  'SE181006','SE181007','SE181008','SE181009','SE181010',
  'HE181006','HE181007','HE181008','HE181009','HE181010'
);

-- Nhóm Fall 2025 — 2 nhóm/lớp
INSERT INTO `groups` (class_id, group_code, group_name, description, max_members, status, created_by, created_at, updated_at)
VALUES
  (@class3_id, 'G01', 'Nhóm Alpha', 'Team lớp GD18D03', 6, 'active', @lec1_id, NOW(), NOW()),
  (@class3_id, 'G02', 'Nhóm Beta',  'Team lớp GD18D03', 6, 'active', @lec1_id, NOW(), NOW()),
  (@class4_id, 'G01', 'Nhóm Alpha', 'Team lớp GD18D04', 6, 'active', @lec1_id, NOW(), NOW()),
  (@class4_id, 'G02', 'Nhóm Beta',  'Team lớp GD18D04', 6, 'active', @lec1_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE group_name = VALUES(group_name);

SET @g1_c3 = (SELECT id FROM `groups` WHERE class_id = @class3_id AND group_code = 'G01' LIMIT 1);
SET @g2_c3 = (SELECT id FROM `groups` WHERE class_id = @class3_id AND group_code = 'G02' LIMIT 1);
SET @g1_c4 = (SELECT id FROM `groups` WHERE class_id = @class4_id AND group_code = 'G01' LIMIT 1);
SET @g2_c4 = (SELECT id FROM `groups` WHERE class_id = @class4_id AND group_code = 'G02' LIMIT 1);

INSERT IGNORE INTO group_members (group_id, student_id, role, status, joined_at)
SELECT @g1_c3, id, 'member', 'active', NOW()
FROM students WHERE student_code IN (
  'DE181001','DE181002','DE181003','DE181004','DE181005',
  'DS181001','DS181002','DS181003','DS181004','DS181005'
);
INSERT IGNORE INTO group_members (group_id, student_id, role, status, joined_at)
SELECT @g2_c3, id, 'member', 'active', NOW()
FROM students WHERE student_code IN (
  'SE181001','SE181002','SE181003','SE181004','SE181005',
  'HE181001','HE181002','HE181003','HE181004','HE181005'
);
INSERT IGNORE INTO group_members (group_id, student_id, role, status, joined_at)
SELECT @g1_c4, id, 'member', 'active', NOW()
FROM students WHERE student_code IN (
  'DE181006','DE181007','DE181008','DE181009','DE181010',
  'DS181006','DS181007','DS181008','DS181009','DS181010'
);
INSERT IGNORE INTO group_members (group_id, student_id, role, status, joined_at)
SELECT @g2_c4, id, 'member', 'active', NOW()
FROM students WHERE student_code IN (
  'SE181006','SE181007','SE181008','SE181009','SE181010',
  'HE181006','HE181007','HE181008','HE181009','HE181010'
);

SET @lead5 = (SELECT id FROM students WHERE student_code = 'DE181001' LIMIT 1);
SET @lead6 = (SELECT id FROM students WHERE student_code = 'SE181001' LIMIT 1);
SET @lead7 = (SELECT id FROM students WHERE student_code = 'DE181006' LIMIT 1);
SET @lead8 = (SELECT id FROM students WHERE student_code = 'SE181006' LIMIT 1);
UPDATE group_members SET role = 'leader' WHERE group_id = @g1_c3 AND student_id = @lead5 LIMIT 1;
UPDATE group_members SET role = 'leader' WHERE group_id = @g2_c3 AND student_id = @lead6 LIMIT 1;
UPDATE group_members SET role = 'leader' WHERE group_id = @g1_c4 AND student_id = @lead7 LIMIT 1;
UPDATE group_members SET role = 'leader' WHERE group_id = @g2_c4 AND student_id = @lead8 LIMIT 1;
