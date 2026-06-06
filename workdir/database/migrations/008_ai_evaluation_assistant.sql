CREATE TABLE IF NOT EXISTS ai_analysis_jobs (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    target_type    ENUM('checkpoint_submission','assignment_submission') NOT NULL,
    target_id      BIGINT UNSIGNED NOT NULL,
    requested_by   BIGINT UNSIGNED NOT NULL,
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
    INDEX idx_ai_jobs_requested_by (requested_by),
    CONSTRAINT fk_ai_jobs_requested_by FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    raw_response                            MEDIUMTEXT NULL,
    created_at                              TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_ai_suggestions_target (target_type, target_id, created_at),
    INDEX idx_ai_suggestions_job (job_id),
    INDEX idx_ai_suggestions_rubric (rubric_id),
    CONSTRAINT fk_ai_suggestions_job FOREIGN KEY (job_id) REFERENCES ai_analysis_jobs(id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_suggestions_rubric FOREIGN KEY (rubric_id) REFERENCES rubrics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO permissions (permission_code, permission_name, module) VALUES
('ai.evaluation.analyze', 'Yêu cầu AI phân tích bài nộp', 'ai'),
('ai.evaluation.read', 'Xem gợi ý AI evaluation', 'ai'),
('ai.evaluation.action', 'Ghi nhận thao tác với gợi ý AI', 'ai'),
('ai.evaluation.admin_read', 'Quản trị xem toàn bộ gợi ý AI', 'ai'),
('ai.settings.read', 'Xem cấu hình AI', 'ai'),
('ai.settings.update', 'Cập nhật cấu hình AI', 'ai');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'ai.evaluation.analyze', 'ai.evaluation.read', 'ai.evaluation.action'
) WHERE r.role_code = 'lecturer';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.module = 'ai'
WHERE r.role_code IN ('admin', 'department_head');

INSERT IGNORE INTO system_settings (setting_key, setting_value, data_type, module, description) VALUES
('allow_ai_score_suggestion', 'true', 'boolean', 'ai', 'Cho phép AI gợi ý điểm tham khảo'),
('allow_ai_feedback_suggestion', 'true', 'boolean', 'ai', 'Cho phép AI gợi ý feedback'),
('allow_student_view_ai_feedback', 'false', 'boolean', 'ai', 'Không cho sinh viên xem AI suggestion mặc định'),
('data_retention_days', '180', 'integer', 'ai', 'Số ngày giữ dữ liệu AI suggestion');
