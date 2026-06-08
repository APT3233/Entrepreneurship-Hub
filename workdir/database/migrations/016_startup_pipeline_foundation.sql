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
