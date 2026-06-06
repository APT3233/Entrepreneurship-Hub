import { optional, toBool, toInt } from "./validate.js";

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeSecret = (value) => {
  const text = String(value || "").trim();
  if (!text || text === "your_api_key_here" || text === "your_cmd_api_key_here" || text === "change_me") return "";
  return text;
};

const normalizeProviderKey = (value) => {
  const key = String(value || "").trim();
  if (key === "cmd-local" || key === "cmd-local-api") return "cmd-api";
  return key || "cmd-api";
};

const activeProvider = normalizeProviderKey(optional("AI_ACTIVE_PROVIDER", optional("AI_PROVIDER", "cmd-api")));
const defaultStream = toBool(optional("AI_STREAM", "true"), true);
const defaultMaxTokens = toInt(optional("AI_MAX_TOKENS", "4096"), 4096);
const defaultTemperature = toNumber(optional("AI_TEMPERATURE", "0.2"), 0.2);

const providers = Object.freeze({
  "cmd-api": Object.freeze({
    key: "cmd-api",
    name: "CMD API",
    type: "openai-compatible",
    enabled: toBool(optional("CMD_AI_ENABLED", "true"), true),
    baseUrl: optional("CMD_AI_BASE_URL", optional("AI_BASE_URL", "http://localhost:20128/v1")),
    chatCompletionsPath: optional("CMD_AI_CHAT_COMPLETIONS_PATH", optional("AI_CHAT_COMPLETIONS_PATH", "/chat/completions")),
    apiKey: normalizeSecret(process.env.CMD_API_KEY),
    apiKeyRequired: true,
    model: optional("CMD_AI_MODEL", optional("AI_MODEL", "cmc/MiniMaxAI/MiniMax-M2.5")),
    stream: toBool(optional("CMD_AI_STREAM", optional("AI_STREAM", "true")), true),
  }),
  "local-gemma": Object.freeze({
    key: "local-gemma",
    name: "Local Ollama",
    type: "openai-compatible",
    enabled: toBool(optional("LOCAL_GEMMA_ENABLED", "true"), true),
    baseUrl: optional("LOCAL_GEMMA_BASE_URL", "http://ollama:11434/v1"),
    fallbackBaseUrls: [optional("LOCAL_GEMMA_HOST_BASE_URL", "http://localhost:11434/v1")],
    chatCompletionsPath: optional("LOCAL_GEMMA_CHAT_COMPLETIONS_PATH", "/chat/completions"),
    apiKey: normalizeSecret(process.env.LOCAL_GEMMA_API_KEY),
    apiKeyRequired: toBool(optional("LOCAL_GEMMA_API_KEY_REQUIRED", "false"), false),
    model: optional("LOCAL_GEMMA_MODEL", "qwen2.5:7b"),
    stream: toBool(optional("LOCAL_GEMMA_STREAM", optional("AI_STREAM", "true")), true),
  }),
});

export const aiConfig = Object.freeze({
  enabled: toBool(optional("AI_ENABLED", "false"), false),
  activeProvider,
  provider: activeProvider,
  timeoutMs: toInt(optional("AI_TIMEOUT_MS", "120000"), 120_000),
  defaultMaxTokens,
  defaultTemperature,
  defaultStream,
  providers,
  // Backward-compatible aliases for older Phase 5 code paths.
  baseUrl: providers["cmd-api"].baseUrl,
  chatCompletionsPath: providers["cmd-api"].chatCompletionsPath,
  apiKey: providers["cmd-api"].apiKey,
  secretEncryptionKey: normalizeSecret(process.env.AI_SECRET_ENCRYPTION_KEY || process.env.APP_SECRET_ENCRYPTION_KEY),
  model: providers["cmd-api"].model,
  stream: defaultStream,
  maxTokens: defaultMaxTokens,
  temperature: defaultTemperature,
  debugRawResponse: toBool(optional("DEBUG_AI", "false"), false),
  debugPromptMaxChars: toInt(optional("AI_DEBUG_PROMPT_MAX_CHARS", "12000"), 12_000),
  inputMaxChars: toInt(optional("AI_INPUT_MAX_CHARS", "60000"), 60_000),
  analyzeCooldownSeconds: toInt(optional("AI_ANALYZE_COOLDOWN_SECONDS", "60"), 60),
  worker: {
    enabled: toBool(optional("AI_WORKER_ENABLED", "true"), true),
    pollMs: toInt(optional("AI_WORKER_POLL_MS", "3000"), 3_000),
    maxRowsPerTick: Math.min(10, Math.max(1, toInt(optional("AI_WORKER_MAX_ROWS_PER_TICK", optional("AI_MAX_CONCURRENT_JOBS", "1")), 1))),
    maxConcurrentJobs: Math.min(10, Math.max(1, toInt(optional("AI_MAX_CONCURRENT_JOBS", "1"), 1))),
    staleProcessingMinutes: toInt(optional("AI_WORKER_STALE_PROCESSING_MINUTES", "15"), 15),
    maxAttempts: toInt(optional("AI_WORKER_MAX_ATTEMPTS", "3"), 3),
    lockTtlSec: toInt(optional("AI_WORKER_LOCK_TTL_SEC", "120"), 120),
    shutdownGraceMs: toInt(optional("AI_WORKER_SHUTDOWN_GRACE_MS", "30000"), 30_000),
  },
});
