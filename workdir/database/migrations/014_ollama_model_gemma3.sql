-- Chuyển model Ollama mặc định từ qwen2.5:7b sang gemma3:4b
UPDATE system_settings
SET setting_value = 'gemma3:4b',
    updated_at = NOW()
WHERE setting_key = 'provider_local_gemma_model'
  AND setting_value = 'qwen2.5:7b';
