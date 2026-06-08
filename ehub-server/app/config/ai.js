import { optional, toBool, toInt } from "./validate.js";

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeSecret = (value) => {
  const text = String(value || "").trim();
  if (!text || text === "your_api_key_here" || text === "your_cmd_api_key_here" || text === "your_third_party_api_key_here" || text === "change_me") return "";
  return text;
};

const normalizeProviderKey = (value) => {
  const key = String(value || "").trim();
  if (["cmd-local", "cmd-local-api", "cmd-api", "external-api", "openai-compatible"].includes(key)) return "third-party-api";
  return key || "third-party-api";
};

const activeProvider = normalizeProviderKey(optional("AI_ACTIVE_PROVIDER", optional("AI_PROVIDER", "local-gemma")));
const defaultStream = toBool(optional("AI_STREAM", "true"), true);
const defaultMaxTokens = toInt(optional("AI_MAX_TOKENS", "4096"), 4096);
const defaultTemperature = toNumber(optional("AI_TEMPERATURE", "0.2"), 0.2);

const providers = Object.freeze({
  "third-party-api": Object.freeze({
    key: "third-party-api",
    name: "Third-party API",
    type: "openai-compatible",
    enabled: toBool(optional("THIRD_PARTY_AI_ENABLED", optional("CMD_AI_ENABLED", "true")), true),
    baseUrl: optional("THIRD_PARTY_AI_BASE_URL", optional("CMD_AI_BASE_URL", optional("AI_BASE_URL", "https://api.openai.com/v1"))),
    chatCompletionsPath: optional("THIRD_PARTY_AI_CHAT_COMPLETIONS_PATH", optional("CMD_AI_CHAT_COMPLETIONS_PATH", optional("AI_CHAT_COMPLETIONS_PATH", "/chat/completions"))),
    apiKey: normalizeSecret(process.env.THIRD_PARTY_API_KEY || process.env.CMD_API_KEY),
    apiKeyRequired: true,
    model: optional("THIRD_PARTY_AI_MODEL", optional("CMD_AI_MODEL", optional("AI_MODEL", "gpt-4o-mini"))),
    stream: toBool(optional("THIRD_PARTY_AI_STREAM", optional("CMD_AI_STREAM", optional("AI_STREAM", "true"))), true),
  }),
  "local-gemma": Object.freeze({
    key: "local-gemma",
    name: "Local Ollama",
    type: "openai-compatible",
    enabled: toBool(optional("LOCAL_GEMMA_ENABLED", "true"), true),
    baseUrl: optional("LOCAL_GEMMA_BASE_URL", "http://ollama:11434/v1"),
    fallbackBaseUrls: [optional("LOCAL_GEMMA_HOST_BASE_URL", "http://localhost:11435/v1")],
    chatCompletionsPath: optional("LOCAL_GEMMA_CHAT_COMPLETIONS_PATH", "/chat/completions"),
    apiKey: normalizeSecret(process.env.LOCAL_GEMMA_API_KEY),
    apiKeyRequired: toBool(optional("LOCAL_GEMMA_API_KEY_REQUIRED", "false"), false),
    model: optional("LOCAL_GEMMA_MODEL", "gemma3:4b"),
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
  baseUrl: providers["third-party-api"].baseUrl,
  chatCompletionsPath: providers["third-party-api"].chatCompletionsPath,
  apiKey: providers["third-party-api"].apiKey,
  secretEncryptionKey: normalizeSecret(process.env.AI_SECRET_ENCRYPTION_KEY || process.env.APP_SECRET_ENCRYPTION_KEY),
  model: providers["third-party-api"].model,
  stream: defaultStream,
  maxTokens: defaultMaxTokens,
  temperature: defaultTemperature,
  debugRawResponse: toBool(optional("DEBUG_AI", "false"), false),
  debugPromptMaxChars: toInt(optional("AI_DEBUG_PROMPT_MAX_CHARS", "12000"), 12_000),
  inputMaxChars: toInt(optional("AI_INPUT_MAX_CHARS", "60000"), 60_000),
  analyzeCooldownSeconds: toInt(optional("AI_ANALYZE_COOLDOWN_SECONDS", "60"), 60),
  worker: {
    enabled: toBool(optional("AI_WORKER_ENABLED", "true"), true),
    queueName: optional("AI_BULLMQ_QUEUE_NAME", "ai-evaluation"),
    backfillMs: toInt(optional("AI_BULLMQ_BACKFILL_MS", "30000"), 30_000),
    pollMs: toInt(optional("AI_WORKER_POLL_MS", "3000"), 3_000),
    maxRowsPerTick: Math.min(10, Math.max(1, toInt(optional("AI_WORKER_MAX_ROWS_PER_TICK", optional("AI_MAX_CONCURRENT_JOBS", "2")), 2))),
    maxConcurrentJobs: Math.min(10, Math.max(1, toInt(optional("AI_MAX_CONCURRENT_JOBS", "2"), 2))),
    staleProcessingMinutes: toInt(optional("AI_WORKER_STALE_PROCESSING_MINUTES", "15"), 15),
    maxAttempts: toInt(optional("AI_WORKER_MAX_ATTEMPTS", "3"), 3),
    lockTtlSec: toInt(optional("AI_WORKER_LOCK_TTL_SEC", "120"), 120),
    shutdownGraceMs: toInt(optional("AI_WORKER_SHUTDOWN_GRACE_MS", "30000"), 30_000),
  },
});
