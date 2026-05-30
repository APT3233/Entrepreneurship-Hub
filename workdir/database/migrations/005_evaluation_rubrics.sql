-- Module 3 Evaluation & Analytics - Phase 1: Rubric-based grading

CREATE TABLE IF NOT EXISTS rubrics (
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
    CONSTRAINT fk_rubric_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    CONSTRAINT fk_rubric_parent FOREIGN KEY (parent_rubric_id) REFERENCES rubrics(id) ON DELETE SET NULL,
    CONSTRAINT fk_rubric_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_rubric_total_score CHECK (total_score > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Rubric definitions for checkpoint/assignment grading';

CREATE TABLE IF NOT EXISTS rubric_criteria (
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
    CONSTRAINT fk_criteria_rubric FOREIGN KEY (rubric_id) REFERENCES rubrics(id) ON DELETE CASCADE,
    CONSTRAINT chk_criteria_max_score CHECK (max_score > 0),
    CONSTRAINT chk_criteria_weight CHECK (weight >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Criteria in each grading rubric';

CREATE TABLE IF NOT EXISTS rubric_bindings (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rubric_id     BIGINT UNSIGNED NOT NULL,
    target_type   ENUM('checkpoint','assignment') NOT NULL,
    target_id     BIGINT UNSIGNED NOT NULL,
    created_by    BIGINT UNSIGNED NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY uk_rubric_binding_target (target_type, target_id),
    INDEX idx_binding_rubric (rubric_id),
    CONSTRAINT fk_binding_rubric FOREIGN KEY (rubric_id) REFERENCES rubrics(id) ON DELETE CASCADE,
    CONSTRAINT fk_binding_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Rubric attached to a checkpoint or assignment';

CREATE TABLE IF NOT EXISTS evaluation_sessions (
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
    INDEX idx_eval_status (status),
    CONSTRAINT fk_eval_rubric FOREIGN KEY (rubric_id) REFERENCES rubrics(id) ON DELETE RESTRICT,
    CONSTRAINT fk_eval_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE RESTRICT,
    CONSTRAINT fk_eval_evaluator FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='One rubric grading session for a group submission';

CREATE TABLE IF NOT EXISTS evaluation_scores (
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
    CONSTRAINT fk_eval_score_session FOREIGN KEY (evaluation_session_id) REFERENCES evaluation_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_eval_score_criterion FOREIGN KEY (criterion_id) REFERENCES rubric_criteria(id) ON DELETE RESTRICT,
    CONSTRAINT chk_eval_score_non_negative CHECK (score >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Scores and feedback per rubric criterion';
