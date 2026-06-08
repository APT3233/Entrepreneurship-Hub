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
