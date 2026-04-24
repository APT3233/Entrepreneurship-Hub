-- File nộp bài assignment (theo nhóm), tương tự checkpoint_submission_files

CREATE TABLE IF NOT EXISTS assignment_submission_files (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    submission_id  BIGINT UNSIGNED NOT NULL COMMENT 'FK assignment_submissions',
    file_name      VARCHAR(255)    NOT NULL,
    file_path      VARCHAR(1000)   NOT NULL,
    file_url       VARCHAR(1000)       NULL,
    file_type      VARCHAR(20)       NULL,
    mime_type      VARCHAR(100)      NULL,
    file_size      INT UNSIGNED      NULL,
    uploaded_by    BIGINT UNSIGNED   NULL,
    uploaded_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_deleted     TINYINT(1) DEFAULT 0 NOT NULL,
    deleted_at     TIMESTAMP        NULL,
    INDEX idx_asf_submission (submission_id),
    INDEX idx_asf_uploader   (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='File nộp assignment theo nhóm';

ALTER TABLE assignment_submission_files
  ADD CONSTRAINT fk_asf_submission FOREIGN KEY (submission_id) REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_asf_uploader   FOREIGN KEY (uploaded_by)   REFERENCES users(id)               ON DELETE SET NULL;
