import { aiConfig } from "app/config/ai.js";
import { AiErrorCodes, createAiError } from "./aiErrors.js";

export const normalizeProviderKey = (value) => {
  const key = String(value || "").trim();
  if (["cmd-local", "cmd-local-api", "cmd-api", "external-api", "openai-compatible"].includes(key)) return "third-party-api";
  return key || "third-party-api";
};

const mergeProvider = (providerKey, runtimeSettings = {}) => {
  const key = normalizeProviderKey(providerKey);
  const baseProvider = aiConfig.providers?.[key];
  const runtimeProvider = runtimeSettings.providers?.[key] || null;
  if (!baseProvider && !runtimeProvider) return null;
  return {
    ...(baseProvider || {}),
    ...(runtimeProvider || {}),
    key,
    chatCompletionsPath: runtimeProvider?.chatCompletionsPath || baseProvider?.chatCompletionsPath || "/chat/completions",
  };
};

export const getProvider = (providerKey, runtimeSettings = {}) => {
  const key = normalizeProviderKey(providerKey);
  const provider = mergeProvider(key, runtimeSettings);
  if (!provider) {
    throw createAiError(AiErrorCodes.PROVIDER_NOT_FOUND, `AI provider '${key}' is not configured.`, 400);
  }
  return provider;
};

export const getActiveProvider = (runtimeSettings = {}) => {
  const key = normalizeProviderKey(runtimeSettings.activeProvider || aiConfig.activeProvider);
  return getProvider(key, runtimeSettings);
};

export const validateProvider = (provider) => {
  if (!provider) {
    throw createAiError(AiErrorCodes.PROVIDER_NOT_FOUND, "AI provider is not configured.", 400);
  }
  if (provider.enabled === false) {
    throw createAiError(AiErrorCodes.PROVIDER_DISABLED, `AI provider '${provider.key}' is disabled.`, 400);
  }
  if (!String(provider.baseUrl || "").trim()) {
    throw createAiError(AiErrorCodes.INVALID_RESPONSE, `AI provider '${provider.key}' is missing base URL.`, 400);
  }
  if (!String(provider.model || "").trim()) {
    throw createAiError(AiErrorCodes.INVALID_RESPONSE, `AI provider '${provider.key}' is missing model name.`, 400);
  }
  if (provider.apiKeyRequired && !String(provider.apiKey || "").trim()) {
    throw createAiError(AiErrorCodes.API_KEY_MISSING, `AI provider '${provider.key}' requires an API key.`, 400);
  }
  return provider;
};

export const buildChatCompletionUrl = (provider) => {
  const base = String(provider.baseUrl || "").replace(/\/+$/, "");
  const path = String(provider.chatCompletionsPath || "/chat/completions");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
};

export const buildModelsUrl = (provider) => {
  const base = String(provider.baseUrl || "").replace(/\/+$/, "");
  return `${base}/models`;
};

export const buildHeaders = (provider) => {
  const headers = { "Content-Type": "application/json" };
  const apiKey = String(provider.apiKey || "").trim();
  if (provider.apiKeyRequired || apiKey) {
    headers.Authorization = `Bearer ${apiKey || "local-dummy-key"}`;
  }
  return headers;
};

export const getProviderPublicConfig = (provider) => {
  const apiKeyRequired = Boolean(provider.apiKeyRequired);
  const apiKeyConfigured = provider.apiKeyStatus?.configured ?? Boolean(String(provider.apiKey || "").trim());
  return {
    key: provider.key,
    name: provider.name,
    type: provider.type,
    enabled: provider.enabled !== false,
    base_url: provider.baseUrl,
    model: provider.model,
    stream: Boolean(provider.stream),
    api_key_required: apiKeyRequired,
    api_key_status: apiKeyRequired ? (apiKeyConfigured ? "configured" : "not_configured") : "not_required",
    api_key_source: provider.apiKeyStatus?.source || provider.apiKeySource || (apiKeyConfigured ? "env" : "none"),
  };
};
