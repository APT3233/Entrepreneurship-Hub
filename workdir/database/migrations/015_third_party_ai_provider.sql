-- Generic third-party OpenAI-compatible API provider settings.
-- Legacy provider_cmd_api_* keys are kept for backward compatibility but are no longer canonical.

INSERT IGNORE INTO system_settings (setting_key, setting_value, data_type, module, description) VALUES
('provider_third_party_api_enabled', 'true', 'boolean', 'ai', 'Bật provider API bên thứ ba'),
('provider_third_party_api_base_url', 'https://api.openai.com/v1', 'string', 'ai', 'Third-party API base URL'),
('provider_third_party_api_model', 'gpt-4o-mini', 'string', 'ai', 'Third-party API model'),
('provider_third_party_api_stream', 'true', 'boolean', 'ai', 'Third-party API stream mode'),
('provider_third_party_api_api_key_required', 'true', 'boolean', 'ai', 'Third-party API có bắt buộc API key không');

UPDATE system_settings next_setting
JOIN system_settings old_setting ON old_setting.module = 'ai' AND old_setting.setting_key = 'provider_cmd_api_enabled'
SET next_setting.setting_value = old_setting.setting_value,
    next_setting.updated_at = NOW()
WHERE next_setting.module = 'ai'
  AND next_setting.setting_key = 'provider_third_party_api_enabled';

UPDATE system_settings next_setting
JOIN system_settings old_setting ON old_setting.module = 'ai' AND old_setting.setting_key = 'provider_cmd_api_base_url'
SET next_setting.setting_value = old_setting.setting_value,
    next_setting.updated_at = NOW()
WHERE next_setting.module = 'ai'
  AND next_setting.setting_key = 'provider_third_party_api_base_url';

UPDATE system_settings next_setting
JOIN system_settings old_setting ON old_setting.module = 'ai' AND old_setting.setting_key = 'provider_cmd_api_model'
SET next_setting.setting_value = old_setting.setting_value,
    next_setting.updated_at = NOW()
WHERE next_setting.module = 'ai'
  AND next_setting.setting_key = 'provider_third_party_api_model';

UPDATE system_settings next_setting
JOIN system_settings old_setting ON old_setting.module = 'ai' AND old_setting.setting_key = 'provider_cmd_api_stream'
SET next_setting.setting_value = old_setting.setting_value,
    next_setting.updated_at = NOW()
WHERE next_setting.module = 'ai'
  AND next_setting.setting_key = 'provider_third_party_api_stream';

INSERT IGNORE INTO system_settings (setting_key, setting_value, data_type, module, description)
SELECT 'third_party_api_key_encrypted', setting_value, data_type, module, 'Encrypted third-party API key'
FROM system_settings
WHERE module = 'ai'
  AND setting_key = 'cmd_api_key_encrypted'
  AND COALESCE(setting_value, '') <> '';

UPDATE system_settings
SET setting_value = 'third-party-api',
    updated_at = NOW()
WHERE module = 'ai'
  AND setting_key IN ('ai_active_provider', 'ai_provider')
  AND setting_value IN ('cmd-api', 'cmd-local', 'cmd-local-api');
