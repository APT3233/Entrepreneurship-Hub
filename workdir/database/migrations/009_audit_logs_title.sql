-- Add optional audit title used by auditService.log({ title }) across modules.
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_logs' AND COLUMN_NAME = 'title'
);
SET @sql = IF(
    @col_exists = 0,
    "ALTER TABLE audit_logs ADD COLUMN title VARCHAR(200) NULL AFTER record_id",
    "SELECT 1"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
