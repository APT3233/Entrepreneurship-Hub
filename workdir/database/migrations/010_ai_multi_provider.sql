-- Module 3 Phase 5 update: multi-provider AI settings and audit columns.

SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_analysis_jobs' AND COLUMN_NAME = 'provider_key'
);
SET @sql = IF(
    @col_exists = 0,
    "ALTER TABLE ai_analysis_jobs ADD COLUMN provider_key VARCHAR(50) NULL AFTER requested_by",
    "SELECT 1"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_analysis_jobs' AND COLUMN_NAME = 'model_name'
);
SET @sql = IF(
    @col_exists = 0,
    "ALTER TABLE ai_analysis_jobs ADD COLUMN model_name VARCHAR(200) NULL AFTER provider_key",
    "SELECT 1"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_evaluation_suggestions' AND COLUMN_NAME = 'provider_key'
);
SET @sql = IF(
    @col_exists = 0,
    "ALTER TABLE ai_evaluation_suggestions ADD COLUMN provider_key VARCHAR(50) NULL AFTER model_name",
    "SELECT 1"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_analysis_jobs' AND INDEX_NAME = 'idx_ai_jobs_provider'
);
SET @sql = IF(
    @idx_exists = 0,
    "ALTER TABLE ai_analysis_jobs ADD INDEX idx_ai_jobs_provider (provider_key, model_name)",
    "SELECT 1"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_evaluation_suggestions' AND INDEX_NAME = 'idx_ai_suggestions_provider'
);
SET @sql = IF(
    @idx_exists = 0,
    "ALTER TABLE ai_evaluation_suggestions ADD INDEX idx_ai_suggestions_provider (provider_key, model_name)",
    "SELECT 1"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO permissions (permission_code, permission_name, module) VALUES
('ai.settings.test_provider', 'Kiểm tra kết nối AI provider', 'ai'),
('ai.settings.switch_provider', 'Chuyển AI provider đang sử dụng', 'ai');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_code IN (
  'ai.settings.test_provider', 'ai.settings.switch_provider'
) WHERE r.role_code IN ('admin', 'department_head');

INSERT IGNORE INTO system_settings (setting_key, setting_value, data_type, module, description) VALUES
('ai_active_provider', 'local-gemma', 'string', 'ai', 'AI provider đang sử dụng'),
('provider_cmd_api_enabled', 'true', 'boolean', 'ai', 'Bật provider CMD API'),
('provider_cmd_api_base_url', 'http://localhost:20128/v1', 'string', 'ai', 'CMD API base URL'),
('provider_cmd_api_model', 'cmc/MiniMaxAI/MiniMax-M2.5', 'string', 'ai', 'CMD API model'),
('provider_cmd_api_stream', 'true', 'boolean', 'ai', 'CMD API stream mode'),
('provider_local_gemma_enabled', 'true', 'boolean', 'ai', 'Bật provider Local Ollama'),
('provider_local_gemma_base_url', 'http://ollama:11434/v1', 'string', 'ai', 'Local Ollama base URL'),
('provider_local_gemma_model', 'qwen2.5:7b', 'string', 'ai', 'Local Ollama model'),
('provider_local_gemma_stream', 'true', 'boolean', 'ai', 'Local Ollama stream mode'),
('provider_local_gemma_api_key_required', 'false', 'boolean', 'ai', 'Local Ollama có bắt buộc API key không');

UPDATE system_settings next_setting
JOIN system_settings old_setting ON old_setting.module = 'ai' AND old_setting.setting_key = 'ai_provider'
SET next_setting.setting_value = CASE
  WHEN old_setting.setting_value IN ('cmd-local', 'cmd-local-api') THEN 'cmd-api'
  ELSE old_setting.setting_value
END
WHERE next_setting.module = 'ai'
  AND next_setting.setting_key = 'ai_active_provider'
  AND old_setting.setting_value <> '';

UPDATE system_settings next_setting
JOIN system_settings old_setting ON old_setting.module = 'ai' AND old_setting.setting_key = 'base_url'
SET next_setting.setting_value = old_setting.setting_value
WHERE next_setting.module = 'ai'
  AND next_setting.setting_key = 'provider_cmd_api_base_url'
  AND old_setting.setting_value <> '';

UPDATE system_settings next_setting
JOIN system_settings old_setting ON old_setting.module = 'ai' AND old_setting.setting_key = 'model_name'
SET next_setting.setting_value = old_setting.setting_value
WHERE next_setting.module = 'ai'
  AND next_setting.setting_key = 'provider_cmd_api_model'
  AND old_setting.setting_value <> '';

UPDATE system_settings next_setting
JOIN system_settings old_setting ON old_setting.module = 'ai' AND old_setting.setting_key = 'stream'
SET next_setting.setting_value = old_setting.setting_value
WHERE next_setting.module = 'ai'
  AND next_setting.setting_key = 'provider_cmd_api_stream'
  AND old_setting.setting_value <> '';
