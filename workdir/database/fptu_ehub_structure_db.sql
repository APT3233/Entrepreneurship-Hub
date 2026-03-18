-- =============================================
-- MODULE 1: CORE MANAGEMENT — E-HUB PLATFORM
-- Database: MySQL 8.0+
-- Charset : utf8mb4 / Collation: utf8mb4_unicode_ci
-- =============================================
SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci';


-- -------------------------------------------
-- BẢNG 1: users — Tài khoản người dùng
-- Tất cả actor trong hệ thống (GV, SV, Admin)
-- -------------------------------------------
CREATE TABLE users (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50)   NOT NULL,
    email           VARCHAR(150)  NOT NULL,
    password        VARCHAR(255)       NULL
                        COMMENT 'NULL nếu đăng nhập bằng Google',
    full_name       VARCHAR(150)  NOT NULL,
    phone           VARCHAR(20)       NULL,
    avatar_url      VARCHAR(500)      NULL,

    -- Đăng nhập bằng Google
    google_id       VARCHAR(50)       NULL
                        COMMENT 'Google sub (id từ OAuth)',
    auth_provider   ENUM('local','google') DEFAULT 'local' NOT NULL
                        COMMENT 'Nguồn đăng nhập: local | google',

    status          ENUM('active','inactive','locked')
                        DEFAULT 'active'        NOT NULL,

    last_login_at   TIMESTAMP         NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP     NOT NULL,
    deleted_at      TIMESTAMP         NULL,

    -- Indexes
    UNIQUE KEY uk_users_username  (username),
    UNIQUE KEY uk_users_email     (email),
    UNIQUE KEY uk_users_google_id (google_id),
    INDEX      idx_users_status   (status),
    INDEX      idx_users_auth_provider (auth_provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tài khoản người dùng hệ thống E-HUB';


-- -------------------------------------------
-- BẢNG 2: roles — Vai trò hệ thống 
-- -------------------------------------------
CREATE TABLE roles (
    id          SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_code   VARCHAR(30)  NOT NULL,
    role_name   VARCHAR(100) NOT NULL,
    description TEXT             NULL,
    is_system   TINYINT(1)   DEFAULT 0 NOT NULL
                COMMENT 'Vai trò hệ thống không được xoá',

    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP     NOT NULL,

    UNIQUE KEY uk_roles_code (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Vai trò trong hệ thống (RBAC)';


-- -------------------------------------------
-- BẢNG 3: permissions — Quyền hạn
-- -------------------------------------------
CREATE TABLE permissions (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    permission_code VARCHAR(80)  NOT NULL,
    permission_name VARCHAR(150) NOT NULL,
    module          VARCHAR(50)  NOT NULL
                    COMMENT 'Module sở hữu: core, grading, council, event...',
    description     TEXT             NULL,

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    UNIQUE KEY uk_perm_code (permission_code),
    INDEX      idx_perm_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Danh sách quyền hạn (RBAC)';


-- -------------------------------------------
-- BẢNG 4: role_permissions — Gán quyền cho vai trò
-- -------------------------------------------
CREATE TABLE role_permissions (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id       SMALLINT UNSIGNED NOT NULL,
    permission_id INT UNSIGNED NOT NULL,

    UNIQUE KEY uk_role_perm (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Mapping vai trò ↔ quyền hạn';


-- -------------------------------------------
-- BẢNG 5: user_roles — Gán vai trò cho user
-- -------------------------------------------
CREATE TABLE user_roles (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    role_id     SMALLINT UNSIGNED NOT NULL,
    assigned_by BIGINT UNSIGNED     NULL
                COMMENT 'Ai đã gán vai trò này',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    UNIQUE KEY uk_user_role (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Mapping user ↔ vai trò';


-- -------------------------------------------
-- BẢNG 5b: users_profile — Thông tin mở rộng của user (1-1)
-- Hồ sơ cá nhân: bio, ngày sinh, địa chỉ, locale...
-- -------------------------------------------
CREATE TABLE users_profile (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT UNSIGNED NOT NULL
                 COMMENT 'FK users — mỗi user tối đa 1 profile',

    display_name VARCHAR(150)     NULL
                 COMMENT 'Tên hiển thị (có thể khác full_name)',
    bio          TEXT            NULL,
    date_of_birth DATE           NULL,
    gender       ENUM('male','female','other') NULL,
    address      VARCHAR(255)    NULL,
    locale       VARCHAR(10)     NULL
                 COMMENT 'VD: vi, en',
    timezone     VARCHAR(50)     NULL
                 COMMENT 'VD: Asia/Ho_Chi_Minh',

    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                     ON UPDATE CURRENT_TIMESTAMP     NOT NULL,

    UNIQUE KEY uk_profile_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------
-- BẢNG 6: subjects — Học phần 
-- -------------------------------------------
CREATE TABLE subjects (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    subject_code    VARCHAR(20)  NOT NULL
                    COMMENT 'Mã học phần: EXE101, EXE201',
    subject_name    VARCHAR(200) NOT NULL,
    subject_name_en VARCHAR(200)     NULL,
    description     TEXT             NULL,
    credits         TINYINT UNSIGNED DEFAULT 0 NOT NULL,

    status          ENUM('active','inactive')
                        DEFAULT 'active'   NOT NULL,

    created_by      BIGINT UNSIGNED    NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP     NOT NULL,
    deleted_at      TIMESTAMP          NULL,

    UNIQUE KEY uk_subject_code (subject_code),
    INDEX      idx_subject_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Học phần (EXE101 - Experiential Entrepreneurship 1, ...)';


-- -------------------------------------------
-- BẢNG 7: semesters — Học kỳ 
-- -------------------------------------------
CREATE TABLE semesters (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    semester_code VARCHAR(20)  NOT NULL
                  COMMENT 'Mã kỳ: SP2025, SU2025, FA2025',
    semester_name VARCHAR(100) NOT NULL
                  COMMENT 'Tên hiển thị: Spring 2025',
    year          SMALLINT UNSIGNED NOT NULL,
    start_date    DATE         NOT NULL,
    end_date      DATE         NOT NULL,

    status        ENUM('upcoming','ongoing','completed')
                      DEFAULT 'upcoming'  NOT NULL,

    created_by    BIGINT UNSIGNED   NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP     NOT NULL,
    deleted_at    TIMESTAMP         NULL,

    UNIQUE KEY uk_semester_code (semester_code),
    INDEX      idx_semester_status (status),
    INDEX      idx_semester_year   (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Học kỳ';


-- -------------------------------------------
-- BẢNG 8: classes — Lớp học
-- Giao điểm của Học phần + Học kỳ + Section
-- -------------------------------------------
CREATE TABLE classes (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    subject_id       INT UNSIGNED NOT NULL,
    semester_id      INT UNSIGNED NOT NULL,

    class_code       VARCHAR(50)  NOT NULL
                     COMMENT 'Mã lớp: SE1856, SE1857...',
    class_name       VARCHAR(200)     NULL
                     COMMENT 'Tên hiển thị tuỳ chọn',

    lecturer_id      BIGINT UNSIGNED  NULL
                     COMMENT 'Giảng viên phụ trách chính',

    max_students     SMALLINT UNSIGNED DEFAULT 40  NOT NULL,
    min_group_members TINYINT UNSIGNED DEFAULT 4   NOT NULL,
    max_group_members TINYINT UNSIGNED DEFAULT 6   NOT NULL,

    status           ENUM('draft','active','completed','archived')
                         DEFAULT 'draft'   NOT NULL,

    created_by       BIGINT UNSIGNED   NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP     NOT NULL,
    deleted_at       TIMESTAMP         NULL,

    -- Cùng mã lớp + cùng kỳ → duy nhất
    UNIQUE KEY uk_class_semester (class_code, semester_id),
    INDEX      idx_class_subject  (subject_id),
    INDEX      idx_class_semester (semester_id),
    INDEX      idx_class_lecturer (lecturer_id),
    INDEX      idx_class_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lớp học = Học phần + Học kỳ + Section';


-- -------------------------------------------
-- BẢNG 9: students — Sinh viên
-- Tồn tại độc lập, liên kết user nếu có tài khoản
-- -------------------------------------------
CREATE TABLE students (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT UNSIGNED      NULL
                 COMMENT 'Liên kết tài khoản nếu SV có login',
    student_code VARCHAR(20)  NOT NULL
                 COMMENT 'MSSV: SE170001, HE170002...',
    full_name    VARCHAR(150) NOT NULL,
    email        VARCHAR(150) NOT NULL,
    phone        VARCHAR(20)      NULL,
    major        VARCHAR(100)     NULL
                 COMMENT 'Ngành: Software Engineering, Business Admin...',
    campus       VARCHAR(50)      NULL
                 COMMENT 'Cơ sở: HCM, HN, DN, CT',

    status       ENUM('active','inactive','graduated','suspended')
                     DEFAULT 'inactive'  NOT NULL,

    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                     ON UPDATE CURRENT_TIMESTAMP     NOT NULL,
    deleted_at   TIMESTAMP        NULL,

    UNIQUE KEY uk_student_code  (student_code),
    UNIQUE KEY uk_student_user  (user_id),
    INDEX      idx_student_email  (email),
    INDEX      idx_student_status (status),
    INDEX      idx_student_major  (major)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Sinh viên — Single Source of Truth';


-- -------------------------------------------
-- BẢNG 10: class_students — Đăng ký lớp (Enrollment)
-- Sinh viên ↔ Lớp học (Many-to-Many)
-- -------------------------------------------
CREATE TABLE class_students (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    class_id    INT UNSIGNED NOT NULL,
    student_id  BIGINT UNSIGNED NOT NULL,

    status      ENUM('enrolled','dropped','completed')
                    DEFAULT 'enrolled' NOT NULL,

    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dropped_at  TIMESTAMP     NULL,
    note        TEXT          NULL,

    UNIQUE KEY uk_class_student (class_id, student_id),
    INDEX      idx_cs_student   (student_id),
    INDEX      idx_cs_status    (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Enrollment — Sinh viên đăng ký vào lớp';


-- -------------------------------------------
-- BẢNG 11: `groups` — Nhóm / Team khởi nghiệp
-- Thuộc về 1 lớp cụ thể
-- -------------------------------------------
CREATE TABLE `groups` (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    class_id      INT UNSIGNED NOT NULL,
    group_code    VARCHAR(50)  NOT NULL
                  COMMENT 'Mã nhóm: G01, G02... hoặc tự sinh',
    group_name    VARCHAR(200) NOT NULL
                  COMMENT 'Tên team / startup',
    description   TEXT             NULL,

    max_members   TINYINT UNSIGNED DEFAULT 6 NOT NULL,

    status        ENUM('forming','active','inactive','completed','dissolved')
                      DEFAULT 'forming' NOT NULL,

    created_by    BIGINT UNSIGNED   NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP     NOT NULL,
    deleted_at    TIMESTAMP         NULL,

    UNIQUE KEY uk_group_class (group_code, class_id),
    INDEX      idx_group_class  (class_id),
    INDEX      idx_group_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Nhóm / Team khởi nghiệp trong lớp';


-- -------------------------------------------
-- BẢNG 12: group_members — Thành viên nhóm
-- -------------------------------------------
CREATE TABLE group_members (
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id   BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,

    role       ENUM('leader','member')
                   DEFAULT 'member'  NOT NULL,

    status     ENUM('active','left','removed')
                   DEFAULT 'active'  NOT NULL,

    joined_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    left_at    TIMESTAMP     NULL,
    note       TEXT          NULL,

    -- 1 SV chỉ thuộc 1 nhóm trong cùng 1 group
    UNIQUE KEY uk_group_student (group_id, student_id),
    INDEX      idx_gm_student   (student_id),
    INDEX      idx_gm_status    (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Thành viên nhóm';

-- -------------------------------------------
-- BẢNG 13: audit_logs — Nhật ký thao tác
-- Ghi lại mọi thay đổi → bảo toàn lịch sử
-- -------------------------------------------
CREATE TABLE audit_logs (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED     NULL,

    action      ENUM('create','update','delete','restore',
                     'export','import','login','logout')  NOT NULL,

    table_name  VARCHAR(64)  NOT NULL,
    record_id   BIGINT UNSIGNED  NULL,

    old_values  JSON         NULL COMMENT 'Giá trị trước thay đổi',
    new_values  JSON         NULL COMMENT 'Giá trị sau thay đổi',

    ip_address  VARCHAR(45)      NULL,
    user_agent  VARCHAR(500)     NULL,

    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    INDEX idx_audit_table_record (table_name, record_id),
    INDEX idx_audit_user         (user_id),
    INDEX idx_audit_action       (action),
    INDEX idx_audit_created      (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Nhật ký thao tác — audit trail toàn hệ thống';


-- -------------------------------------------
-- BẢNG 14: import_logs — Lịch sử import dữ liệu
-- Tracking khi GV import Excel/CSV
-- -------------------------------------------
CREATE TABLE import_logs (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT UNSIGNED NOT NULL,
    file_name      VARCHAR(255)    NOT NULL,
    file_path      VARCHAR(500)        NULL,
    target_table   VARCHAR(64)     NOT NULL
                   COMMENT 'Bảng đích: students, class_students...',
    target_class_id INT UNSIGNED      NULL,

    total_rows     INT UNSIGNED DEFAULT 0 NOT NULL,
    success_rows   INT UNSIGNED DEFAULT 0 NOT NULL,
    failed_rows    INT UNSIGNED DEFAULT 0 NOT NULL,
    error_details  JSON               NULL
                   COMMENT '[{row: 5, field: "email", error: "duplicate"}]',

    status         ENUM('processing','completed','failed','cancelled')
                       DEFAULT 'processing' NOT NULL,

    started_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at   TIMESTAMP      NULL,

    INDEX idx_import_user   (user_id),
    INDEX idx_import_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lịch sử import file Excel/CSV';


-- -------------------------------------------
-- BẢNG 15: system_settings — Cấu hình module
-- -------------------------------------------
CREATE TABLE system_settings (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT        NOT NULL,
    data_type   ENUM('string','integer','boolean','json')
                    DEFAULT 'string' NOT NULL,
    module      VARCHAR(50)  DEFAULT 'core' NOT NULL,
    description VARCHAR(255)     NULL,

    updated_by  BIGINT UNSIGNED  NULL,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP NOT NULL,

    UNIQUE KEY uk_setting_key (setting_key, module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Cấu hình hệ thống theo module';


-- -------------------------------------------
-- BẢNG 16: api_access_logs — Nhật ký truy cập API
-- Ghi lại mọi request đến API (auth, CRUD, export...)
-- -------------------------------------------
CREATE TABLE api_access_logs (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id    VARCHAR(100)     NULL
                  COMMENT 'UUID của request từ middleware',
    method        VARCHAR(10)  NOT NULL
                  COMMENT 'HTTP method: GET, POST, PUT, DELETE...',
    path          VARCHAR(500) NOT NULL
                  COMMENT 'API endpoint path',
    ip_address    VARCHAR(45)      NULL
                  COMMENT 'IPv4 hoặc IPv6',
    user_id       BIGINT UNSIGNED  NULL
                  COMMENT 'User thực hiện request (nếu authenticated)',
    status_code   SMALLINT UNSIGNED NULL
                  COMMENT 'HTTP status code: 200, 401, 500...',
    response_time INT UNSIGNED     NULL
                  COMMENT 'Thời gian xử lý (ms)',
    user_agent    TEXT             NULL
                  COMMENT 'Browser / Client info',
    
    timestamp     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    INDEX idx_access_user      (user_id),
    INDEX idx_access_timestamp (timestamp),
    INDEX idx_access_status    (status_code),
    INDEX idx_access_path      (path(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Nhật ký truy cập API — tracking requests';

-- =============================================
-- 2. ĐỊNH NGHĨA KHOÁ NGOẠI (FOREIGN KEYS) & CHECK
-- =============================================

-- role_permissions
ALTER TABLE role_permissions
    ADD CONSTRAINT fk_rp_role       FOREIGN KEY (role_id)       REFERENCES roles(id)       ON DELETE CASCADE,
    ADD CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;

-- user_roles
ALTER TABLE user_roles
    ADD CONSTRAINT fk_ur_user     FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_ur_role     FOREIGN KEY (role_id)     REFERENCES roles(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_ur_assigner FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;

-- users_profile
ALTER TABLE users_profile
    ADD CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- subjects
ALTER TABLE subjects
    ADD CONSTRAINT fk_subject_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- semesters
ALTER TABLE semesters
    ADD CONSTRAINT fk_semester_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT chk_semester_dates  CHECK (start_date < end_date);

-- classes
ALTER TABLE classes
    ADD CONSTRAINT fk_class_subject  FOREIGN KEY (subject_id)  REFERENCES subjects(id)  ON DELETE RESTRICT,
    ADD CONSTRAINT fk_class_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_class_lecturer  FOREIGN KEY (lecturer_id)  REFERENCES users(id)     ON DELETE SET NULL,
    ADD CONSTRAINT fk_class_creator  FOREIGN KEY (created_by)  REFERENCES users(id)     ON DELETE SET NULL,
    ADD CONSTRAINT chk_group_members CHECK (min_group_members <= max_group_members);

-- students
ALTER TABLE students
    ADD CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- class_students
ALTER TABLE class_students
    ADD CONSTRAINT fk_cs_class   FOREIGN KEY (class_id)   REFERENCES classes(id)  ON DELETE RESTRICT,
    ADD CONSTRAINT fk_cs_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT;

-- groups
ALTER TABLE `groups`
    ADD CONSTRAINT fk_group_class   FOREIGN KEY (class_id)   REFERENCES classes(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_group_creator FOREIGN KEY (created_by) REFERENCES users(id)   ON DELETE SET NULL;

-- group_members
ALTER TABLE group_members
    ADD CONSTRAINT fk_gm_group   FOREIGN KEY (group_id)   REFERENCES `groups`(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_gm_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT;

-- audit_logs
ALTER TABLE audit_logs
    ADD CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- import_logs
ALTER TABLE import_logs
    ADD CONSTRAINT fk_import_user  FOREIGN KEY (user_id)         REFERENCES users(id)   ON DELETE RESTRICT,
    ADD CONSTRAINT fk_import_class FOREIGN KEY (target_class_id) REFERENCES classes(id) ON DELETE SET NULL;

-- system_settings
ALTER TABLE system_settings
    ADD CONSTRAINT fk_setting_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- api_access_logs
ALTER TABLE api_access_logs
    ADD CONSTRAINT fk_access_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;


-- =============================================
-- 3. SEED DATA MẪU
-- =============================================

-- Roles
INSERT INTO roles (role_code, role_name, description, is_system) VALUES
('admin',          'Quản trị viên',        'Toàn quyền hệ thống',                    1),
('department_head','Trưởng bộ môn',        'Quản lý bộ môn Khởi nghiệp',             1),
('lecturer',       'Giảng viên',           'GV bộ môn — CRUD dữ liệu lõi',           1),
('student',        'Sinh viên',            'Chỉ đọc dữ liệu & thao tác nhóm mình',  1),
('guest',          'Khách',                'Chỉ xem dữ liệu public',                 1);

-- Permissions cho Module Core
INSERT INTO permissions (permission_code, permission_name, module) VALUES
-- Subject
('core.subject.create',  'Tạo học phần',         'core'),
('core.subject.read',    'Xem học phần',         'core'),
('core.subject.update',  'Sửa học phần',         'core'),
('core.subject.delete',  'Xoá học phần',         'core'),
-- Semester
('core.semester.create',  'Tạo học kỳ',          'core'),
('core.semester.read',    'Xem học kỳ',          'core'),
('core.semester.update',  'Sửa học kỳ',          'core'),
('core.semester.delete',  'Xoá học kỳ',          'core'),
-- Class
('core.class.create',     'Tạo lớp học',         'core'),
('core.class.read',       'Xem lớp học',         'core'),
('core.class.update',     'Sửa lớp học',         'core'),
('core.class.delete',     'Xoá lớp học',         'core'),
-- Student
('core.student.create',   'Thêm sinh viên',      'core'),
('core.student.read',     'Xem sinh viên',       'core'),
('core.student.update',   'Sửa sinh viên',       'core'),
('core.student.delete',   'Xoá sinh viên',       'core'),
('core.student.import',   'Import danh sách SV', 'core'),
-- Group
('core.group.create',     'Tạo nhóm',            'core'),
('core.group.read',       'Xem nhóm',            'core'),
('core.group.update',     'Sửa nhóm',            'core'),
('core.group.delete',     'Xoá nhóm',            'core'),
-- Export
('core.export',           'Xuất dữ liệu',        'core');

-- Gán quyền cho vai trò Lecture (full CRUD)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_code = 'lecturer'
  AND p.module = 'core';

-- Gán quyền cho vai trò Student (chỉ đọc)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_code = 'student'
  AND p.permission_code LIKE 'core.%.read';

-- Admin: toàn quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_code = 'admin';

-- Subjects
INSERT INTO subjects (subject_code, subject_name, subject_name_en, credits) VALUES
('EXE101', 'Khởi nghiệp 1 - Nhận thức',
           'Experiential Entrepreneurship 1', 3),
('EXE201', 'Khởi nghiệp 2 - Thực chiến',
           'Experiential Entrepreneurship 2', 3);

-- System settings
INSERT INTO system_settings (setting_key, setting_value, data_type, module, description) VALUES
('default_max_students',      '40',    'integer', 'core', 'Số SV tối đa mặc định / lớp'),
('default_min_group_members', '4',     'integer', 'core', 'Số thành viên tối thiểu / nhóm'),
('default_max_group_members', '6',     'integer', 'core', 'Số thành viên tối đa / nhóm'),
('current_semester_id',       '1',     'integer', 'core', 'ID học kỳ hiện tại'),
('export_formats',            '["xlsx","csv"]', 'json', 'core', 'Định dạng xuất hỗ trợ');

-- =============================================
-- 4. VIEWS (QUẢN TRỊ DỮ LIỆU)
-- =============================================

-- View: Tổng quan lớp học kèm thống kê
CREATE OR REPLACE VIEW v_class_overview AS
SELECT
    c.id                AS class_id,
    c.class_code,
    sub.subject_code,
    sub.subject_name,
    sem.semester_code,
    sem.semester_name,
    u.full_name         AS lecturer_name,
    c.max_students,
    COUNT(DISTINCT cs.student_id)   AS enrolled_count,
    COUNT(DISTINCT g.id)            AS group_count,
    c.status            AS class_status
FROM classes c
    JOIN subjects sub   ON sub.id = c.subject_id
    JOIN semesters sem  ON sem.id = c.semester_id
    LEFT JOIN users u   ON u.id  = c.lecturer_id
    LEFT JOIN class_students cs
        ON cs.class_id = c.id AND cs.status = 'enrolled'
    LEFT JOIN `groups` g
        ON g.class_id = c.id AND g.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.class_code, sub.subject_code, sub.subject_name,
         sem.semester_code, sem.semester_name, u.full_name,
         c.max_students, c.status;

-- View: Danh sách SV chưa có nhóm trong lớp
CREATE OR REPLACE VIEW v_students_without_group AS
SELECT
    cs.class_id,
    c.class_code,
    s.id            AS student_id,
    s.student_code,
    s.full_name,
    s.email
FROM class_students cs
    JOIN students s ON s.id = cs.student_id
    JOIN classes c  ON c.id = cs.class_id
WHERE cs.status = 'enrolled'
  AND NOT EXISTS (
      SELECT 1
      FROM group_members gm
          JOIN `groups` g ON g.id = gm.group_id
      WHERE gm.student_id = s.id
        AND g.class_id    = cs.class_id
        AND gm.status     = 'active'
  );
