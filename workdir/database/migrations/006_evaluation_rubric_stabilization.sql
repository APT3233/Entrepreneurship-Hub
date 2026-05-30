-- Module 3 Evaluation & Analytics - Phase 1.5: Stabilize rubric grading

SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rubrics' AND COLUMN_NAME = 'version'
);
SET @sql = IF(
    @col_exists = 0,
    "ALTER TABLE rubrics ADD COLUMN version INT UNSIGNED NOT NULL DEFAULT 1 AFTER total_score",
    "SELECT 1"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rubrics' AND COLUMN_NAME = 'parent_rubric_id'
);
SET @sql = IF(
    @col_exists = 0,
    "ALTER TABLE rubrics ADD COLUMN parent_rubric_id BIGINT UNSIGNED NULL AFTER version",
    "SELECT 1"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rubrics' AND INDEX_NAME = 'idx_rubric_parent'
);
SET @sql = IF(
    @idx_exists = 0,
    "ALTER TABLE rubrics ADD INDEX idx_rubric_parent (parent_rubric_id, version)",
    "SELECT 1"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rubrics' AND CONSTRAINT_NAME = 'fk_rubric_parent'
);
SET @sql = IF(
    @fk_exists = 0,
    "ALTER TABLE rubrics ADD CONSTRAINT fk_rubric_parent FOREIGN KEY (parent_rubric_id) REFERENCES rubrics(id) ON DELETE SET NULL",
    "SELECT 1"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'evaluation_sessions' AND COLUMN_NAME = 'evaluator_role'
);
SET @sql = IF(
    @col_exists = 0,
    "ALTER TABLE evaluation_sessions ADD COLUMN evaluator_role VARCHAR(32) NOT NULL DEFAULT 'lecturer' AFTER evaluator_id",
    "SELECT 1"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'evaluation_sessions' AND COLUMN_NAME = 'is_official'
);
SET @sql = IF(
    @col_exists = 0,
    "ALTER TABLE evaluation_sessions ADD COLUMN is_official TINYINT(1) NOT NULL DEFAULT 1 AFTER evaluator_role",
    "SELECT 1"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'evaluation_sessions' AND INDEX_NAME = 'idx_eval_official'
);
SET @sql = IF(
    @idx_exists = 0,
    "ALTER TABLE evaluation_sessions ADD INDEX idx_eval_official (is_official)",
    "SELECT 1"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
