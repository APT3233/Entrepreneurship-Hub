-- Migration: Add upload_sessions table and file state tracking
-- For presigned URL upload system (Plan 2.2 sections 1-6)

CREATE TABLE IF NOT EXISTS upload_sessions (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT UNSIGNED NOT NULL,
    checkpoint_id  BIGINT UNSIGNED NOT NULL,
    group_id       BIGINT UNSIGNED NOT NULL,
    status         ENUM('initiated','uploading','completed','expired')
                       DEFAULT 'initiated' NOT NULL,
    file_count     TINYINT UNSIGNED NOT NULL DEFAULT 0,
    expires_at     DATETIME NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_us_user               (user_id),
    INDEX idx_us_checkpoint_group   (checkpoint_id, group_id),
    INDEX idx_us_status             (status),
    INDEX idx_us_expires            (expires_at),
    CONSTRAINT fk_us_user       FOREIGN KEY (user_id)       REFERENCES users(id)        ON DELETE CASCADE,
    CONSTRAINT fk_us_checkpoint FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id)  ON DELETE RESTRICT,
    CONSTRAINT fk_us_group      FOREIGN KEY (group_id)      REFERENCES `groups`(id)     ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add columns to checkpoint_submission_files (idempotent with IF NOT EXISTS workaround)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'checkpoint_submission_files' AND COLUMN_NAME = 'upload_status');
SET @sql = IF(@col_exists = 0, "ALTER TABLE checkpoint_submission_files ADD COLUMN upload_status ENUM('pending','uploaded','failed') DEFAULT 'pending' NOT NULL AFTER file_size, ADD COLUMN etag VARCHAR(255) NULL AFTER upload_status, ADD COLUMN session_id BIGINT UNSIGNED NULL AFTER etag", 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
