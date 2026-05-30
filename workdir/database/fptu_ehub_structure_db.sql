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
