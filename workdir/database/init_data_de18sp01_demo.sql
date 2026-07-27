-- =============================================
-- DEMO DATA — DE18SP01 (EXE101 / SP2026)
-- Mentor + mentoring sessions + assignments +
-- checkpoints with graded submissions.
-- Mục đích: chứng minh kỳ SP2026 tách biệt, có
-- đủ dữ liệu chấm/điểm/mentor để người chấm xem.
--
-- Prerequisite:
--   1) init_data_de18_cohort.sql (lớp/nhóm/SV)
--   2) seed_de18_student_users.js (user login SV)
--   3) user lec1, subject EXE101, semester SP2026
-- Idempotent: xóa demo cũ theo UUID / title prefix rồi insert lại.
-- =============================================
SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci';

SET @lec1_id = (SELECT id FROM users WHERE username = 'lec1' LIMIT 1);
SET @admin_id = (SELECT id FROM users WHERE username = 'admin' LIMIT 1);
SET @mentor_role_id = (SELECT id FROM roles WHERE role_code = 'mentor' LIMIT 1);
SET @sem_sp26_id = (SELECT id FROM semesters WHERE semester_code = 'SP2026' LIMIT 1);
SET @subject1_id = (SELECT id FROM subjects WHERE subject_code = 'EXE101' LIMIT 1);
SET @class_sp01_id = (
  SELECT c.id FROM classes c
  WHERE c.class_code = 'DE18SP01' AND c.semester_id = @sem_sp26_id AND c.deleted_at IS NULL
  LIMIT 1
);

-- Fixed UUIDs (32 hex, no dashes) — chỉ dùng cho demo SP2026 này
SET @asgn1_id = 'a11e1801010000000000000000000001';
SET @asgn2_id = 'a11e1801010000000000000000000002';
SET @chk1_id  = 'c11e1801010000000000000000000001';
SET @chk2_id  = 'c11e1801010000000000000000000002';

-- Guard
SELECT IF(@class_sp01_id IS NULL, 'ERROR: DE18SP01/SP2026 missing — run cohort seed first', 'OK') AS guard;

-- -------------------------------------------
-- 0) Cleanup previous demo for this class
-- -------------------------------------------
DELETE asf FROM assignment_submission_files asf
JOIN assignment_submissions s ON s.id = asf.submission_id
WHERE s.assignment_id IN (@asgn1_id, @asgn2_id);

DELETE FROM assignment_submissions WHERE assignment_id IN (@asgn1_id, @asgn2_id);
DELETE FROM assignments WHERE id IN (@asgn1_id, @asgn2_id);

DELETE csf FROM checkpoint_submission_files csf
JOIN checkpoint_submissions s ON s.id = csf.submission_id
WHERE s.checkpoint_id IN (@chk1_id, @chk2_id);

DELETE FROM checkpoint_submissions WHERE checkpoint_id IN (@chk1_id, @chk2_id);
DELETE FROM checkpoints WHERE id IN (@chk1_id, @chk2_id);

-- Mentoring cascade for demo sessions (title prefix)
DELETE mai FROM mentoring_action_items mai
JOIN mentoring_sessions ms ON ms.id = mai.session_id
WHERE ms.class_id = @class_sp01_id AND ms.title LIKE '[SP2026-DEMO]%';

DELETE mf FROM mentoring_feedbacks mf
JOIN mentoring_sessions ms ON ms.id = mf.session_id
WHERE ms.class_id = @class_sp01_id AND ms.title LIKE '[SP2026-DEMO]%';

DELETE msn FROM mentoring_session_notes msn
JOIN mentoring_sessions ms ON ms.id = msn.session_id
WHERE ms.class_id = @class_sp01_id AND ms.title LIKE '[SP2026-DEMO]%';

DELETE msa FROM mentoring_session_attendees msa
JOIN mentoring_sessions ms ON ms.id = msa.session_id
WHERE ms.class_id = @class_sp01_id AND ms.title LIKE '[SP2026-DEMO]%';

DELETE FROM mentoring_sessions
WHERE class_id = @class_sp01_id AND title LIKE '[SP2026-DEMO]%';

DELETE FROM mentor_assignments
WHERE class_id = @class_sp01_id AND note LIKE '[SP2026-DEMO]%';

-- -------------------------------------------
-- 1) Mentors (reuse mra / create mrb)
-- -------------------------------------------
INSERT INTO users (username, email, password, full_name, auth_provider, status, created_at, updated_at)
SELECT 'mrb', 'mrb@gmail.com',
       (SELECT password FROM users WHERE username = 'mra' LIMIT 1),
       'Mentor B', 'local', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'mrb');

SET @mra_user_id = (SELECT id FROM users WHERE username = 'mra' LIMIT 1);
SET @mrb_user_id = (SELECT id FROM users WHERE username = 'mrb' LIMIT 1);

INSERT IGNORE INTO user_roles (user_id, role_id, assigned_at)
VALUES
  (@mra_user_id, @mentor_role_id, NOW()),
  (@mrb_user_id, @mentor_role_id, NOW());

-- Ensure active mentor profile A
INSERT INTO mentor_profiles (
  user_id, full_name, email, phone, mentor_type, organization, position_title, bio,
  years_of_experience, status, visibility, created_by, reviewed_by, reviewed_at, created_at, updated_at
)
SELECT @mra_user_id, 'Mentor A', 'mra@gmail.com', '0901000001', 'business',
       'FPT Software', 'Business Mentor',
       'Mentor doanh nghiệp hỗ trợ nhóm EXE101 kỳ Spring 2026.',
       8, 'active', 'internal', @admin_id, @admin_id, NOW(), NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM mentor_profiles WHERE user_id = @mra_user_id AND status = 'active' AND deleted_at IS NULL
);

UPDATE mentor_profiles
SET status = 'active', visibility = 'internal', full_name = 'Mentor A',
    organization = IFNULL(organization, 'FPT Software'),
    updated_at = NOW()
WHERE user_id = @mra_user_id AND deleted_at IS NULL;

INSERT INTO mentor_profiles (
  user_id, full_name, email, phone, mentor_type, organization, position_title, bio,
  years_of_experience, status, visibility, created_by, reviewed_by, reviewed_at, created_at, updated_at
)
SELECT @mrb_user_id, 'Mentor B', 'mrb@gmail.com', '0901000002', 'technical',
       'FPT University', 'Technical Mentor',
       'Mentor kỹ thuật hỗ trợ nhóm EXE101 kỳ Spring 2026.',
       6, 'active', 'internal', @admin_id, @admin_id, NOW(), NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM mentor_profiles WHERE user_id = @mrb_user_id AND status = 'active' AND deleted_at IS NULL
);

SET @mentor_a_id = (
  SELECT id FROM mentor_profiles
  WHERE user_id = @mra_user_id AND status = 'active' AND deleted_at IS NULL
  ORDER BY id DESC LIMIT 1
);
SET @mentor_b_id = (
  SELECT id FROM mentor_profiles
  WHERE user_id = @mrb_user_id AND status = 'active' AND deleted_at IS NULL
  ORDER BY id DESC LIMIT 1
);

-- -------------------------------------------
-- 2) Enrich groups (topic / category / mentor display)
-- -------------------------------------------
UPDATE `groups` g
JOIN (
  SELECT 'G01' AS group_code, 'EdTech' AS category, 'Smart Campus Booking' AS topic,
         'Ứng dụng đặt phòng học/lab thông minh cho sinh viên FPT.' AS topic_desc, 'Mentor A' AS mentor_name UNION ALL
  SELECT 'G02', 'FinTech', 'Student Micro-Saving',
         'App tiết kiệm nhỏ theo mục tiêu học phí / dự án.', 'Mentor A' UNION ALL
  SELECT 'G03', 'HealthTech', 'Campus Mental Buddy',
         'Chatbot hỗ trợ sức khỏe tinh thần sinh viên.', 'Mentor A' UNION ALL
  SELECT 'G04', 'GreenTech', 'Recycle Reward Hub',
         'Đổi điểm thưởng khi tái chế rác trên campus.', 'Mentor A' UNION ALL
  SELECT 'G05', 'Marketplace', 'Secondhand Campus',
         'Chợ đồ cũ nội bộ giữa các kỳ học.', 'Mentor B' UNION ALL
  SELECT 'G06', 'AI Tool', 'Lecture Note AI',
         'Tóm tắt bài giảng + quiz tự động từ slide.', 'Mentor B' UNION ALL
  SELECT 'G07', 'Social', 'Event Connect',
         'Nền tảng tìm teammate / sự kiện CLB.', 'Mentor B' UNION ALL
  SELECT 'G08', 'IoT', 'Smart Lab Monitor',
         'Giám sát thiết bị lab qua cảm biến IoT.', 'Mentor B'
) t ON t.group_code = g.group_code
SET
  g.category = t.category,
  g.topic = t.topic,
  g.topic_desc = t.topic_desc,
  g.mentor_name = t.mentor_name,
  g.mentor_dept = 'Entrepreneurship',
  g.status = 'active',
  g.updated_at = NOW()
WHERE g.class_id = @class_sp01_id AND g.deleted_at IS NULL;

SET @g01 = (SELECT id FROM `groups` WHERE class_id = @class_sp01_id AND group_code = 'G01' LIMIT 1);
SET @g02 = (SELECT id FROM `groups` WHERE class_id = @class_sp01_id AND group_code = 'G02' LIMIT 1);
SET @g03 = (SELECT id FROM `groups` WHERE class_id = @class_sp01_id AND group_code = 'G03' LIMIT 1);
SET @g04 = (SELECT id FROM `groups` WHERE class_id = @class_sp01_id AND group_code = 'G04' LIMIT 1);
SET @g05 = (SELECT id FROM `groups` WHERE class_id = @class_sp01_id AND group_code = 'G05' LIMIT 1);
SET @g06 = (SELECT id FROM `groups` WHERE class_id = @class_sp01_id AND group_code = 'G06' LIMIT 1);
SET @g07 = (SELECT id FROM `groups` WHERE class_id = @class_sp01_id AND group_code = 'G07' LIMIT 1);
SET @g08 = (SELECT id FROM `groups` WHERE class_id = @class_sp01_id AND group_code = 'G08' LIMIT 1);

-- -------------------------------------------
-- 3) Mentor assignments (primary, active, completed period)
-- -------------------------------------------
INSERT INTO mentor_assignments (
  mentor_id, group_id, class_id, semester_id, subject_id,
  assigned_by, approved_by, assignment_type, status,
  start_date, end_date, expected_sessions, note, created_at, updated_at
) VALUES
  (@mentor_a_id, @g01, @class_sp01_id, @sem_sp26_id, @subject1_id, @lec1_id, @lec1_id, 'primary', 'completed', '2026-02-01', '2026-05-15', 4, '[SP2026-DEMO] Mentor A — Team Alpha', NOW(), NOW()),
  (@mentor_a_id, @g02, @class_sp01_id, @sem_sp26_id, @subject1_id, @lec1_id, @lec1_id, 'primary', 'completed', '2026-02-01', '2026-05-15', 4, '[SP2026-DEMO] Mentor A — Team Beta', NOW(), NOW()),
  (@mentor_a_id, @g03, @class_sp01_id, @sem_sp26_id, @subject1_id, @lec1_id, @lec1_id, 'primary', 'completed', '2026-02-01', '2026-05-15', 4, '[SP2026-DEMO] Mentor A — Team Gamma', NOW(), NOW()),
  (@mentor_a_id, @g04, @class_sp01_id, @sem_sp26_id, @subject1_id, @lec1_id, @lec1_id, 'primary', 'completed', '2026-02-01', '2026-05-15', 4, '[SP2026-DEMO] Mentor A — Team Delta', NOW(), NOW()),
  (@mentor_b_id, @g05, @class_sp01_id, @sem_sp26_id, @subject1_id, @lec1_id, @lec1_id, 'primary', 'completed', '2026-02-01', '2026-05-15', 4, '[SP2026-DEMO] Mentor B — Team Epsilon', NOW(), NOW()),
  (@mentor_b_id, @g06, @class_sp01_id, @sem_sp26_id, @subject1_id, @lec1_id, @lec1_id, 'primary', 'completed', '2026-02-01', '2026-05-15', 4, '[SP2026-DEMO] Mentor B — Team Zeta', NOW(), NOW()),
  (@mentor_b_id, @g07, @class_sp01_id, @sem_sp26_id, @subject1_id, @lec1_id, @lec1_id, 'primary', 'completed', '2026-02-01', '2026-05-15', 4, '[SP2026-DEMO] Mentor B — Team Eta', NOW(), NOW()),
  (@mentor_b_id, @g08, @class_sp01_id, @sem_sp26_id, @subject1_id, @lec1_id, @lec1_id, 'primary', 'completed', '2026-02-01', '2026-05-15', 4, '[SP2026-DEMO] Mentor B — Team Theta', NOW(), NOW());

-- Sessions need active assignment in some app paths; create temporary active then we'll leave completed.
-- For historical demo, use status=completed is fine for list views; create sessions while we have assignment ids.

-- -------------------------------------------
-- 4) Mentoring sessions (1 completed / group + notes/feedback/action)
-- -------------------------------------------
INSERT INTO mentoring_sessions (
  assignment_id, mentor_id, group_id, class_id, semester_id,
  title, description, session_type, meeting_link, location,
  scheduled_start_at, scheduled_end_at, actual_start_at, actual_end_at, duration_minutes,
  status, created_by, created_at, updated_at
)
SELECT
  ma.id, ma.mentor_id, ma.group_id, ma.class_id, ma.semester_id,
  CONCAT('[SP2026-DEMO] Kickoff — ', g.group_name),
  'Buổi mentoring mở đầu: làm rõ problem statement và kế hoạch Sprint 1.',
  'online',
  'https://meet.google.com/sp2026-demo',
  NULL,
  '2026-02-10 19:00:00', '2026-02-10 20:30:00',
  '2026-02-10 19:05:00', '2026-02-10 20:25:00', 80,
  'completed', @lec1_id, NOW(), NOW()
FROM mentor_assignments ma
JOIN `groups` g ON g.id = ma.group_id
WHERE ma.class_id = @class_sp01_id AND ma.note LIKE '[SP2026-DEMO]%';

INSERT INTO mentoring_sessions (
  assignment_id, mentor_id, group_id, class_id, semester_id,
  title, description, session_type, meeting_link,
  scheduled_start_at, scheduled_end_at, actual_start_at, actual_end_at, duration_minutes,
  status, created_by, created_at, updated_at
)
SELECT
  ma.id, ma.mentor_id, ma.group_id, ma.class_id, ma.semester_id,
  CONCAT('[SP2026-DEMO] Mid-review — ', g.group_name),
  'Buổi giữa kỳ: review progress checkpoint 1 và điều chỉnh scope.',
  'hybrid',
  'https://meet.google.com/sp2026-mid',
  '2026-03-20 18:30:00', '2026-03-20 20:00:00',
  '2026-03-20 18:35:00', '2026-03-20 19:55:00', 80,
  'completed', @lec1_id, NOW(), NOW()
FROM mentor_assignments ma
JOIN `groups` g ON g.id = ma.group_id
WHERE ma.class_id = @class_sp01_id AND ma.note LIKE '[SP2026-DEMO]%';

-- Attendees: mentor + leader
INSERT INTO mentoring_session_attendees (session_id, user_id, student_id, mentor_id, attendee_type, attendance_status, note)
SELECT ms.id, mp.user_id, NULL, ms.mentor_id, 'mentor', 'attended', 'Mentor tham dự'
FROM mentoring_sessions ms
JOIN mentor_profiles mp ON mp.id = ms.mentor_id
WHERE ms.class_id = @class_sp01_id AND ms.title LIKE '[SP2026-DEMO]%';

INSERT INTO mentoring_session_attendees (session_id, user_id, student_id, mentor_id, attendee_type, attendance_status, note)
SELECT ms.id, s.user_id, s.id, NULL, 'student', 'attended', 'Thành viên nhóm'
FROM mentoring_sessions ms
JOIN group_members gm ON gm.group_id = ms.group_id AND gm.status = 'active'
JOIN students s ON s.id = gm.student_id
WHERE ms.class_id = @class_sp01_id AND ms.title LIKE '[SP2026-DEMO]%';

INSERT INTO mentoring_session_notes (session_id, author_id, note_type, content, visibility)
SELECT ms.id, mp.user_id, 'mentor_note',
       CONCAT('Nhóm ', g.group_name, ' đã làm rõ value proposition; cần bổ sung phỏng vấn user tuần tới.'),
       'shared_with_group'
FROM mentoring_sessions ms
JOIN mentor_profiles mp ON mp.id = ms.mentor_id
JOIN `groups` g ON g.id = ms.group_id
WHERE ms.class_id = @class_sp01_id AND ms.title LIKE '[SP2026-DEMO] Kickoff%';

INSERT INTO mentoring_feedbacks (session_id, assignment_id, from_user_id, from_role, target_type, target_id, rating, feedback, strengths, improvements)
SELECT ms.id, ms.assignment_id, mp.user_id, 'mentor', 'group', ms.group_id, 4,
       'Nhóm chuẩn bị tốt, trình bày rõ ràng trong buổi mentoring.',
       'Teamwork và hiểu problem',
       'Cần số liệu thị trường cụ thể hơn'
FROM mentoring_sessions ms
JOIN mentor_profiles mp ON mp.id = ms.mentor_id
WHERE ms.class_id = @class_sp01_id AND ms.title LIKE '[SP2026-DEMO] Mid-review%';

INSERT INTO mentoring_action_items (session_id, group_id, assigned_to_user_id, title, description, due_date, status, created_by)
SELECT ms.id, ms.group_id, s.user_id,
       'Hoàn thiện problem interview (5 users)',
       'Phỏng vấn tối thiểu 5 user mục tiêu và tổng hợp insight.',
       '2026-02-24', 'done', mp.user_id
FROM mentoring_sessions ms
JOIN mentor_profiles mp ON mp.id = ms.mentor_id
JOIN group_members gm ON gm.group_id = ms.group_id AND gm.role = 'leader' AND gm.status = 'active'
JOIN students s ON s.id = gm.student_id
WHERE ms.class_id = @class_sp01_id AND ms.title LIKE '[SP2026-DEMO] Kickoff%';

-- -------------------------------------------
-- 5) Assignments (2) + graded submissions (8 groups)
-- -------------------------------------------
INSERT INTO assignments (
  id, class_id, title, description, deadline, max_score, status,
  required_file_types, max_file_size_mb, max_files, created_by, created_at, updated_at
) VALUES
(
  @asgn1_id, @class_sp01_id,
  '[SP2026] Weekly Report W3',
  'Báo cáo tuần 3: tiến độ nghiên cứu thị trường và phỏng vấn user (EXE101 / SP2026).',
  '2026-02-28 23:59:00', 10.00, 'closed',
  'pdf,docx', 20, 3, @lec1_id, NOW(), NOW()
),
(
  @asgn2_id, @class_sp01_id,
  '[SP2026] Business Model Canvas',
  'Nộp Business Model Canvas (1 trang) + giải thích 9 building blocks.',
  '2026-04-10 23:59:00', 10.00, 'closed',
  'pdf,docx', 20, 3, @lec1_id, NOW(), NOW()
);

INSERT INTO assignment_submissions (
  assignment_id, group_id, submitted_by, submitted_at, is_late, note,
  score, feedback, graded_by, graded_at, status
)
SELECT
  @asgn1_id,
  g.id,
  s.user_id,
  '2026-02-27 16:00:00',
  0,
  CONCAT('Nộp Weekly Report W3 — ', g.group_name),
  CASE g.group_code
    WHEN 'G01' THEN 9.0 WHEN 'G02' THEN 8.5 WHEN 'G03' THEN 8.0 WHEN 'G04' THEN 7.5
    WHEN 'G05' THEN 9.5 WHEN 'G06' THEN 8.0 WHEN 'G07' THEN 7.0 WHEN 'G08' THEN 8.5
  END,
  CONCAT('Nhóm ', g.group_name, ' hoàn thành báo cáo tuần ổn. Cần chi tiết hơn về insight từ phỏng vấn.'),
  @lec1_id,
  '2026-03-02 10:00:00',
  'graded'
FROM `groups` g
JOIN group_members gm ON gm.group_id = g.id AND gm.role = 'leader' AND gm.status = 'active'
JOIN students s ON s.id = gm.student_id
WHERE g.class_id = @class_sp01_id AND g.deleted_at IS NULL;

INSERT INTO assignment_submissions (
  assignment_id, group_id, submitted_by, submitted_at, is_late, note,
  score, feedback, graded_by, graded_at, status
)
SELECT
  @asgn2_id,
  g.id,
  s.user_id,
  '2026-04-09 20:00:00',
  0,
  CONCAT('Nộp BMC — ', g.group_name),
  CASE g.group_code
    WHEN 'G01' THEN 8.5 WHEN 'G02' THEN 9.0 WHEN 'G03' THEN 7.5 WHEN 'G04' THEN 8.0
    WHEN 'G05' THEN 9.0 WHEN 'G06' THEN 8.5 WHEN 'G07' THEN 7.5 WHEN 'G08' THEN 9.5
  END,
  CONCAT('BMC của ', g.group_name, ' khá rõ value proposition. Nên làm rõ kênh phân phối và cấu trúc chi phí.'),
  @lec1_id,
  '2026-04-12 11:00:00',
  'graded'
FROM `groups` g
JOIN group_members gm ON gm.group_id = g.id AND gm.role = 'leader' AND gm.status = 'active'
JOIN students s ON s.id = gm.student_id
WHERE g.class_id = @class_sp01_id AND g.deleted_at IS NULL;

INSERT INTO assignment_submission_files (
  submission_id, file_name, file_path, file_url, file_type, mime_type, file_size, uploaded_by
)
SELECT
  s.id,
  CONCAT(g.group_code, '_weekly_w3.pdf'),
  CONCAT('demo/sp2026/de18sp01/assignments/w3/', g.group_code, '.pdf'),
  CONCAT('/ehub/demo/sp2026/de18sp01/assignments/w3/', g.group_code, '.pdf'),
  'pdf', 'application/pdf', 245760, s.submitted_by
FROM assignment_submissions s
JOIN `groups` g ON g.id = s.group_id
WHERE s.assignment_id = @asgn1_id;

INSERT INTO assignment_submission_files (
  submission_id, file_name, file_path, file_url, file_type, mime_type, file_size, uploaded_by
)
SELECT
  s.id,
  CONCAT(g.group_code, '_bmc.pdf'),
  CONCAT('demo/sp2026/de18sp01/assignments/bmc/', g.group_code, '.pdf'),
  CONCAT('/ehub/demo/sp2026/de18sp01/assignments/bmc/', g.group_code, '.pdf'),
  'pdf', 'application/pdf', 312000, s.submitted_by
FROM assignment_submissions s
JOIN `groups` g ON g.id = s.group_id
WHERE s.assignment_id = @asgn2_id;

-- -------------------------------------------
-- 6) Checkpoints (2) + graded submissions
-- -------------------------------------------
INSERT INTO checkpoints (
  id, class_id, title, description, order_index, deadline, open_at,
  max_score, weight, required_file_types, max_file_size_mb, max_files,
  status, created_by, created_at, updated_at
) VALUES
(
  @chk1_id, @class_sp01_id,
  '[SP2026] CP1 — Problem & Insight',
  'Checkpoint 1: mô tả vấn đề, persona, insight từ nghiên cứu (EXE101 / SP2026).',
  1, '2026-03-15 23:59:00', '2026-02-15 00:00:00',
  10.00, 1.00, 'pdf,docx,pptx', 20, 5,
  'closed', @lec1_id, NOW(), NOW()
),
(
  @chk2_id, @class_sp01_id,
  '[SP2026] CP2 — Solution Pitch',
  'Checkpoint 2: solution pitch + demo khái niệm / prototype sơ bộ.',
  2, '2026-05-05 23:59:00', '2026-04-01 00:00:00',
  10.00, 1.50, 'pdf,docx,pptx', 20, 5,
  'closed', @lec1_id, NOW(), NOW()
);

INSERT INTO checkpoint_submissions (
  checkpoint_id, group_id, submitted_by, submitted_at, is_late, note,
  score, feedback, graded_by, graded_at, status
)
SELECT
  @chk1_id,
  g.id,
  s.user_id,
  '2026-03-14 18:00:00',
  0,
  CONCAT('Nộp CP1 — ', g.group_name),
  CASE g.group_code
    WHEN 'G01' THEN 9.0 WHEN 'G02' THEN 8.0 WHEN 'G03' THEN 7.5 WHEN 'G04' THEN 8.5
    WHEN 'G05' THEN 9.5 WHEN 'G06' THEN 8.0 WHEN 'G07' THEN 7.0 WHEN 'G08' THEN 8.5
  END,
  CONCAT('CP1 của ', g.group_name, ': problem statement rõ. Cần bổ sung bằng chứng định lượng và phân tích competitor.'),
  @lec1_id,
  '2026-03-18 09:30:00',
  'graded'
FROM `groups` g
JOIN group_members gm ON gm.group_id = g.id AND gm.role = 'leader' AND gm.status = 'active'
JOIN students s ON s.id = gm.student_id
WHERE g.class_id = @class_sp01_id AND g.deleted_at IS NULL;

INSERT INTO checkpoint_submissions (
  checkpoint_id, group_id, submitted_by, submitted_at, is_late, note,
  score, feedback, graded_by, graded_at, status
)
SELECT
  @chk2_id,
  g.id,
  s.user_id,
  '2026-05-04 21:00:00',
  0,
  CONCAT('Nộp CP2 — ', g.group_name),
  CASE g.group_code
    WHEN 'G01' THEN 8.5 WHEN 'G02' THEN 9.0 WHEN 'G03' THEN 8.0 WHEN 'G04' THEN 7.5
    WHEN 'G05' THEN 9.0 WHEN 'G06' THEN 8.5 WHEN 'G07' THEN 8.0 WHEN 'G08' THEN 9.5
  END,
  CONCAT('CP2 của ', g.group_name, ': pitch thuyết phục. Nên hoàn thiện demo flow và kế hoạch go-to-market.'),
  @lec1_id,
  '2026-05-08 14:00:00',
  'graded'
FROM `groups` g
JOIN group_members gm ON gm.group_id = g.id AND gm.role = 'leader' AND gm.status = 'active'
JOIN students s ON s.id = gm.student_id
WHERE g.class_id = @class_sp01_id AND g.deleted_at IS NULL;

INSERT INTO checkpoint_submission_files (
  submission_id, file_name, file_path, file_url, file_type, mime_type, file_size,
  uploaded_by, upload_status
)
SELECT
  s.id,
  CONCAT(g.group_code, '_cp1.pdf'),
  CONCAT('demo/sp2026/de18sp01/checkpoints/cp1/', g.group_code, '.pdf'),
  CONCAT('/ehub/demo/sp2026/de18sp01/checkpoints/cp1/', g.group_code, '.pdf'),
  'pdf', 'application/pdf', 410000, s.submitted_by, 'uploaded'
FROM checkpoint_submissions s
JOIN `groups` g ON g.id = s.group_id
WHERE s.checkpoint_id = @chk1_id;

INSERT INTO checkpoint_submission_files (
  submission_id, file_name, file_path, file_url, file_type, mime_type, file_size,
  uploaded_by, upload_status
)
SELECT
  s.id,
  CONCAT(g.group_code, '_cp2.pptx'),
  CONCAT('demo/sp2026/de18sp01/checkpoints/cp2/', g.group_code, '.pptx'),
  CONCAT('/ehub/demo/sp2026/de18sp01/checkpoints/cp2/', g.group_code, '.pptx'),
  'pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  820000, s.submitted_by, 'uploaded'
FROM checkpoint_submissions s
JOIN `groups` g ON g.id = s.group_id
WHERE s.checkpoint_id = @chk2_id;

-- -------------------------------------------
-- Summary
-- -------------------------------------------
SELECT
  @class_sp01_id AS class_id,
  (SELECT COUNT(*) FROM mentor_assignments WHERE class_id = @class_sp01_id AND note LIKE '[SP2026-DEMO]%') AS mentor_assignments,
  (SELECT COUNT(*) FROM mentoring_sessions WHERE class_id = @class_sp01_id AND title LIKE '[SP2026-DEMO]%') AS mentoring_sessions,
  (SELECT COUNT(*) FROM assignments WHERE id IN (@asgn1_id, @asgn2_id)) AS assignments,
  (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id IN (@asgn1_id, @asgn2_id)) AS assignment_submissions,
  (SELECT COUNT(*) FROM checkpoints WHERE id IN (@chk1_id, @chk2_id)) AS checkpoints,
  (SELECT COUNT(*) FROM checkpoint_submissions WHERE checkpoint_id IN (@chk1_id, @chk2_id)) AS checkpoint_submissions;
