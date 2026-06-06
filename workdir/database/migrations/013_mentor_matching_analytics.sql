-- Module 4 Phases 5-6: mentor matching suggestions and analytics permissions.

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
