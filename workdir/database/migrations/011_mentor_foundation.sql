-- Module 4 Phase 1: Mentor foundation database, RBAC, and seed data.

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
