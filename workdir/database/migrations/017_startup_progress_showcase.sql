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
