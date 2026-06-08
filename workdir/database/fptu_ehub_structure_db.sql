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
    campus          VARCHAR(50)       NULL
                        COMMENT 'Cơ sở: Hà Nội, Đà Nẵng, Quy Nhơn, Cần Thơ, Hồ Chí Minh',
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
-- BẢNG 5c: lecturer_profiles — Hồ sơ nghiệp vụ giảng viên
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS lecturer_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    department VARCHAR(150) NULL,
    academic_title VARCHAR(100) NULL,
    specialization VARCHAR(255) NULL,
    office_location VARCHAR(255) NULL,
    contact_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY uk_lecturer_profile_user (user_id),
    CONSTRAINT fk_lecturer_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

    status       ENUM('active','inactive','graduated','suspended','pending')
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
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

    UNIQUE KEY uk_class_student (class_id, student_id),
    INDEX      idx_cs_student   (student_id),
    INDEX      idx_cs_status    (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Enrollment — Sinh viên đăng ký vào lớp';


-- -------------------------------------------
-- BẢNG 10a: outbox_events — Transactional outbox
-- -------------------------------------------
CREATE TABLE outbox_events (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id     CHAR(36)      NOT NULL COMMENT 'UUID một dòng outbox (mỗi chunk một public_id)',
    dispatch_public_id CHAR(36)   NULL COMMENT 'UUID lô gửi mail = mail_dispatch_id; mọi chunk cùng giá trị',
    event_type    VARCHAR(64)   NOT NULL,
    payload       JSON          NOT NULL,
    status        ENUM('pending','processing','done','failed','dead') NOT NULL DEFAULT 'pending',
    attempts      INT UNSIGNED  NOT NULL DEFAULT 0,
    next_retry_at DATETIME      NULL,
    last_error    TEXT          NULL,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    processed_at  TIMESTAMP     NULL,

    UNIQUE KEY uk_outbox_public_id (public_id),
    KEY idx_outbox_worker (status, next_retry_at, id),
    KEY idx_outbox_dispatch_public (dispatch_public_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Transactional outbox for async side effects';


-- -------------------------------------------
-- BẢNG 10b: class_invites — Mời / kích hoạt sinh viên vào lớp (token email)
-- -------------------------------------------
CREATE TABLE class_invites (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email        VARCHAR(150) NOT NULL,
    student_id   BIGINT UNSIGNED NOT NULL,
    class_id     INT UNSIGNED NOT NULL,
    outbox_id    BIGINT UNSIGNED NULL
                 COMMENT 'Batch dispatch job (NULL = legacy / manual)',
    token        VARCHAR(64)  NOT NULL
                 COMMENT 'hex from crypto.randomBytes(32)',
    expires_at   DATETIME     NOT NULL,
    used         TINYINT(1)   NOT NULL DEFAULT 0,
    email_delivery_status ENUM('queued','sending','sent','failed') NULL DEFAULT NULL,
    email_attempts INT UNSIGNED NOT NULL DEFAULT 0,
    email_last_error VARCHAR(512) NULL,
    email_sent_at TIMESTAMP NULL,
    email_next_retry_at DATETIME NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    UNIQUE KEY uk_class_invites_token (token),
    INDEX idx_class_invites_student_class (student_id, class_id),
    INDEX idx_class_invites_expires (expires_at),
    INDEX idx_class_invites_outbox_status (outbox_id, email_delivery_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Email activation tokens for students added to a class';


-- -------------------------------------------
-- BẢNG 10c: inbox_events — Idempotency after successful SMTP
-- -------------------------------------------
CREATE TABLE inbox_events (
    idempotency_key VARCHAR(191) NOT NULL PRIMARY KEY COMMENT 'e.g. invite_smtp:{class_invites.id} | group_invite_smtp:{id}',
    outbox_id       BIGINT UNSIGNED NOT NULL,
    invite_id       BIGINT UNSIGNED NULL
                    COMMENT 'FK → class_invites.id (lời mời lớp; XOR với group_invite_id)',
    group_invite_id BIGINT UNSIGNED NULL
                    COMMENT 'Group join invite',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    KEY idx_inbox_outbox (outbox_id),
    KEY idx_inbox_invite (invite_id),
    KEY idx_inbox_group_invite (group_invite_id),
    CONSTRAINT chk_inbox_one_target CHECK (
      (invite_id IS NOT NULL AND group_invite_id IS NULL)
      OR (invite_id IS NULL AND group_invite_id IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Idempotency after successful SMTP send';


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
    category      VARCHAR(100)     NULL
                      COMMENT 'Danh mục: Web, Mobile, AI...',
    topic         VARCHAR(500)     NULL
                      COMMENT 'Tên đề tài / ý tưởng khởi nghiệp',
    topic_desc    TEXT             NULL
                      COMMENT 'Mô tả chi tiết đề tài',
    zalo_link     VARCHAR(500)     NULL
                      COMMENT 'Link nhóm Zalo của team',
    mentor_name   VARCHAR(200)     NULL
                      COMMENT 'Tên Mentor (nếu khác GV)',
    mentor_dept   VARCHAR(200)     NULL
                      COMMENT 'Khoa/Phòng ban của Mentor',

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

    -- 1 SV chỉ thuộc 1 nhóm trong cùng 1 group
    UNIQUE KEY uk_group_student (group_id, student_id),
    INDEX      idx_gm_student   (student_id),
    INDEX      idx_gm_status    (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Thành viên nhóm';


-- -------------------------------------------
-- BẢNG 12b: group_invites — Mời tham gia nhóm (email → accept/decline)
-- -------------------------------------------
CREATE TABLE group_invites (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id     BIGINT UNSIGNED NOT NULL,
    student_id   BIGINT UNSIGNED NOT NULL,
    token        VARCHAR(64)  NOT NULL
                 COMMENT 'hex from crypto.randomBytes(32)',
    intended_role ENUM('leader','member') NOT NULL DEFAULT 'member',

    status       ENUM('pending','accepted','declined','expired','revoked')
                     DEFAULT 'pending' NOT NULL,

    expires_at   DATETIME     NOT NULL,
    invited_by   BIGINT UNSIGNED NULL,
    outbox_id    BIGINT UNSIGNED NULL,

    email_delivery_status ENUM('queued','sending','sent','failed') NULL DEFAULT NULL,
    email_attempts INT UNSIGNED NOT NULL DEFAULT 0,
    email_last_error VARCHAR(512) NULL,
    email_sent_at TIMESTAMP NULL,
    email_next_retry_at DATETIME NULL,

    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    UNIQUE KEY uk_group_invites_token (token),
    KEY idx_gi_group_student (group_id, student_id),
    KEY idx_gi_outbox_status (outbox_id, email_delivery_status),
    KEY idx_gi_student_status (student_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Pending group membership until student accepts';


-- -------------------------------------------
-- BẢNG 12c: group_invite_reports — Sinh viên báo sai thông tin nhóm
-- -------------------------------------------
CREATE TABLE group_invite_reports (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_invite_id BIGINT UNSIGNED NOT NULL,
    group_id       BIGINT UNSIGNED NOT NULL,
    student_id     BIGINT UNSIGNED NOT NULL,
    issue_type     ENUM('group_name','category','topic','member','other') NOT NULL,
    description    TEXT NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    KEY idx_gir_group (group_id),
    KEY idx_gir_student (student_id),
    KEY idx_gir_created (created_at),
    KEY idx_gir_invite (group_invite_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Sinh viên báo sai thông tin lời mời nhóm';

-- -------------------------------------------
-- BẢNG 13: audit_logs — Nhật ký thao tác
-- Ghi lại mọi thay đổi → bảo toàn lịch sử
-- -------------------------------------------
CREATE TABLE audit_logs (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED     NULL,

    action      VARCHAR(64)  NOT NULL,

    table_name  VARCHAR(64)  NOT NULL,
    record_id   BIGINT UNSIGNED  NULL,
    title       VARCHAR(200) NULL,

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

-- class_invites
ALTER TABLE class_invites
    ADD CONSTRAINT fk_class_invites_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_class_invites_class   FOREIGN KEY (class_id)   REFERENCES classes(id)   ON DELETE CASCADE,
    ADD CONSTRAINT fk_class_invites_outbox   FOREIGN KEY (outbox_id)   REFERENCES outbox_events(id) ON DELETE SET NULL;

-- inbox_events
ALTER TABLE inbox_events
    ADD CONSTRAINT fk_inbox_outbox FOREIGN KEY (outbox_id) REFERENCES outbox_events(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_inbox_invite FOREIGN KEY (invite_id) REFERENCES class_invites(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_inbox_group_invite FOREIGN KEY (group_invite_id) REFERENCES group_invites(id) ON DELETE CASCADE;

-- group_invites
ALTER TABLE group_invites
    ADD CONSTRAINT fk_gi_group   FOREIGN KEY (group_id)   REFERENCES `groups`(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_gi_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_gi_inviter FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_gi_outbox   FOREIGN KEY (outbox_id) REFERENCES outbox_events(id) ON DELETE SET NULL;

-- group_invite_reports
ALTER TABLE group_invite_reports
    ADD CONSTRAINT fk_gir_invite FOREIGN KEY (group_invite_id) REFERENCES group_invites(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_gir_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_gir_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

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

INSERT INTO permissions (permission_code, permission_name, module, description) VALUES
('core.lecturer.read', 'View lecturers', 'core', 'View lecturer management data'),
('core.lecturer.create', 'Create lecturers', 'core', 'Create lecturer accounts'),
('core.lecturer.update', 'Update lecturers', 'core', 'Update lecturer account and profile data'),
('core.lecturer.assign_class', 'Assign lecturer to class', 'core', 'Assign or change primary lecturer of a class'),
('core.lecturer.view_workload', 'View lecturer workload', 'core', 'View lecturer workload and grading progress'),
('core.lecturer.view_activity', 'View lecturer activity', 'core', 'View lecturer audit and API activity'),
('core.lecturer.export', 'Export lecturers', 'core', 'Export lecturer management data'),
('core.lecturer.delete', 'Delete lecturers', 'core', 'Delete lecturer accounts that are not assigned to any class');

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


-- =============================================
-- MODULE 2: CHECKPOINT — Nộp bài & Chấm điểm
-- =============================================

-- -------------------------------------------
-- BẢNG 17: checkpoints — Định nghĩa các mốc checkpoint
-- Mỗi lớp học có nhiều checkpoint (do GV tạo)
-- -------------------------------------------
CREATE TABLE checkpoints (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    class_id      INT UNSIGNED    NOT NULL
                  COMMENT 'Thuộc lớp học nào',
    title         VARCHAR(200)    NOT NULL
                  COMMENT 'Tên checkpoint: Checkpoint 1 - Ý tưởng',
    description   TEXT                NULL
                  COMMENT 'Hướng dẫn nộp bài, yêu cầu cụ thể',
    order_index   TINYINT UNSIGNED DEFAULT 1 NOT NULL
                  COMMENT 'Thứ tự hiển thị (1, 2, 3...)',

    -- Thời gian
    deadline      DATETIME        NOT NULL
                  COMMENT 'Hạn nộp bài của nhóm',
    open_at       DATETIME            NULL
                  COMMENT 'Thời điểm mở cho phép nộp (NULL = mở ngay)',

    -- Thang điểm
    max_score     DECIMAL(5,2)    DEFAULT 10.00 NOT NULL
                  COMMENT 'Điểm tối đa (vd: 10, 100)',
    weight        DECIMAL(5,2)    DEFAULT 1.00  NOT NULL
                  COMMENT 'Hệ số điểm (vd: 0.3 = 30%)',

    -- Yêu cầu file
    required_file_types VARCHAR(200)  NULL
                  COMMENT 'Các loại file được chấp nhận: pdf,docx,pptx',
    max_file_size_mb    SMALLINT UNSIGNED DEFAULT 20 NOT NULL
                  COMMENT 'Giới hạn dung lượng mỗi file (MB)',
    max_files           TINYINT UNSIGNED  DEFAULT 5  NOT NULL
                  COMMENT 'Số file tối đa được nộp',
    attachment_url      TEXT              NULL
                  COMMENT 'File đính kèm GV: một link hoặc JSON ["url1",...] (tối đa 5)',

    status        ENUM('draft','open','closed','archived')
                      DEFAULT 'draft' NOT NULL
                  COMMENT 'draft=chưa mở, open=đang nhận bài, closed=đã đóng',

    created_by    BIGINT UNSIGNED  NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP     NOT NULL,
    deleted_at    TIMESTAMP        NULL,

    INDEX idx_cp_class      (class_id),
    INDEX idx_cp_deadline   (deadline),
    INDEX idx_cp_status     (status),
    INDEX idx_cp_order      (class_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Định nghĩa checkpoint của từng lớp học';


-- -------------------------------------------
-- BẢNG 18: checkpoint_submissions — Bài nộp của từng nhóm
-- Trạng thái: not_submitted / submitted / graded / resubmitted
-- -------------------------------------------
CREATE TABLE checkpoint_submissions (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    checkpoint_id  BIGINT UNSIGNED NOT NULL,
    group_id       BIGINT UNSIGNED NOT NULL,

    -- Thông tin nộp bài
    submitted_by   BIGINT UNSIGNED     NULL
                   COMMENT 'Student hoặc User đã nhấn nộp',
    submitted_at   DATETIME            NULL
                   COMMENT 'Thời điểm nộp (NULL = chưa nộp)',
    is_late        TINYINT(1)  DEFAULT 0 NOT NULL
                   COMMENT '1 nếu nộp sau deadline',
    note           TEXT                NULL
                   COMMENT 'Ghi chú của nhóm khi nộp bài',

    -- Thông tin chấm điểm
    score          DECIMAL(5,2)        NULL
                   COMMENT 'Điểm số (NULL = chưa chấm)',
    feedback       TEXT                NULL
                   COMMENT 'Nhận xét của GV (15-20 từ trở lên)',
    graded_by      BIGINT UNSIGNED     NULL
                   COMMENT 'GV chấm điểm (FK users)',
    graded_at      DATETIME            NULL
                   COMMENT 'Thời điểm chấm điểm',

    -- Trạng thái tổng hợp
    -- not_submitted: nhóm chưa nộp
    -- submitted    : đã nộp, chờ chấm
    -- graded       : đã chấm điểm
    -- resubmitted  : nộp lại sau khi đã chấm
    status         ENUM('not_submitted','submitted','graded','resubmitted')
                       DEFAULT 'not_submitted' NOT NULL,

    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                       ON UPDATE CURRENT_TIMESTAMP     NOT NULL,

    -- Mỗi nhóm chỉ có 1 bài nộp cho mỗi checkpoint
    UNIQUE KEY uk_cp_sub_group  (checkpoint_id, group_id),
    INDEX      idx_sub_group    (group_id),
    INDEX      idx_sub_status   (status),
    INDEX      idx_sub_graded   (graded_by),
    INDEX      idx_sub_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bài nộp checkpoint của từng nhóm — lưu trạng thái & điểm';


-- -------------------------------------------
-- BẢNG 19: checkpoint_submission_files — File đính kèm bài nộp
-- Mỗi bài nộp có thể có nhiều file
-- -------------------------------------------
CREATE TABLE checkpoint_submission_files (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    submission_id  BIGINT UNSIGNED NOT NULL
                   COMMENT 'FK checkpoint_submissions',

    file_name      VARCHAR(255)    NOT NULL
                   COMMENT 'Tên file gốc: Bao_cao_y_tuong.pdf',
    file_path      VARCHAR(1000)   NOT NULL
                   COMMENT 'Đường dẫn lưu trữ (relative hoặc URL S3)',
    file_url       VARCHAR(1000)       NULL
                   COMMENT 'Public URL để download/preview',
    file_type      VARCHAR(20)         NULL
                   COMMENT 'Phần mở rộng: pdf, docx, pptx, xlsx...',
    mime_type      VARCHAR(100)        NULL
                   COMMENT 'MIME type: application/pdf',
    file_size      INT UNSIGNED        NULL
                   COMMENT 'Kích thước file (bytes)',

    uploaded_by    BIGINT UNSIGNED     NULL
                   COMMENT 'Ai đã upload file này',
    uploaded_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

    is_deleted     TINYINT(1) DEFAULT 0 NOT NULL
                   COMMENT '1 = đã xoá (soft delete)',
    deleted_at     TIMESTAMP               NULL,

    INDEX idx_sub_files_submission (submission_id),
    INDEX idx_sub_files_uploader   (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='File đính kèm bài nộp checkpoint (PDF, DOCX, PPTX...)';


-- -------------------------------------------
-- FOREIGN KEYS cho Module Checkpoint
-- -------------------------------------------
ALTER TABLE checkpoints
    ADD CONSTRAINT fk_cp_class    FOREIGN KEY (class_id)   REFERENCES classes(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_cp_creator  FOREIGN KEY (created_by) REFERENCES users(id)   ON DELETE SET NULL;

ALTER TABLE checkpoint_submissions
    ADD CONSTRAINT fk_sub_checkpoint  FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id)  ON DELETE RESTRICT,
    ADD CONSTRAINT fk_sub_group       FOREIGN KEY (group_id)      REFERENCES `groups`(id)      ON DELETE RESTRICT,
    ADD CONSTRAINT fk_sub_submitter   FOREIGN KEY (submitted_by)  REFERENCES users(id)         ON DELETE SET NULL,
    ADD CONSTRAINT fk_sub_grader      FOREIGN KEY (graded_by)     REFERENCES users(id)         ON DELETE SET NULL;

ALTER TABLE checkpoint_submission_files
    ADD CONSTRAINT fk_subfile_submission FOREIGN KEY (submission_id) REFERENCES checkpoint_submissions(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_subfile_uploader   FOREIGN KEY (uploaded_by)   REFERENCES users(id)                  ON DELETE SET NULL;


-- -------------------------------------------
-- VIEW: v_checkpoint_status — Trạng thái checkpoint theo nhóm
-- Dùng để hiển thị: Đã chấm / Chưa chấm / Chưa nộp
-- -------------------------------------------
CREATE OR REPLACE VIEW v_checkpoint_status AS
SELECT
    cp.id                  AS checkpoint_id,
    cp.class_id,
    cp.title               AS checkpoint_title,
    cp.order_index,
    cp.deadline,
    cp.max_score,
    cp.weight,
    cp.status              AS checkpoint_status,
    g.id                   AS group_id,
    g.group_name,
    g.group_code,
    -- Trạng thái submission
    CONVERT(COALESCE(sub.status, 'not_submitted') USING utf8mb4) COLLATE utf8mb4_unicode_ci AS submission_status,
    sub.id                 AS submission_id,
    sub.submitted_at,
    sub.is_late,
    sub.score,
    sub.feedback,
    sub.graded_by,
    sub.graded_at,
    -- Số file đã nộp
    COUNT(f.id)            AS file_count,
    -- Tính trạng thái đơn giản để filter nhanh
    CONVERT(CASE
        WHEN sub.id IS NULL                        THEN 'not_submitted'
        WHEN sub.status IN ('submitted', 'resubmitted') THEN 'pending_grading'
        WHEN sub.status = 'graded'                THEN 'graded'
        ELSE 'not_submitted'
    END USING utf8mb4) COLLATE utf8mb4_unicode_ci AS display_status
FROM checkpoints cp
    JOIN `groups` g ON g.class_id = cp.class_id AND g.deleted_at IS NULL
    LEFT JOIN checkpoint_submissions sub
        ON sub.checkpoint_id = cp.id AND sub.group_id = g.id
    LEFT JOIN checkpoint_submission_files f
        ON f.submission_id = sub.id AND f.is_deleted = 0
WHERE cp.deleted_at IS NULL
GROUP BY
    cp.id, cp.class_id, cp.title, cp.order_index, cp.deadline,
    cp.max_score, cp.weight, cp.status,
    g.id, g.group_name, g.group_code,
    sub.id, sub.status, sub.submitted_at, sub.is_late,
    sub.score, sub.feedback, sub.graded_by, sub.graded_at;

-- =============================================
-- MODULE 3: DAILY ASSIGNMENT — Bài tập thường xuyên
-- =============================================

-- -------------------------------------------
-- BẢNG 20: assignments — Định nghĩa bài tập thường xuyên
-- Mỗi lớp có thể có nhiều bài tập
-- -------------------------------------------
CREATE TABLE assignments (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    class_id       INT UNSIGNED    NOT NULL
                  COMMENT 'Thuộc lớp học nào',
    title          VARCHAR(200)    NOT NULL
                  COMMENT 'Tên bài tập',
    description    TEXT                NULL
                  COMMENT 'Mô tả yêu cầu bài tập',
    deadline       DATETIME        NOT NULL
                  COMMENT 'Hạn nộp',
    max_score      DECIMAL(5,2)    DEFAULT 10.00 NOT NULL
                  COMMENT 'Điểm tối đa',
    status         ENUM('open','closed','archived')
                      DEFAULT 'open' NOT NULL
                  COMMENT 'Trạng thái bài tập',
    -- Cấu hình file
    required_file_types VARCHAR(200)  DEFAULT 'pdf,docx' NULL,
    max_file_size_mb    SMALLINT UNSIGNED DEFAULT 20     NULL,
    max_files           TINYINT UNSIGNED  DEFAULT 5      NULL,
    attachment_url      TEXT                             NULL
                        COMMENT 'Đính kèm GV: URL hoặc JSON mảng URL (tối đa 5 file)',
    created_by     BIGINT UNSIGNED  NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP     NOT NULL,
    deleted_at     TIMESTAMP        NULL,
    INDEX idx_assignment_class      (class_id),
    INDEX idx_assignment_status     (status),
    INDEX idx_assignment_deadline   (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bài tập thường xuyên theo lớp';

-- -------------------------------------------
-- BẢNG 21: assignment_submissions — Bài nộp assignment theo nhóm
-- Dùng để tính submittedGroups/need grading
-- -------------------------------------------
CREATE TABLE assignment_submissions (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    assignment_id  BIGINT UNSIGNED NOT NULL,
    group_id       BIGINT UNSIGNED NOT NULL,
    submitted_by   BIGINT UNSIGNED     NULL,
    submitted_at   DATETIME            NULL,
    is_late        TINYINT(1)  DEFAULT 0 NOT NULL,
    note           TEXT                NULL,
    score          DECIMAL(5,2)        NULL,
    feedback       TEXT                NULL,
    graded_by      BIGINT UNSIGNED     NULL,
    graded_at      DATETIME            NULL,
    status         ENUM('not_submitted','submitted','graded','resubmitted')
                       DEFAULT 'not_submitted' NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                       ON UPDATE CURRENT_TIMESTAMP     NOT NULL,
    UNIQUE KEY uk_assignment_sub_group  (assignment_id, group_id),
    INDEX      idx_assignment_sub_group (group_id),
    INDEX      idx_assignment_sub_status (status),
    INDEX      idx_assignment_sub_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bài nộp của nhóm cho bài tập thường xuyên';


-- -------------------------------------------
-- BẢNG 21b: assignment_submission_files — File nộp bài assignment (theo nhóm)
-- Tương tự checkpoint_submission_files; mỗi assignment_submissions có thể có nhiều file
-- -------------------------------------------
CREATE TABLE assignment_submission_files (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    submission_id  BIGINT UNSIGNED NOT NULL
                   COMMENT 'FK assignment_submissions',

    file_name      VARCHAR(255)    NOT NULL
                   COMMENT 'Tên file gốc',
    file_path      VARCHAR(1000)   NOT NULL
                   COMMENT 'Object key / đường dẫn lưu trữ (MinIO)',
    file_url       VARCHAR(1000)       NULL
                   COMMENT 'URL tải/preview sau khi upload',
    file_type      VARCHAR(20)         NULL
                   COMMENT 'Phần mở rộng: pdf, docx...',
    mime_type      VARCHAR(100)        NULL,
    file_size      INT UNSIGNED        NULL
                   COMMENT 'Kích thước (bytes)',

    uploaded_by    BIGINT UNSIGNED     NULL
                   COMMENT 'User nộp file (sinh viên)',
    uploaded_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

    is_deleted     TINYINT(1) DEFAULT 0 NOT NULL
                   COMMENT '1 = soft delete',
    deleted_at     TIMESTAMP               NULL,

    INDEX idx_asf_submission (submission_id),
    INDEX idx_asf_uploader   (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='File nộp assignment theo nhóm';


-- -------------------------------------------
-- FOREIGN KEYS cho Module Assignment
-- -------------------------------------------
ALTER TABLE assignments
    ADD CONSTRAINT fk_assignment_class    FOREIGN KEY (class_id)   REFERENCES classes(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_assignment_creator  FOREIGN KEY (created_by) REFERENCES users(id)   ON DELETE SET NULL;

ALTER TABLE assignment_submissions
    ADD CONSTRAINT fk_assignment_sub_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_assignment_sub_group      FOREIGN KEY (group_id)      REFERENCES `groups`(id)    ON DELETE RESTRICT,
    ADD CONSTRAINT fk_assignment_sub_submitter  FOREIGN KEY (submitted_by)  REFERENCES users(id)       ON DELETE SET NULL,
    ADD CONSTRAINT fk_assignment_sub_grader     FOREIGN KEY (graded_by)     REFERENCES users(id)       ON DELETE SET NULL;

ALTER TABLE assignment_submission_files
    ADD CONSTRAINT fk_asf_submission FOREIGN KEY (submission_id) REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_asf_uploader   FOREIGN KEY (uploaded_by)   REFERENCES users(id)               ON DELETE SET NULL;

-- =============================================
-- MODULE 3: EVALUATION - Rubric-based grading
-- =============================================

CREATE TABLE rubrics (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    subject_id    INT UNSIGNED NULL,
    name          VARCHAR(200) NOT NULL,
    description   TEXT NULL,
    total_score   DECIMAL(7,2) DEFAULT 10.00 NOT NULL,
    version       INT UNSIGNED DEFAULT 1 NOT NULL,
    parent_rubric_id BIGINT UNSIGNED NULL,
    status        ENUM('draft','active','archived') DEFAULT 'draft' NOT NULL,
    created_by    BIGINT UNSIGNED NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    deleted_at    TIMESTAMP NULL,

    INDEX idx_rubric_subject (subject_id),
    INDEX idx_rubric_parent (parent_rubric_id, version),
    INDEX idx_rubric_status (status),
    INDEX idx_rubric_deleted (deleted_at),
    CONSTRAINT chk_rubric_total_score CHECK (total_score > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Rubric definitions for checkpoint/assignment grading';

CREATE TABLE rubric_criteria (
    id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rubric_id            BIGINT UNSIGNED NOT NULL,
    name                 VARCHAR(200) NOT NULL,
    description          TEXT NULL,
    max_score            DECIMAL(7,2) NOT NULL,
    weight               DECIMAL(7,4) DEFAULT 1.0000 NOT NULL,
    order_index          INT UNSIGNED DEFAULT 1 NOT NULL,
    is_required_feedback TINYINT(1) DEFAULT 0 NOT NULL,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

    INDEX idx_criteria_rubric (rubric_id, order_index),
    CONSTRAINT chk_criteria_max_score CHECK (max_score > 0),
    CONSTRAINT chk_criteria_weight CHECK (weight >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Criteria in each grading rubric';

CREATE TABLE rubric_bindings (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rubric_id     BIGINT UNSIGNED NOT NULL,
    target_type   ENUM('checkpoint','assignment') NOT NULL,
    target_id     BIGINT UNSIGNED NOT NULL,
    created_by    BIGINT UNSIGNED NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    UNIQUE KEY uk_rubric_binding_target (target_type, target_id),
    INDEX idx_binding_rubric (rubric_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Rubric attached to a checkpoint or assignment';

CREATE TABLE evaluation_sessions (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rubric_id        BIGINT UNSIGNED NOT NULL,
    target_type      ENUM('checkpoint_submission','assignment_submission') NOT NULL,
    target_id        BIGINT UNSIGNED NOT NULL,
    group_id         BIGINT UNSIGNED NOT NULL,
    evaluator_id     BIGINT UNSIGNED NOT NULL,
    evaluator_role   VARCHAR(32) DEFAULT 'lecturer' NOT NULL,
    is_official      TINYINT(1) DEFAULT 1 NOT NULL,
    total_score      DECIMAL(7,2) DEFAULT 0.00 NOT NULL,
    overall_feedback TEXT NULL,
    status           ENUM('draft','submitted','confirmed') DEFAULT 'draft' NOT NULL,
    evaluated_at     DATETIME NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

    INDEX idx_eval_target (target_type, target_id),
    INDEX idx_eval_group (group_id),
    INDEX idx_eval_evaluator (evaluator_id),
    INDEX idx_eval_official (is_official),
    INDEX idx_eval_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='One rubric grading session for a group submission';

CREATE TABLE evaluation_scores (
    id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    evaluation_session_id BIGINT UNSIGNED NOT NULL,
    criterion_id          BIGINT UNSIGNED NOT NULL,
    score                 DECIMAL(7,2) NOT NULL,
    feedback              TEXT NULL,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

    UNIQUE KEY uk_eval_score_criterion (evaluation_session_id, criterion_id),
    INDEX idx_eval_score_session (evaluation_session_id),
    INDEX idx_eval_score_criterion (criterion_id),
    CONSTRAINT chk_eval_score_non_negative CHECK (score >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Scores and feedback per rubric criterion';

ALTER TABLE rubrics
    ADD CONSTRAINT fk_rubric_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_rubric_parent FOREIGN KEY (parent_rubric_id) REFERENCES rubrics(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_rubric_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE rubric_criteria
    ADD CONSTRAINT fk_criteria_rubric FOREIGN KEY (rubric_id) REFERENCES rubrics(id) ON DELETE CASCADE;

ALTER TABLE rubric_bindings
    ADD CONSTRAINT fk_binding_rubric FOREIGN KEY (rubric_id) REFERENCES rubrics(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_binding_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE evaluation_sessions
    ADD CONSTRAINT fk_eval_rubric FOREIGN KEY (rubric_id) REFERENCES rubrics(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_eval_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_eval_evaluator FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE evaluation_scores
    ADD CONSTRAINT fk_eval_score_session FOREIGN KEY (evaluation_session_id) REFERENCES evaluation_sessions(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_eval_score_criterion FOREIGN KEY (criterion_id) REFERENCES rubric_criteria(id) ON DELETE RESTRICT;


-- =============================================
-- MODULE 4: UPLOAD SESSION — Presigned URL Upload Tracking
-- =============================================

-- -------------------------------------------
-- BẢNG 22: upload_sessions — Theo dõi vòng đời upload presigned URL
-- -------------------------------------------
CREATE TABLE upload_sessions (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT UNSIGNED NOT NULL,
    checkpoint_id  BIGINT UNSIGNED NOT NULL,
    group_id       BIGINT UNSIGNED NOT NULL,
    status         ENUM('initiated','uploading','completed','expired')
                       DEFAULT 'initiated' NOT NULL,
    file_count     TINYINT UNSIGNED NOT NULL DEFAULT 0
                   COMMENT 'Số file trong session',
    expires_at     DATETIME NOT NULL
                   COMMENT 'Presigned URLs hết hạn sau thời gian này',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    INDEX idx_us_user               (user_id),
    INDEX idx_us_checkpoint_group   (checkpoint_id, group_id),
    INDEX idx_us_status             (status),
    INDEX idx_us_expires            (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Theo dõi vòng đời upload qua presigned URL';

ALTER TABLE upload_sessions
    ADD CONSTRAINT fk_us_user       FOREIGN KEY (user_id)       REFERENCES users(id)        ON DELETE CASCADE,
    ADD CONSTRAINT fk_us_checkpoint FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id)  ON DELETE RESTRICT,
    ADD CONSTRAINT fk_us_group      FOREIGN KEY (group_id)      REFERENCES `groups`(id)     ON DELETE RESTRICT;

-- File upload state tracking
ALTER TABLE checkpoint_submission_files
    ADD COLUMN upload_status ENUM('pending','uploaded','failed') DEFAULT 'pending' NOT NULL
        COMMENT 'Trạng thái upload qua presigned URL' AFTER file_size,
    ADD COLUMN etag VARCHAR(255) NULL
        COMMENT 'ETag trả về từ MinIO sau khi upload thành công' AFTER upload_status,
    ADD COLUMN session_id BIGINT UNSIGNED NULL
        COMMENT 'FK upload_sessions — NULL cho file upload kiểu cũ (multer)' AFTER etag;

ALTER TABLE checkpoint_submission_files
    ADD CONSTRAINT fk_subfile_session FOREIGN KEY (session_id) REFERENCES upload_sessions(id) ON DELETE SET NULL;

-- =============================================
-- MODULE 3 PHASE 5: AI EVALUATION ASSISTANT
-- =============================================

CREATE TABLE IF NOT EXISTS ai_analysis_jobs (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    target_type    ENUM('checkpoint_submission','assignment_submission') NOT NULL,
    target_id      BIGINT UNSIGNED NOT NULL,
    requested_by   BIGINT UNSIGNED NOT NULL,
    provider_key   VARCHAR(50) NULL,
    model_name     VARCHAR(200) NULL,
    status         ENUM('pending','processing','completed','failed') DEFAULT 'pending' NOT NULL,
    error_message  VARCHAR(1000) NULL,
    attempts       SMALLINT UNSIGNED DEFAULT 0 NOT NULL,
    next_retry_at  DATETIME NULL,
    started_at     DATETIME NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    completed_at   DATETIME NULL,
    INDEX idx_ai_jobs_target (target_type, target_id),
    INDEX idx_ai_jobs_status (status, next_retry_at),
    INDEX idx_ai_jobs_provider (provider_key, model_name),
    INDEX idx_ai_jobs_requested_by (requested_by),
    CONSTRAINT fk_ai_jobs_requested_by FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Background jobs for AI evaluation analysis';

CREATE TABLE IF NOT EXISTS ai_evaluation_suggestions (
    id                                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id                                  BIGINT UNSIGNED NOT NULL,
    target_type                             ENUM('checkpoint_submission','assignment_submission') NOT NULL,
    target_id                               BIGINT UNSIGNED NOT NULL,
    rubric_id                               BIGINT UNSIGNED NOT NULL,
    summary                                 TEXT NOT NULL,
    strengths                               JSON NULL,
    weaknesses                              JSON NULL,
    missing_requirements                    JSON NULL,
    suggested_overall_feedback              TEXT NULL,
    suggested_total_score                   DECIMAL(6,2) NULL,
    confidence_score                        DECIMAL(5,4) NULL,
    project_potential_level                 VARCHAR(30) NULL,
    project_potential_reasons               JSON NULL,
    project_potential_next_steps            JSON NULL,
    project_potential_confidence_score      DECIMAL(5,4) NULL,
    model_name                              VARCHAR(200) NULL,
    provider_key                            VARCHAR(50) NULL,
    raw_response                            MEDIUMTEXT NULL,
    created_at                              TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_ai_suggestions_target (target_type, target_id, created_at),
    INDEX idx_ai_suggestions_job (job_id),
    INDEX idx_ai_suggestions_provider (provider_key, model_name),
    INDEX idx_ai_suggestions_rubric (rubric_id),
    CONSTRAINT fk_ai_suggestions_job FOREIGN KEY (job_id) REFERENCES ai_analysis_jobs(id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_suggestions_rubric FOREIGN KEY (rubric_id) REFERENCES rubrics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='AI suggestions for rubric-based grading; never official scores';

CREATE TABLE IF NOT EXISTS ai_criterion_suggestions (
    id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ai_suggestion_id   BIGINT UNSIGNED NOT NULL,
    criterion_id        BIGINT UNSIGNED NOT NULL,
    suggested_score     DECIMAL(6,2) NULL,
    suggested_feedback  TEXT NULL,
    evidence_text       TEXT NULL,
    confidence_score    DECIMAL(5,4) NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_ai_criterion_suggestion (ai_suggestion_id),
    INDEX idx_ai_criterion (criterion_id),
    CONSTRAINT fk_ai_criterion_suggestion FOREIGN KEY (ai_suggestion_id) REFERENCES ai_evaluation_suggestions(id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_criterion FOREIGN KEY (criterion_id) REFERENCES rubric_criteria(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='AI suggestions per rubric criterion';

CREATE TABLE IF NOT EXISTS ai_suggestion_actions (
    id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ai_suggestion_id   BIGINT UNSIGNED NOT NULL,
    user_id            BIGINT UNSIGNED NOT NULL,
    action             ENUM('accepted','edited','ignored','copied') NOT NULL,
    field_name         VARCHAR(100) NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_ai_action_suggestion (ai_suggestion_id),
    INDEX idx_ai_action_user (user_id),
    CONSTRAINT fk_ai_action_suggestion FOREIGN KEY (ai_suggestion_id) REFERENCES ai_evaluation_suggestions(id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_action_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit trail of user interactions with AI suggestions';

INSERT IGNORE INTO permissions (permission_code, permission_name, module) VALUES
('ai.evaluation.analyze', 'Yêu cầu AI phân tích bài nộp', 'ai'),
('ai.evaluation.read', 'Xem gợi ý AI evaluation', 'ai'),
('ai.evaluation.action', 'Ghi nhận thao tác với gợi ý AI', 'ai'),
('ai.evaluation.admin_read', 'Quản trị xem toàn bộ gợi ý AI', 'ai'),
('ai.settings.read', 'Xem cấu hình AI', 'ai'),
('ai.settings.update', 'Cập nhật cấu hình AI', 'ai'),
('ai.settings.test_provider', 'Kiểm tra kết nối AI provider', 'ai'),
('ai.settings.switch_provider', 'Chuyển AI provider đang sử dụng', 'ai');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'ai.evaluation.analyze', 'ai.evaluation.read', 'ai.evaluation.action'
) WHERE r.role_code = 'lecturer';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.module = 'ai'
WHERE r.role_code IN ('admin', 'department_head');

INSERT IGNORE INTO system_settings (setting_key, setting_value, data_type, module, description) VALUES
('ai_active_provider', 'local-gemma', 'string', 'ai', 'AI provider đang sử dụng'),
('allow_ai_score_suggestion', 'true', 'boolean', 'ai', 'Cho phép AI gợi ý điểm tham khảo'),
('allow_ai_feedback_suggestion', 'true', 'boolean', 'ai', 'Cho phép AI gợi ý feedback'),
('allow_student_view_ai_feedback', 'false', 'boolean', 'ai', 'Không cho sinh viên xem AI suggestion mặc định'),
('data_retention_days', '180', 'integer', 'ai', 'Số ngày giữ dữ liệu AI suggestion'),
('provider_third_party_api_enabled', 'true', 'boolean', 'ai', 'Bật provider API bên thứ ba'),
('provider_third_party_api_base_url', 'https://api.openai.com/v1', 'string', 'ai', 'Third-party API base URL'),
('provider_third_party_api_model', 'gpt-4o-mini', 'string', 'ai', 'Third-party API model'),
('provider_third_party_api_stream', 'true', 'boolean', 'ai', 'Third-party API stream mode'),
('provider_third_party_api_api_key_required', 'true', 'boolean', 'ai', 'Third-party API có bắt buộc API key không'),
('provider_local_gemma_enabled', 'true', 'boolean', 'ai', 'Bật provider Local Ollama'),
('provider_local_gemma_base_url', 'http://ollama:11434/v1', 'string', 'ai', 'Local Ollama base URL'),
('provider_local_gemma_model', 'gemma3:4b', 'string', 'ai', 'Local Ollama model'),
('provider_local_gemma_stream', 'true', 'boolean', 'ai', 'Local Ollama stream mode'),
('provider_local_gemma_api_key_required', 'false', 'boolean', 'ai', 'Local Ollama có bắt buộc API key không');

-- =============================================
-- MODULE 4 PHASE 1: MENTOR FOUNDATION
-- =============================================

CREATE TABLE IF NOT EXISTS mentor_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NULL,
    avatar_url VARCHAR(500) NULL,
    mentor_type ENUM('business','technical','internal_lecturer','external_expert') NOT NULL,
    organization VARCHAR(255) NULL,
    position_title VARCHAR(150) NULL,
    bio TEXT NULL,
    years_of_experience INT UNSIGNED NULL,
    linkedin_url VARCHAR(500) NULL,
    portfolio_url VARCHAR(500) NULL,
    cv_file_url VARCHAR(500) NULL,
    status ENUM('pending','active','inactive','rejected','archived') NOT NULL DEFAULT 'pending',
    visibility ENUM('private','internal','public') NOT NULL DEFAULT 'internal',
    created_by BIGINT UNSIGNED NULL,
    reviewed_by BIGINT UNSIGNED NULL,
    reviewed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL,
    active_email_key VARCHAR(150) GENERATED ALWAYS AS (
      CASE WHEN deleted_at IS NULL AND status = 'active' THEN LOWER(TRIM(email)) ELSE NULL END
    ) STORED,
    mentor_user_key BIGINT UNSIGNED GENERATED ALWAYS AS (
      CASE WHEN deleted_at IS NULL AND user_id IS NOT NULL THEN user_id ELSE NULL END
    ) STORED,
    UNIQUE KEY uk_mentor_active_email (active_email_key),
    UNIQUE KEY uk_mentor_active_user (mentor_user_key),
    INDEX idx_mentor_user (user_id),
    INDEX idx_mentor_type_status (mentor_type, status),
    INDEX idx_mentor_visibility (visibility),
    INDEX idx_mentor_created_by (created_by),
    INDEX idx_mentor_reviewed_by (reviewed_by),
    CONSTRAINT fk_mentor_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentor_profile_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_mentor_profile_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentor_expertise_areas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(80) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    category ENUM('business','technical','product','marketing','finance','legal','ai','data','other') NOT NULL DEFAULT 'other',
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY uk_mentor_expertise_code (code),
    INDEX idx_mentor_expertise_category (category),
    INDEX idx_mentor_expertise_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentor_expertise_map (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mentor_id BIGINT UNSIGNED NOT NULL,
    expertise_id BIGINT UNSIGNED NOT NULL,
    level ENUM('beginner','intermediate','advanced','expert') NOT NULL DEFAULT 'intermediate',
    years_experience INT UNSIGNED NULL,
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY uk_mentor_expertise_map (mentor_id, expertise_id),
    INDEX idx_mentor_expertise_map_expertise (expertise_id),
    CONSTRAINT fk_mentor_expertise_map_mentor FOREIGN KEY (mentor_id) REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_mentor_expertise_map_expertise FOREIGN KEY (expertise_id) REFERENCES mentor_expertise_areas(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentor_availability (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mentor_id BIGINT UNSIGNED NOT NULL,
    day_of_week TINYINT UNSIGNED NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    available_from DATE NULL,
    available_to DATE NULL,
    max_sessions_per_week INT UNSIGNED NULL,
    note TEXT NULL,
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_mentor_availability_mentor (mentor_id),
    INDEX idx_mentor_availability_day_status (day_of_week, status),
    CONSTRAINT fk_mentor_availability_mentor FOREIGN KEY (mentor_id) REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    CONSTRAINT chk_mentor_availability_day CHECK (day_of_week IS NULL OR day_of_week BETWEEN 1 AND 7),
    CONSTRAINT chk_mentor_availability_time CHECK (start_time IS NULL OR end_time IS NULL OR start_time < end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentor_documents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mentor_id BIGINT UNSIGNED NOT NULL,
    document_type ENUM('cv','resume','portfolio','certificate','other') NOT NULL DEFAULT 'other',
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_path VARCHAR(500) NULL,
    mime_type VARCHAR(100) NULL,
    file_size BIGINT UNSIGNED NULL,
    uploaded_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL,
    INDEX idx_mentor_documents_mentor (mentor_id),
    INDEX idx_mentor_documents_type (document_type),
    INDEX idx_mentor_documents_uploader (uploaded_by),
    INDEX idx_mentor_documents_file_path (file_path),
    CONSTRAINT fk_mentor_documents_mentor FOREIGN KEY (mentor_id) REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_mentor_documents_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO roles (role_code, role_name, description, is_system) VALUES
('mentor', 'Mentor', 'Cố vấn/chuyên gia hỗ trợ nhóm dự án', 1);

INSERT IGNORE INTO permissions (permission_code, permission_name, module, description) VALUES
('mentor.profile.read', 'View mentor profiles', 'mentor', 'View mentor profile data'),
('mentor.profile.create', 'Create mentor profiles', 'mentor', 'Create mentor profiles'),
('mentor.profile.update', 'Update mentor profiles', 'mentor', 'Update mentor profile data'),
('mentor.profile.delete', 'Delete mentor profiles', 'mentor', 'Soft delete mentor profiles'),
('mentor.profile.review', 'Review mentor profiles', 'mentor', 'Approve or reject mentor profiles'),
('mentor.expertise.manage', 'Manage mentor expertise', 'mentor', 'Manage mentor expertise areas and mapping'),
('mentor.availability.manage', 'Manage mentor availability', 'mentor', 'Manage mentor availability'),
('mentor.document.manage', 'Manage mentor documents', 'mentor', 'Manage private mentor documents'),
('mentor.admin_read', 'Admin read mentor data', 'mentor', 'Read mentor data across the system');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.module = 'mentor'
WHERE r.role_code = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'mentor.profile.read', 'mentor.profile.review', 'mentor.admin_read'
) WHERE r.role_code = 'department_head';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'mentor.profile.read', 'mentor.profile.update', 'mentor.expertise.manage',
  'mentor.availability.manage', 'mentor.document.manage'
) WHERE r.role_code = 'mentor';

-- Module 5 Phases 1-2: Incubation startup pipeline foundation, RBAC, and seed data.

CREATE TABLE IF NOT EXISTS startup_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT UNSIGNED NULL,
    class_id INT UNSIGNED NULL,
    semester_id INT UNSIGNED NULL,
    subject_id INT UNSIGNED NULL,
    startup_name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NULL,
    logo_url VARCHAR(500) NULL,
    tagline VARCHAR(255) NULL,
    short_description TEXT NULL,
    full_description TEXT NULL,
    problem_statement TEXT NULL,
    solution_description TEXT NULL,
    target_customers TEXT NULL,
    business_model TEXT NULL,
    product_stage ENUM('idea','prototype','mvp','beta','launched','revenue','company') NOT NULL DEFAULT 'idea',
    startup_status ENUM('candidate','incubating','active','on_hold','graduated','archived','rejected') NOT NULL DEFAULT 'candidate',
    category VARCHAR(100) NULL,
    industry VARCHAR(150) NULL,
    technology_tags JSON NULL,
    website_url VARCHAR(500) NULL,
    github_url VARCHAR(500) NULL,
    demo_url VARCHAR(500) NULL,
    pitch_deck_url VARCHAR(500) NULL,
    video_url VARCHAR(500) NULL,
    source ENUM('module3_selection','manual_nomination','showcase','alumni','other') NOT NULL DEFAULT 'manual_nomination',
    selected_score DECIMAL(7,2) NULL,
    selected_reason TEXT NULL,
    selected_by BIGINT UNSIGNED NULL,
    selected_at DATETIME NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL,
    active_group_key BIGINT UNSIGNED GENERATED ALWAYS AS (
      CASE WHEN deleted_at IS NULL AND group_id IS NOT NULL AND startup_status NOT IN ('archived','rejected') THEN group_id ELSE NULL END
    ) STORED,
    UNIQUE KEY uk_startup_slug (slug),
    UNIQUE KEY uk_startup_active_group (active_group_key),
    INDEX idx_startup_group (group_id),
    INDEX idx_startup_class (class_id),
    INDEX idx_startup_semester (semester_id),
    INDEX idx_startup_subject (subject_id),
    INDEX idx_startup_status (startup_status),
    INDEX idx_startup_product_stage (product_stage),
    INDEX idx_startup_source (source),
    INDEX idx_startup_selected_by (selected_by),
    INDEX idx_startup_created_by (created_by),
    CONSTRAINT fk_startup_profile_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE RESTRICT,
    CONSTRAINT fk_startup_profile_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    CONSTRAINT fk_startup_profile_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
    CONSTRAINT fk_startup_profile_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    CONSTRAINT fk_startup_profile_selected_by FOREIGN KEY (selected_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_startup_profile_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS startup_founders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    startup_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NULL,
    user_id BIGINT UNSIGNED NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NULL,
    phone VARCHAR(20) NULL,
    role_title VARCHAR(150) NULL,
    founder_role ENUM('founder','co_founder','member','advisor','alumni_founder') NOT NULL DEFAULT 'member',
    contribution TEXT NULL,
    joined_at DATE NULL,
    left_at DATE NULL,
    status ENUM('active','inactive','left') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_startup_founder_startup (startup_id),
    INDEX idx_startup_founder_student (student_id),
    INDEX idx_startup_founder_user (user_id),
    INDEX idx_startup_founder_status (status),
    CONSTRAINT fk_startup_founder_startup FOREIGN KEY (startup_id) REFERENCES startup_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_startup_founder_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    CONSTRAINT fk_startup_founder_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_startup_founder_dates CHECK (joined_at IS NULL OR left_at IS NULL OR joined_at <= left_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS startup_pipeline_stages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(80) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    order_index INT UNSIGNED NOT NULL DEFAULT 0,
    is_final TINYINT(1) NOT NULL DEFAULT 0,
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY uk_startup_stage_code (code),
    INDEX idx_startup_stage_order (order_index),
    INDEX idx_startup_stage_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS startup_pipeline_entries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    startup_id BIGINT UNSIGNED NOT NULL,
    current_stage_id BIGINT UNSIGNED NOT NULL,
    previous_stage_id BIGINT UNSIGNED NULL,
    status ENUM('active','on_hold','completed','archived') NOT NULL DEFAULT 'active',
    entered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exited_at DATETIME NULL,
    note TEXT NULL,
    updated_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    current_startup_key BIGINT UNSIGNED GENERATED ALWAYS AS (
      CASE WHEN exited_at IS NULL AND status IN ('active','on_hold') THEN startup_id ELSE NULL END
    ) STORED,
    UNIQUE KEY uk_startup_current_pipeline_entry (current_startup_key),
    INDEX idx_startup_entry_startup (startup_id),
    INDEX idx_startup_entry_current_stage (current_stage_id),
    INDEX idx_startup_entry_previous_stage (previous_stage_id),
    INDEX idx_startup_entry_status (status),
    INDEX idx_startup_entry_updated_by (updated_by),
    CONSTRAINT fk_startup_entry_startup FOREIGN KEY (startup_id) REFERENCES startup_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_startup_entry_current_stage FOREIGN KEY (current_stage_id) REFERENCES startup_pipeline_stages(id) ON DELETE RESTRICT,
    CONSTRAINT fk_startup_entry_previous_stage FOREIGN KEY (previous_stage_id) REFERENCES startup_pipeline_stages(id) ON DELETE SET NULL,
    CONSTRAINT fk_startup_entry_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_startup_entry_dates CHECK (exited_at IS NULL OR entered_at <= exited_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS startup_pipeline_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    startup_id BIGINT UNSIGNED NOT NULL,
    from_stage_id BIGINT UNSIGNED NULL,
    to_stage_id BIGINT UNSIGNED NOT NULL,
    action ENUM('created','moved','on_hold','resumed','graduated','archived','rejected') NOT NULL,
    reason TEXT NULL,
    actor_id BIGINT UNSIGNED NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_startup_history_startup (startup_id),
    INDEX idx_startup_history_from_stage (from_stage_id),
    INDEX idx_startup_history_to_stage (to_stage_id),
    INDEX idx_startup_history_actor (actor_id),
    CONSTRAINT fk_startup_history_startup FOREIGN KEY (startup_id) REFERENCES startup_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_startup_history_from_stage FOREIGN KEY (from_stage_id) REFERENCES startup_pipeline_stages(id) ON DELETE SET NULL,
    CONSTRAINT fk_startup_history_to_stage FOREIGN KEY (to_stage_id) REFERENCES startup_pipeline_stages(id) ON DELETE RESTRICT,
    CONSTRAINT fk_startup_history_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS startup_selection_reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT UNSIGNED NULL,
    startup_id BIGINT UNSIGNED NULL,
    nominated_by BIGINT UNSIGNED NULL,
    reviewed_by BIGINT UNSIGNED NULL,
    source_type ENUM('evaluation_result','manual','showcase','mentor_recommendation','ai_suggestion') NOT NULL DEFAULT 'manual',
    nomination_reason TEXT NOT NULL,
    support_needed TEXT NULL,
    proposed_stage_id BIGINT UNSIGNED NULL,
    evaluation_summary TEXT NULL,
    average_score DECIMAL(7,2) NULL,
    potential_score DECIMAL(7,2) NULL,
    review_status ENUM('pending','approved','rejected','needs_more_info') NOT NULL DEFAULT 'pending',
    review_note TEXT NULL,
    reviewed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_startup_review_group (group_id),
    INDEX idx_startup_review_startup (startup_id),
    INDEX idx_startup_review_status (review_status),
    INDEX idx_startup_review_nominated_by (nominated_by),
    INDEX idx_startup_review_reviewed_by (reviewed_by),
    INDEX idx_startup_review_proposed_stage (proposed_stage_id),
    CONSTRAINT fk_startup_review_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE SET NULL,
    CONSTRAINT fk_startup_review_startup FOREIGN KEY (startup_id) REFERENCES startup_profiles(id) ON DELETE SET NULL,
    CONSTRAINT fk_startup_review_nominated_by FOREIGN KEY (nominated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_startup_review_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_startup_review_proposed_stage FOREIGN KEY (proposed_stage_id) REFERENCES startup_pipeline_stages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS startup_documents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    startup_id BIGINT UNSIGNED NOT NULL,
    document_type ENUM('pitch_deck','business_plan','demo_video','logo','certificate','report','other') NOT NULL DEFAULT 'other',
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_path VARCHAR(500) NULL,
    mime_type VARCHAR(100) NULL,
    file_size BIGINT UNSIGNED NULL,
    uploaded_by BIGINT UNSIGNED NULL,
    visibility ENUM('private','internal','public') NOT NULL DEFAULT 'internal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL,
    INDEX idx_startup_document_startup (startup_id),
    INDEX idx_startup_document_type (document_type),
    INDEX idx_startup_document_uploader (uploaded_by),
    INDEX idx_startup_document_visibility (visibility),
    INDEX idx_startup_document_file_path (file_path),
    CONSTRAINT fk_startup_document_startup FOREIGN KEY (startup_id) REFERENCES startup_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_startup_document_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS startup_milestones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    startup_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    milestone_type ENUM('product','business','team','revenue','funding','award','partnership','legal','other') NOT NULL DEFAULT 'other',
    milestone_date DATE NOT NULL,
    evidence_url VARCHAR(500) NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL,
    INDEX idx_startup_milestone_startup (startup_id),
    INDEX idx_startup_milestone_type (milestone_type),
    INDEX idx_startup_milestone_date (milestone_date),
    INDEX idx_startup_milestone_created_by (created_by),
    CONSTRAINT fk_startup_milestone_startup FOREIGN KEY (startup_id) REFERENCES startup_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_startup_milestone_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO startup_pipeline_stages (code, name, description, order_index, is_final, status) VALUES
('idea', 'Idea', 'Problem and solution are being framed.', 10, 0, 'active'),
('prototype', 'Prototype', 'Early product prototype is available.', 20, 0, 'active'),
('mvp', 'MVP', 'Minimum viable product is being validated.', 30, 0, 'active'),
('market_validation', 'Market Validation', 'Customer discovery and market validation are in progress.', 40, 0, 'active'),
('revenue', 'Revenue', 'Startup has early paying customers or revenue signals.', 50, 0, 'active'),
('company_registered', 'Company Registered', 'Team has registered a company outside E-HUB tracking.', 60, 0, 'active'),
('incubating', 'Incubating', 'Startup is receiving incubation support.', 70, 0, 'active'),
('graduated', 'Graduated', 'Startup graduated from the incubation pipeline.', 80, 1, 'active'),
('archived', 'Archived', 'Startup is archived for historical tracking.', 90, 1, 'active');

INSERT IGNORE INTO permissions (permission_code, permission_name, module, description) VALUES
('incubation.startup.read', 'Read startup profiles', 'incubation', 'Read incubation startup profiles'),
('incubation.startup.create', 'Create startup profiles', 'incubation', 'Create incubation startup profiles'),
('incubation.startup.update', 'Update startup profiles', 'incubation', 'Update incubation startup profiles'),
('incubation.startup.delete', 'Delete startup profiles', 'incubation', 'Soft delete incubation startup profiles'),
('incubation.startup.review', 'Review startup profiles', 'incubation', 'Review startup profile status and selection'),
('incubation.pipeline.read', 'Read startup pipeline', 'incubation', 'Read startup pipeline data'),
('incubation.pipeline.manage', 'Manage startup pipeline', 'incubation', 'Manage startup pipeline stages and movement'),
('incubation.document.manage', 'Manage startup documents', 'incubation', 'Manage private startup documents'),
('incubation.milestone.manage', 'Manage startup milestones', 'incubation', 'Manage startup milestones'),
('incubation.selection.review', 'Review startup selection', 'incubation', 'Approve or reject startup selection reviews'),
('incubation.analytics.read', 'Read incubation analytics', 'incubation', 'Read incubation analytics'),
('incubation.showcase.manage', 'Manage incubation showcase', 'incubation', 'Manage incubation showcase records');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.module = 'incubation'
WHERE r.role_code = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'incubation.startup.read', 'incubation.startup.review', 'incubation.pipeline.read',
  'incubation.pipeline.manage', 'incubation.document.manage', 'incubation.milestone.manage',
  'incubation.selection.review', 'incubation.analytics.read'
) WHERE r.role_code = 'department_head';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'incubation.startup.read', 'incubation.startup.create', 'incubation.pipeline.read'
) WHERE r.role_code = 'lecturer';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'incubation.startup.read'
) WHERE r.role_code = 'mentor';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'incubation.startup.read', 'incubation.startup.update', 'incubation.document.manage', 'incubation.milestone.manage'
) WHERE r.role_code = 'student';

INSERT IGNORE INTO mentor_expertise_areas (code, name, category, status) VALUES
('business_model', 'Business Model', 'business', 'active'),
('market_validation', 'Market Validation', 'business', 'active'),
('pitching', 'Pitching', 'business', 'active'),
('product_management', 'Product Management', 'product', 'active'),
('software_architecture', 'Software Architecture', 'technical', 'active'),
('mobile_development', 'Mobile Development', 'technical', 'active'),
('web_development', 'Web Development', 'technical', 'active'),
('ai_ml', 'AI / Machine Learning', 'ai', 'active'),
('data_analytics', 'Data Analytics', 'data', 'active'),
('cloud_devops', 'Cloud / DevOps', 'technical', 'active'),
('ui_ux', 'UI / UX', 'product', 'active'),
('finance', 'Finance', 'finance', 'active'),
('legal', 'Legal', 'legal', 'active');

-- =============================================
-- MODULE 4 PHASES 3-4: MENTOR ASSIGNMENTS & SESSIONS
-- =============================================

CREATE TABLE IF NOT EXISTS mentor_assignments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mentor_id BIGINT UNSIGNED NOT NULL,
    group_id BIGINT UNSIGNED NOT NULL,
    class_id INT UNSIGNED NOT NULL,
    semester_id INT UNSIGNED NOT NULL,
    subject_id INT UNSIGNED NOT NULL,
    assigned_by BIGINT UNSIGNED NULL,
    approved_by BIGINT UNSIGNED NULL,
    assignment_type ENUM('primary','supporting','business','technical') NOT NULL DEFAULT 'primary',
    status ENUM('proposed','pending_mentor','active','rejected','cancelled','completed') NOT NULL DEFAULT 'pending_mentor',
    start_date DATE NULL,
    end_date DATE NULL,
    expected_sessions INT UNSIGNED NULL,
    note TEXT NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL,
    active_primary_group_key BIGINT UNSIGNED GENERATED ALWAYS AS (
      CASE WHEN deleted_at IS NULL AND status = 'active' AND assignment_type = 'primary' THEN group_id ELSE NULL END
    ) STORED,
    open_mentor_group_key VARCHAR(80) GENERATED ALWAYS AS (
      CASE WHEN deleted_at IS NULL AND status IN ('proposed','pending_mentor','active') THEN CONCAT(group_id, ':', mentor_id) ELSE NULL END
    ) STORED,
    UNIQUE KEY uk_mentor_assignment_active_primary (active_primary_group_key),
    UNIQUE KEY uk_mentor_assignment_open_pair (open_mentor_group_key),
    INDEX idx_mentor_assignment_mentor (mentor_id),
    INDEX idx_mentor_assignment_group (group_id),
    INDEX idx_mentor_assignment_class (class_id),
    INDEX idx_mentor_assignment_semester (semester_id),
    INDEX idx_mentor_assignment_subject (subject_id),
    INDEX idx_mentor_assignment_status (status),
    INDEX idx_mentor_assignment_type (assignment_type),
    CONSTRAINT fk_mentor_assignment_mentor FOREIGN KEY (mentor_id) REFERENCES mentor_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentor_assignment_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentor_assignment_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentor_assignment_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentor_assignment_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentor_assignment_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_mentor_assignment_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_mentor_assignment_dates CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentor_assignment_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT UNSIGNED NOT NULL,
    requested_by BIGINT UNSIGNED NULL,
    requested_role ENUM('business','technical','any') NOT NULL DEFAULT 'any',
    requested_expertise JSON NULL,
    problem_statement TEXT NULL,
    support_needed TEXT NOT NULL,
    priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
    status ENUM('open','matched','closed','cancelled') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    closed_at TIMESTAMP NULL,
    INDEX idx_mentor_request_group (group_id),
    INDEX idx_mentor_request_status_priority (status, priority),
    INDEX idx_mentor_request_requested_by (requested_by),
    CONSTRAINT fk_mentor_request_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentor_request_requested_by FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentor_assignment_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    assignment_id BIGINT UNSIGNED NOT NULL,
    action ENUM('proposed','approved','rejected','activated','cancelled','completed','changed') NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    actor_id BIGINT UNSIGNED NULL,
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_mentor_history_assignment (assignment_id),
    INDEX idx_mentor_history_actor (actor_id),
    CONSTRAINT fk_mentor_history_assignment FOREIGN KEY (assignment_id) REFERENCES mentor_assignments(id) ON DELETE CASCADE,
    CONSTRAINT fk_mentor_history_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentoring_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    assignment_id BIGINT UNSIGNED NOT NULL,
    mentor_id BIGINT UNSIGNED NOT NULL,
    group_id BIGINT UNSIGNED NOT NULL,
    class_id INT UNSIGNED NOT NULL,
    semester_id INT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    session_type ENUM('online','offline','hybrid') NOT NULL DEFAULT 'online',
    meeting_link VARCHAR(500) NULL,
    location VARCHAR(255) NULL,
    scheduled_start_at DATETIME NOT NULL,
    scheduled_end_at DATETIME NOT NULL,
    actual_start_at DATETIME NULL,
    actual_end_at DATETIME NULL,
    duration_minutes INT UNSIGNED NULL,
    status ENUM('scheduled','completed','cancelled','no_show','rescheduled') NOT NULL DEFAULT 'scheduled',
    created_by BIGINT UNSIGNED NULL,
    cancelled_by BIGINT UNSIGNED NULL,
    cancellation_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL,
    INDEX idx_mentoring_session_assignment (assignment_id),
    INDEX idx_mentoring_session_mentor (mentor_id),
    INDEX idx_mentoring_session_group (group_id),
    INDEX idx_mentoring_session_class (class_id),
    INDEX idx_mentoring_session_status_time (status, scheduled_start_at),
    CONSTRAINT fk_mentoring_session_assignment FOREIGN KEY (assignment_id) REFERENCES mentor_assignments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentoring_session_mentor FOREIGN KEY (mentor_id) REFERENCES mentor_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentoring_session_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentoring_session_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentoring_session_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentoring_session_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_mentoring_session_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_mentoring_session_scheduled_time CHECK (scheduled_start_at < scheduled_end_at),
    CONSTRAINT chk_mentoring_session_actual_time CHECK (actual_start_at IS NULL OR actual_end_at IS NULL OR actual_start_at <= actual_end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentoring_session_attendees (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    student_id BIGINT UNSIGNED NULL,
    mentor_id BIGINT UNSIGNED NULL,
    attendee_type ENUM('mentor','student','lecturer','guest') NOT NULL,
    attendance_status ENUM('invited','attended','absent','late') NOT NULL DEFAULT 'invited',
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_session_attendee_session (session_id),
    INDEX idx_session_attendee_user (user_id),
    INDEX idx_session_attendee_student (student_id),
    INDEX idx_session_attendee_mentor (mentor_id),
    CONSTRAINT fk_session_attendee_session FOREIGN KEY (session_id) REFERENCES mentoring_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_attendee_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_session_attendee_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    CONSTRAINT fk_session_attendee_mentor FOREIGN KEY (mentor_id) REFERENCES mentor_profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentoring_session_notes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    author_id BIGINT UNSIGNED NULL,
    note_type ENUM('mentor_note','student_note','lecturer_note','private_admin_note') NOT NULL DEFAULT 'mentor_note',
    content TEXT NOT NULL,
    visibility ENUM('private_to_author','internal','shared_with_group','shared_with_mentor') NOT NULL DEFAULT 'internal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL,
    INDEX idx_session_note_session (session_id),
    INDEX idx_session_note_author (author_id),
    CONSTRAINT fk_session_note_session FOREIGN KEY (session_id) REFERENCES mentoring_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_note_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentoring_feedbacks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    assignment_id BIGINT UNSIGNED NOT NULL,
    from_user_id BIGINT UNSIGNED NULL,
    from_role ENUM('mentor','student','lecturer','admin') NOT NULL,
    target_type ENUM('mentor','group','session') NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NULL,
    feedback TEXT NULL,
    strengths TEXT NULL,
    improvements TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY uk_mentoring_feedback_once (session_id, from_user_id, target_type, target_id),
    INDEX idx_mentoring_feedback_session (session_id),
    INDEX idx_mentoring_feedback_assignment (assignment_id),
    INDEX idx_mentoring_feedback_from_user (from_user_id),
    CONSTRAINT fk_mentoring_feedback_session FOREIGN KEY (session_id) REFERENCES mentoring_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_mentoring_feedback_assignment FOREIGN KEY (assignment_id) REFERENCES mentor_assignments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mentoring_feedback_from_user FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_mentoring_feedback_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentoring_action_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    group_id BIGINT UNSIGNED NOT NULL,
    assigned_to_user_id BIGINT UNSIGNED NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    due_date DATE NULL,
    status ENUM('open','in_progress','done','cancelled') NOT NULL DEFAULT 'open',
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_action_item_session (session_id),
    INDEX idx_action_item_group (group_id),
    INDEX idx_action_item_status (status),
    CONSTRAINT fk_action_item_session FOREIGN KEY (session_id) REFERENCES mentoring_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_action_item_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE RESTRICT,
    CONSTRAINT fk_action_item_assignee FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_action_item_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO permissions (permission_code, permission_name, module, description) VALUES
('mentor.assignment.read', 'Read mentor assignments', 'mentor', 'Read mentor assignment workflow data'),
('mentor.assignment.create', 'Create mentor assignments', 'mentor', 'Assign mentors manually to groups'),
('mentor.assignment.update', 'Update mentor assignments', 'mentor', 'Update mentor assignment metadata'),
('mentor.assignment.approve', 'Approve mentor assignments', 'mentor', 'Approve or activate mentor assignments'),
('mentor.assignment.cancel', 'Cancel mentor assignments', 'mentor', 'Cancel mentor assignments'),
('mentor.assignment.complete', 'Complete mentor assignments', 'mentor', 'Complete mentor assignments'),
('mentor.assignment.request', 'Request mentor assignment', 'mentor', 'Request mentor support for a group'),
('mentor.assignment.respond', 'Respond to assignment', 'mentor', 'Mentor accepts or declines assignments'),
('mentor.session.read', 'Read mentoring sessions', 'mentor', 'Read mentoring sessions'),
('mentor.session.create', 'Create mentoring sessions', 'mentor', 'Create mentoring sessions'),
('mentor.session.update', 'Update mentoring sessions', 'mentor', 'Update mentoring sessions'),
('mentor.session.status', 'Change mentoring session status', 'mentor', 'Change mentoring session status'),
('mentor.feedback.manage', 'Manage mentoring feedback', 'mentor', 'Create and read mentoring feedback'),
('mentor.action_item.manage', 'Manage mentoring action items', 'mentor', 'Create and update mentoring action items');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.module = 'mentor'
WHERE r.role_code = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'mentor.assignment.read', 'mentor.assignment.create', 'mentor.assignment.update',
  'mentor.assignment.approve', 'mentor.assignment.cancel', 'mentor.assignment.complete',
  'mentor.assignment.request', 'mentor.session.read', 'mentor.feedback.manage',
  'mentor.action_item.manage'
) WHERE r.role_code = 'department_head';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'mentor.assignment.read', 'mentor.assignment.request', 'mentor.session.read',
  'mentor.feedback.manage', 'mentor.action_item.manage'
) WHERE r.role_code = 'lecturer';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'mentor.assignment.read', 'mentor.assignment.respond', 'mentor.session.read',
  'mentor.session.create', 'mentor.session.update', 'mentor.session.status',
  'mentor.feedback.manage', 'mentor.action_item.manage'
) WHERE r.role_code = 'mentor';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'mentor.session.read', 'mentor.feedback.manage', 'mentor.action_item.manage'
) WHERE r.role_code = 'student';

CREATE TABLE IF NOT EXISTS mentor_matching_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT UNSIGNED NOT NULL,
    class_id INT UNSIGNED NOT NULL,
    semester_id INT UNSIGNED NOT NULL,
    requested_by BIGINT UNSIGNED NULL,
    support_needed TEXT NOT NULL,
    preferred_mentor_type ENUM('business','technical','any') NOT NULL DEFAULT 'any',
    required_expertise JSON NULL,
    priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
    status ENUM('pending','generated','approved','rejected','converted_to_assignment','cancelled') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_matching_request_group (group_id),
    INDEX idx_matching_request_class (class_id),
    INDEX idx_matching_request_semester (semester_id),
    INDEX idx_matching_request_status (status),
    INDEX idx_matching_request_requested_by (requested_by),
    CONSTRAINT fk_matching_request_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE RESTRICT,
    CONSTRAINT fk_matching_request_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_matching_request_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE RESTRICT,
    CONSTRAINT fk_matching_request_user FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentor_matching_suggestions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT UNSIGNED NOT NULL,
    mentor_id BIGINT UNSIGNED NOT NULL,
    score DECIMAL(5,2) NOT NULL DEFAULT 0,
    match_level ENUM('low','medium','high','excellent') NOT NULL DEFAULT 'low',
    reason TEXT NOT NULL,
    strengths JSON NULL,
    risks JSON NULL,
    matching_method ENUM('rule_based','ai','hybrid') NOT NULL DEFAULT 'rule_based',
    recommended_assignment_type ENUM('primary','supporting','business','technical') NULL,
    model_name VARCHAR(150) NULL,
    provider_key VARCHAR(80) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY uk_matching_request_mentor (request_id, mentor_id),
    INDEX idx_matching_suggestion_request_score (request_id, score),
    INDEX idx_matching_suggestion_mentor (mentor_id),
    INDEX idx_matching_suggestion_method (matching_method),
    CONSTRAINT fk_matching_suggestion_request FOREIGN KEY (request_id) REFERENCES mentor_matching_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_matching_suggestion_mentor FOREIGN KEY (mentor_id) REFERENCES mentor_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT chk_matching_suggestion_score CHECK (score BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentor_matching_score_breakdown (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    suggestion_id BIGINT UNSIGNED NOT NULL,
    factor_code VARCHAR(80) NOT NULL,
    factor_name VARCHAR(150) NOT NULL,
    score DECIMAL(5,2) NOT NULL DEFAULT 0,
    weight DECIMAL(5,2) NOT NULL DEFAULT 0,
    reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_matching_breakdown_suggestion (suggestion_id),
    CONSTRAINT fk_matching_breakdown_suggestion FOREIGN KEY (suggestion_id) REFERENCES mentor_matching_suggestions(id) ON DELETE CASCADE,
    CONSTRAINT chk_matching_breakdown_score CHECK (score BETWEEN 0 AND 100),
    CONSTRAINT chk_matching_breakdown_weight CHECK (weight BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mentor_matching_actions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    suggestion_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    action ENUM('viewed','shortlisted','approved','rejected','converted_to_assignment','ignored') NOT NULL,
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_matching_action_suggestion (suggestion_id),
    INDEX idx_matching_action_user (user_id),
    INDEX idx_matching_action_action (action),
    CONSTRAINT fk_matching_action_suggestion FOREIGN KEY (suggestion_id) REFERENCES mentor_matching_suggestions(id) ON DELETE CASCADE,
    CONSTRAINT fk_matching_action_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO permissions (permission_code, permission_name, module, description) VALUES
('mentor.matching.read', 'Read mentor matching', 'mentor', 'Read mentor matching requests and suggestions'),
('mentor.matching.create', 'Create mentor matching request', 'mentor', 'Create mentor matching requests for groups'),
('mentor.matching.generate', 'Generate mentor matching', 'mentor', 'Generate rule-based and AI-assisted mentor suggestions'),
('mentor.matching.action', 'Record mentor matching action', 'mentor', 'Record shortlist, approval, rejection, and ignore actions'),
('mentor.matching.convert', 'Convert mentor matching', 'mentor', 'Convert a mentor matching suggestion to an assignment'),
('mentor.analytics.read', 'Read mentor analytics', 'mentor', 'Read scoped mentor analytics'),
('mentor.analytics.admin_read', 'Read all mentor analytics', 'mentor', 'Read all mentor analytics dashboards'),
('mentor.analytics.export', 'Export mentor analytics', 'mentor', 'Export mentor analytics data'),
('mentor.dashboard.read', 'Read mentor dashboard', 'mentor', 'Read mentor self dashboard');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.module = 'mentor'
WHERE r.role_code = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'mentor.matching.read', 'mentor.matching.create', 'mentor.matching.generate',
  'mentor.matching.action', 'mentor.matching.convert', 'mentor.analytics.read',
  'mentor.analytics.admin_read', 'mentor.analytics.export'
) WHERE r.role_code = 'department_head';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'mentor.matching.read', 'mentor.matching.create', 'mentor.matching.generate',
  'mentor.matching.action', 'mentor.matching.convert', 'mentor.analytics.read'
) WHERE r.role_code = 'lecturer';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'mentor.dashboard.read', 'mentor.analytics.read'
) WHERE r.role_code = 'mentor';

-- Module 5 Phases 3-4: startup progress/support journey and ecosystem events.

CREATE TABLE IF NOT EXISTS startup_progress_updates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    startup_id BIGINT UNSIGNED NOT NULL,
    update_title VARCHAR(200) NOT NULL,
    update_content TEXT NOT NULL,
    update_type ENUM('product','business','customer','revenue','team','mentor','market','legal','other') NOT NULL DEFAULT 'other',
    progress_date DATE NOT NULL,
    visibility ENUM('private','internal','public') NOT NULL DEFAULT 'internal',
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL,
    INDEX idx_startup_progress_startup (startup_id),
    INDEX idx_startup_progress_type (update_type),
    INDEX idx_startup_progress_date (progress_date),
    INDEX idx_startup_progress_visibility (visibility),
    INDEX idx_startup_progress_created_by (created_by),
    CONSTRAINT fk_startup_progress_startup FOREIGN KEY (startup_id) REFERENCES startup_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_startup_progress_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS startup_metrics_snapshots (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    startup_id BIGINT UNSIGNED NOT NULL,
    snapshot_date DATE NOT NULL,
    product_stage ENUM('idea','prototype','mvp','beta','launched','revenue','company') NOT NULL DEFAULT 'idea',
    users_count INT UNSIGNED NULL,
    customers_count INT UNSIGNED NULL,
    revenue_amount DECIMAL(15,2) NULL,
    revenue_currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    team_size INT UNSIGNED NULL,
    mvp_completed TINYINT(1) NOT NULL DEFAULT 0,
    market_validated TINYINT(1) NOT NULL DEFAULT 0,
    has_demo TINYINT(1) NOT NULL DEFAULT 0,
    has_pitch_deck TINYINT(1) NOT NULL DEFAULT 0,
    has_business_model TINYINT(1) NOT NULL DEFAULT 0,
    note TEXT NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_startup_metrics_startup (startup_id),
    INDEX idx_startup_metrics_date (snapshot_date),
    INDEX idx_startup_metrics_stage (product_stage),
    INDEX idx_startup_metrics_created_by (created_by),
    CONSTRAINT fk_startup_metrics_startup FOREIGN KEY (startup_id) REFERENCES startup_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_startup_metrics_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_startup_metrics_revenue CHECK (revenue_amount IS NULL OR revenue_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS startup_support_needs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    startup_id BIGINT UNSIGNED NOT NULL,
    need_type ENUM('business','technical','mentor','funding_connection','legal_advice','marketing','product','other') NOT NULL DEFAULT 'other',
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
    status ENUM('open','in_progress','resolved','cancelled') NOT NULL DEFAULT 'open',
    requested_by BIGINT UNSIGNED NULL,
    assigned_to BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    resolved_at DATETIME NULL,
    INDEX idx_startup_support_startup (startup_id),
    INDEX idx_startup_support_type (need_type),
    INDEX idx_startup_support_status_priority (status, priority),
    INDEX idx_startup_support_requested_by (requested_by),
    INDEX idx_startup_support_assigned_to (assigned_to),
    CONSTRAINT fk_startup_support_startup FOREIGN KEY (startup_id) REFERENCES startup_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_startup_support_requested_by FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_startup_support_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS startup_support_activities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    startup_id BIGINT UNSIGNED NOT NULL,
    support_need_id BIGINT UNSIGNED NULL,
    activity_type ENUM('mentor_session','workshop','partner_intro','investor_intro','review_meeting','demo_day','other') NOT NULL DEFAULT 'other',
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    activity_date DATE NOT NULL,
    related_mentor_id BIGINT UNSIGNED NULL,
    related_partner_id BIGINT UNSIGNED NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_startup_activity_startup (startup_id),
    INDEX idx_startup_activity_need (support_need_id),
    INDEX idx_startup_activity_type (activity_type),
    INDEX idx_startup_activity_date (activity_date),
    INDEX idx_startup_activity_mentor (related_mentor_id),
    INDEX idx_startup_activity_partner (related_partner_id),
    INDEX idx_startup_activity_created_by (created_by),
    CONSTRAINT fk_startup_activity_startup FOREIGN KEY (startup_id) REFERENCES startup_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_startup_activity_need FOREIGN KEY (support_need_id) REFERENCES startup_support_needs(id) ON DELETE SET NULL,
    CONSTRAINT fk_startup_activity_mentor FOREIGN KEY (related_mentor_id) REFERENCES mentor_profiles(id) ON DELETE SET NULL,
    CONSTRAINT fk_startup_activity_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS startup_tags (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    startup_id BIGINT UNSIGNED NOT NULL,
    tag VARCHAR(80) NOT NULL,
    tag_type ENUM('industry','technology','business_model','impact','status','custom') NOT NULL DEFAULT 'custom',
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY uk_startup_tag (startup_id, tag, tag_type),
    INDEX idx_startup_tag_startup (startup_id),
    INDEX idx_startup_tag_type (tag_type),
    INDEX idx_startup_tag_created_by (created_by),
    CONSTRAINT fk_startup_tag_startup FOREIGN KEY (startup_id) REFERENCES startup_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_startup_tag_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ecosystem_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_code VARCHAR(80) NULL,
    event_name VARCHAR(200) NOT NULL,
    event_type ENUM('demo_day','pitching_day','showcase','workshop','networking','competition','other') NOT NULL DEFAULT 'other',
    description TEXT NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NULL,
    location VARCHAR(255) NULL,
    meeting_link VARCHAR(500) NULL,
    visibility ENUM('private','internal','public') NOT NULL DEFAULT 'internal',
    status ENUM('draft','published','completed','cancelled','archived') NOT NULL DEFAULT 'draft',
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL,
    UNIQUE KEY uk_ecosystem_event_code (event_code),
    INDEX idx_ecosystem_event_type (event_type),
    INDEX idx_ecosystem_event_status (status),
    INDEX idx_ecosystem_event_visibility (visibility),
    INDEX idx_ecosystem_event_start (start_at),
    INDEX idx_ecosystem_event_created_by (created_by),
    CONSTRAINT fk_ecosystem_event_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_ecosystem_event_time CHECK (end_at IS NULL OR start_at <= end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_startup_participants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT UNSIGNED NOT NULL,
    startup_id BIGINT UNSIGNED NOT NULL,
    pitch_order INT UNSIGNED NULL,
    booth_location VARCHAR(150) NULL,
    participation_status ENUM('invited','confirmed','presented','absent','withdrawn') NOT NULL DEFAULT 'invited',
    pitch_deck_url VARCHAR(500) NULL,
    demo_url VARCHAR(500) NULL,
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY uk_event_startup (event_id, startup_id),
    INDEX idx_event_participant_event (event_id),
    INDEX idx_event_participant_startup (startup_id),
    INDEX idx_event_participant_status (participation_status),
    CONSTRAINT fk_event_participant_event FOREIGN KEY (event_id) REFERENCES ecosystem_events(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_participant_startup FOREIGN KEY (startup_id) REFERENCES startup_profiles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_judges (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    mentor_id BIGINT UNSIGNED NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NULL,
    organization VARCHAR(255) NULL,
    role_title VARCHAR(150) NULL,
    judge_type ENUM('lecturer','mentor','partner','investor','guest') NOT NULL DEFAULT 'guest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_event_judge_event (event_id),
    INDEX idx_event_judge_user (user_id),
    INDEX idx_event_judge_mentor (mentor_id),
    INDEX idx_event_judge_type (judge_type),
    CONSTRAINT fk_event_judge_event FOREIGN KEY (event_id) REFERENCES ecosystem_events(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_judge_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_event_judge_mentor FOREIGN KEY (mentor_id) REFERENCES mentor_profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_feedbacks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT UNSIGNED NOT NULL,
    startup_id BIGINT UNSIGNED NOT NULL,
    judge_id BIGINT UNSIGNED NULL,
    from_user_id BIGINT UNSIGNED NULL,
    rating TINYINT UNSIGNED NULL,
    feedback TEXT NULL,
    strengths TEXT NULL,
    improvements TEXT NULL,
    interest_level ENUM('none','low','medium','high','follow_up') NOT NULL DEFAULT 'none',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_event_feedback_event (event_id),
    INDEX idx_event_feedback_startup (startup_id),
    INDEX idx_event_feedback_judge (judge_id),
    INDEX idx_event_feedback_from_user (from_user_id),
    CONSTRAINT fk_event_feedback_event FOREIGN KEY (event_id) REFERENCES ecosystem_events(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_feedback_startup FOREIGN KEY (startup_id) REFERENCES startup_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_event_feedback_judge FOREIGN KEY (judge_id) REFERENCES event_judges(id) ON DELETE SET NULL,
    CONSTRAINT fk_event_feedback_from_user FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_event_feedback_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS startup_awards (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    startup_id BIGINT UNSIGNED NOT NULL,
    event_id BIGINT UNSIGNED NULL,
    award_name VARCHAR(200) NOT NULL,
    award_type ENUM('winner','runner_up','best_pitch','best_technology','best_business_model','social_impact','other') NOT NULL DEFAULT 'other',
    description TEXT NULL,
    awarded_at DATETIME NOT NULL,
    evidence_url VARCHAR(500) NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_startup_award_startup (startup_id),
    INDEX idx_startup_award_event (event_id),
    INDEX idx_startup_award_type (award_type),
    INDEX idx_startup_award_created_by (created_by),
    CONSTRAINT fk_startup_award_startup FOREIGN KEY (startup_id) REFERENCES startup_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_startup_award_event FOREIGN KEY (event_id) REFERENCES ecosystem_events(id) ON DELETE SET NULL,
    CONSTRAINT fk_startup_award_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_media (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT UNSIGNED NOT NULL,
    startup_id BIGINT UNSIGNED NULL,
    media_type ENUM('image','video','document','link','other') NOT NULL DEFAULT 'other',
    title VARCHAR(200) NULL,
    file_url VARCHAR(500) NULL,
    external_url VARCHAR(500) NULL,
    visibility ENUM('private','internal','public') NOT NULL DEFAULT 'internal',
    uploaded_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL,
    INDEX idx_event_media_event (event_id),
    INDEX idx_event_media_startup (startup_id),
    INDEX idx_event_media_type (media_type),
    INDEX idx_event_media_visibility (visibility),
    INDEX idx_event_media_uploaded_by (uploaded_by),
    CONSTRAINT fk_event_media_event FOREIGN KEY (event_id) REFERENCES ecosystem_events(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_media_startup FOREIGN KEY (startup_id) REFERENCES startup_profiles(id) ON DELETE SET NULL,
    CONSTRAINT fk_event_media_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO permissions (permission_code, permission_name, module, description) VALUES
('incubation.progress.read', 'Read startup progress', 'incubation', 'Read startup progress updates'),
('incubation.progress.manage', 'Manage startup progress', 'incubation', 'Create and manage startup progress updates'),
('incubation.metrics.read', 'Read startup metrics', 'incubation', 'Read self-reported startup metrics'),
('incubation.metrics.manage', 'Manage startup metrics', 'incubation', 'Create self-reported startup metrics snapshots'),
('incubation.support.read', 'Read startup support journey', 'incubation', 'Read startup support needs and activities'),
('incubation.support.manage', 'Manage startup support journey', 'incubation', 'Manage startup support needs and activities'),
('incubation.event.read', 'Read ecosystem events', 'incubation', 'Read ecosystem events and showcase data'),
('incubation.event.manage', 'Manage ecosystem events', 'incubation', 'Manage demo days, showcases, judges, feedback, awards, and media');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.module = 'incubation'
WHERE r.role_code = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'incubation.progress.read', 'incubation.progress.manage',
  'incubation.metrics.read', 'incubation.metrics.manage',
  'incubation.support.read', 'incubation.support.manage',
  'incubation.event.read', 'incubation.event.manage'
) WHERE r.role_code = 'department_head';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'incubation.progress.read', 'incubation.metrics.read', 'incubation.support.read',
  'incubation.event.read'
) WHERE r.role_code = 'lecturer';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'incubation.progress.read', 'incubation.support.read', 'incubation.event.read'
) WHERE r.role_code = 'mentor';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'incubation.progress.read', 'incubation.progress.manage',
  'incubation.metrics.read', 'incubation.metrics.manage',
  'incubation.support.read', 'incubation.support.manage'
) WHERE r.role_code = 'student';

-- Module 5 Phases 5-6: startup alumni, partners, opportunities, and analytics permissions.

CREATE TABLE IF NOT EXISTS startup_alumni_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    student_id BIGINT UNSIGNED NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NULL,
    phone VARCHAR(20) NULL,
    graduation_year INT UNSIGNED NULL,
    major VARCHAR(150) NULL,
    campus VARCHAR(100) NULL,
    current_position VARCHAR(150) NULL,
    current_company VARCHAR(255) NULL,
    linkedin_url VARCHAR(500) NULL,
    bio TEXT NULL,
    status ENUM('active','inactive','archived') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL,
    INDEX idx_startup_alumni_user (user_id),
    INDEX idx_startup_alumni_student (student_id),
    INDEX idx_startup_alumni_status (status),
    INDEX idx_startup_alumni_year (graduation_year),
    CONSTRAINT fk_startup_alumni_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_startup_alumni_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alumni_startup_links (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    alumni_id BIGINT UNSIGNED NOT NULL,
    startup_id BIGINT UNSIGNED NOT NULL,
    role ENUM('founder','co_founder','member','advisor','mentor','investor','partner') NOT NULL DEFAULT 'founder',
    start_date DATE NULL,
    end_date DATE NULL,
    status ENUM('active','inactive','past') NOT NULL DEFAULT 'active',
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY uk_alumni_startup_role (alumni_id, startup_id, role),
    INDEX idx_alumni_startup_alumni (alumni_id),
    INDEX idx_alumni_startup_startup (startup_id),
    INDEX idx_alumni_startup_status (status),
    CONSTRAINT fk_alumni_startup_alumni FOREIGN KEY (alumni_id) REFERENCES startup_alumni_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_alumni_startup_startup FOREIGN KEY (startup_id) REFERENCES startup_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT chk_alumni_startup_dates CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ecosystem_partners (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    partner_name VARCHAR(200) NOT NULL,
    partner_type ENUM('company','incubator','accelerator','investor_fund','angel_investor','university','government','ngo','community','other') NOT NULL DEFAULT 'other',
    contact_person VARCHAR(150) NULL,
    contact_email VARCHAR(150) NULL,
    contact_phone VARCHAR(20) NULL,
    website_url VARCHAR(500) NULL,
    description TEXT NULL,
    focus_areas JSON NULL,
    status ENUM('active','inactive','archived') NOT NULL DEFAULT 'active',
    visibility ENUM('private','internal','public') NOT NULL DEFAULT 'internal',
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP NULL,
    INDEX idx_ecosystem_partner_type (partner_type),
    INDEX idx_ecosystem_partner_status (status),
    INDEX idx_ecosystem_partner_visibility (visibility),
    INDEX idx_ecosystem_partner_created_by (created_by),
    CONSTRAINT fk_ecosystem_partner_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS startup_partner_connections (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    startup_id BIGINT UNSIGNED NOT NULL,
    partner_id BIGINT UNSIGNED NOT NULL,
    connection_type ENUM('introduction','mentoring','pilot','customer','investor_interest','incubation_program','partnership','other') NOT NULL DEFAULT 'other',
    status ENUM('proposed','contacted','in_progress','successful','rejected','cancelled') NOT NULL DEFAULT 'proposed',
    introduced_by BIGINT UNSIGNED NULL,
    contact_date DATE NULL,
    follow_up_date DATE NULL,
    note TEXT NULL,
    outcome TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_startup_partner_startup (startup_id),
    INDEX idx_startup_partner_partner (partner_id),
    INDEX idx_startup_partner_status (status),
    INDEX idx_startup_partner_follow_up (follow_up_date),
    INDEX idx_startup_partner_intro_by (introduced_by),
    CONSTRAINT fk_startup_partner_startup FOREIGN KEY (startup_id) REFERENCES startup_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_startup_partner_partner FOREIGN KEY (partner_id) REFERENCES ecosystem_partners(id) ON DELETE RESTRICT,
    CONSTRAINT fk_startup_partner_intro_by FOREIGN KEY (introduced_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ecosystem_opportunities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    partner_id BIGINT UNSIGNED NULL,
    opportunity_type ENUM('incubation_program','grant','competition','workshop','mentor_session','pilot_program','investor_meeting','other') NOT NULL DEFAULT 'other',
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    eligibility TEXT NULL,
    deadline DATETIME NULL,
    external_url VARCHAR(500) NULL,
    status ENUM('draft','open','closed','archived') NOT NULL DEFAULT 'draft',
    visibility ENUM('private','internal','public') NOT NULL DEFAULT 'internal',
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_ecosystem_opp_partner (partner_id),
    INDEX idx_ecosystem_opp_type (opportunity_type),
    INDEX idx_ecosystem_opp_status (status),
    INDEX idx_ecosystem_opp_visibility (visibility),
    INDEX idx_ecosystem_opp_deadline (deadline),
    INDEX idx_ecosystem_opp_created_by (created_by),
    CONSTRAINT fk_ecosystem_opp_partner FOREIGN KEY (partner_id) REFERENCES ecosystem_partners(id) ON DELETE SET NULL,
    CONSTRAINT fk_ecosystem_opp_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS startup_opportunity_applications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    startup_id BIGINT UNSIGNED NOT NULL,
    opportunity_id BIGINT UNSIGNED NOT NULL,
    applied_by BIGINT UNSIGNED NULL,
    application_status ENUM('interested','applied','shortlisted','accepted','rejected','withdrawn') NOT NULL DEFAULT 'interested',
    application_note TEXT NULL,
    submitted_at DATETIME NULL,
    result_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY uk_startup_opportunity_application (startup_id, opportunity_id),
    INDEX idx_startup_opp_app_startup (startup_id),
    INDEX idx_startup_opp_app_opportunity (opportunity_id),
    INDEX idx_startup_opp_app_status (application_status),
    INDEX idx_startup_opp_app_applied_by (applied_by),
    CONSTRAINT fk_startup_opp_app_startup FOREIGN KEY (startup_id) REFERENCES startup_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_startup_opp_app_opportunity FOREIGN KEY (opportunity_id) REFERENCES ecosystem_opportunities(id) ON DELETE RESTRICT,
    CONSTRAINT fk_startup_opp_app_applied_by FOREIGN KEY (applied_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO permissions (permission_code, permission_name, module, description) VALUES
('incubation.ecosystem.read', 'Read incubation ecosystem', 'incubation', 'Read alumni, partners, connections, and opportunities'),
('incubation.ecosystem.manage', 'Manage incubation ecosystem', 'incubation', 'Manage alumni, partners, connections, and opportunities'),
('incubation.opportunity.read', 'Read ecosystem opportunities', 'incubation', 'Read ecosystem opportunities'),
('incubation.opportunity.manage', 'Manage ecosystem opportunities', 'incubation', 'Manage ecosystem opportunities and applications'),
('incubation.analytics.admin_read', 'Read all incubation analytics', 'incubation', 'Read all incubation analytics dashboards'),
('incubation.reports.export', 'Export incubation reports', 'incubation', 'Export incubation reports'),
('incubation.ecosystem_health.read', 'Read ecosystem health', 'incubation', 'Read incubation ecosystem health warnings');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.module = 'incubation'
WHERE r.role_code = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'incubation.ecosystem.read', 'incubation.ecosystem.manage',
  'incubation.opportunity.read', 'incubation.opportunity.manage',
  'incubation.analytics.read', 'incubation.analytics.admin_read',
  'incubation.reports.export', 'incubation.ecosystem_health.read'
) WHERE r.role_code = 'department_head';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'incubation.ecosystem.read', 'incubation.opportunity.read',
  'incubation.analytics.read', 'incubation.ecosystem_health.read'
) WHERE r.role_code = 'lecturer';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'incubation.ecosystem.read', 'incubation.opportunity.read'
) WHERE r.role_code = 'mentor';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'incubation.opportunity.read'
) WHERE r.role_code = 'student';
