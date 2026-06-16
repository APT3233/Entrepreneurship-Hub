import { aiConfig } from "app/config/ai.js";
import { createAiError, AiErrorCodes } from "./aiErrors.js";
import {
  buildChatCompletionUrl,
  buildModelsUrl,
  buildHeaders,
  getActiveProvider,
  getProvider,
  normalizeProviderKey,
  validateProvider,
  validateProviderForModelList,
} from "./aiProviderManager.js";
import { parseSseChatCompletion } from "./aiStreamParser.js";

const readErrorBody = async (response) => {
  try {
    const text = await response.text();
    return text.slice(0, 500);
  } catch {
    return "";
  }
};

const mapHttpError = async (response, provider) => {
  const body = await readErrorBody(response);
  if (response.status === 401 || response.status === 403) {
    throw createAiError(AiErrorCodes.UNAUTHORIZED, "AI provider rejected the API key.", 502);
  }
  if (response.status === 404) {
    const modelMissing = /model|not\s+found|not\s+loaded|does\s+not\s+exist|pull/i.test(body);
    throw createAiError(
      modelMissing ? AiErrorCodes.MODEL_NOT_FOUND : AiErrorCodes.PROVIDER_UNAVAILABLE,
      modelMissing ? "AI model was not found or is not loaded." : "AI provider endpoint was not found.",
      502,
      body
        ? { provider_key: provider?.key || null, base_url: provider?.baseUrl || null, provider_status: response.status, provider_body: body }
        : { provider_key: provider?.key || null, base_url: provider?.baseUrl || null, provider_status: response.status },
    );
  }
  throw createAiError(
    AiErrorCodes.PROVIDER_ERROR,
    `AI provider returned HTTP ${response.status}.`,
    502,
    body
      ? { provider_key: provider?.key || null, base_url: provider?.baseUrl || null, provider_status: response.status, provider_body: body }
      : { provider_key: provider?.key || null, base_url: provider?.baseUrl || null, provider_status: response.status },
  );
};

const parseNonStreamResponse = async (response) => {
  let json;
  try {
    json = await response.json();
  } catch {
    throw createAiError(AiErrorCodes.INVALID_RESPONSE, "AI provider returned invalid JSON.");
  }
  const content = json?.choices?.[0]?.message?.content ?? json?.choices?.[0]?.delta?.content ?? "";
  if (!String(content).trim()) {
    throw createAiError(AiErrorCodes.EMPTY_RESPONSE, "AI provider returned no content.");
  }
  return String(content);
};

const normalizeRequest = (messagesOrRequest, options = {}) => {
  if (Array.isArray(messagesOrRequest)) return { ...options, messages: messagesOrRequest };
  return { ...(messagesOrRequest || {}) };
};

const buildProviderForRequest = (request) => {
  if (request.providerConfig && typeof request.providerConfig === "object") {
    return { ...request.providerConfig };
  }
  if (request.provider && typeof request.provider === "object") {
    return { ...request.provider };
  }

  const runtimeSettings = request.runtimeSettings || {};
  const providerKey = normalizeProviderKey(request.providerKey || request.provider || runtimeSettings.activeProvider || aiConfig.activeProvider);
  const provider = request.providerKey || request.provider || runtimeSettings.activeProvider
    ? getProvider(providerKey, runtimeSettings)
    : getActiveProvider(runtimeSettings);

  const legacyOverrides = {};
  if (request.baseUrl) legacyOverrides.baseUrl = request.baseUrl;
  if (request.chatCompletionsPath) legacyOverrides.chatCompletionsPath = request.chatCompletionsPath;
  if (request.apiKey !== undefined) legacyOverrides.apiKey = request.apiKey;
  if (request.apiKeyRequired !== undefined) legacyOverrides.apiKeyRequired = request.apiKeyRequired;
  if (request.model) legacyOverrides.model = request.model;
  if (request.stream !== undefined) legacyOverrides.stream = request.stream;

  return { ...provider, ...legacyOverrides, ...(request.providerOverrides || {}) };
};

const providerAttempts = (provider) => {
  const urls = [provider.baseUrl, ...(Array.isArray(provider.fallbackBaseUrls) ? provider.fallbackBaseUrls : [])]
    .map((url) => String(url || "").trim())
    .filter(Boolean);
  const uniqueUrls = [...new Set(urls)];
  return uniqueUrls.map((baseUrl) => ({ ...provider, baseUrl }));
};

const requestChatCompletion = async ({ provider, messages, stream, maxTokens, temperature, responseFormat, signal, onToken }) => {
  const body = {
    model: provider.model,
    messages,
    stream: Boolean(stream),
    max_tokens: Number(maxTokens),
    temperature: Number(temperature),
  };
  if (responseFormat) body.response_format = responseFormat;

  const response = await fetch(buildChatCompletionUrl(provider), {
    method: "POST",
    signal,
    headers: buildHeaders(provider),
    body: JSON.stringify(body),
  });

  if (!response.ok) await mapHttpError(response, provider);

  const contentType = response.headers.get("content-type") || "";
  if (stream && contentType.includes("text/event-stream")) {
    return parseSseChatCompletion(response.body, onToken);
  }
  return parseNonStreamResponse(response);
};

const parseModelsResponse = async (response) => {
  let json;
  try {
    json = await response.json();
  } catch {
    throw createAiError(AiErrorCodes.INVALID_RESPONSE, "AI provider returned invalid models JSON.");
  }
  const items = Array.isArray(json?.data) ? json.data : [];
  return items
    .map((item) => ({
      id: String(item?.id || item?.name || "").trim(),
      object: item?.object || "model",
      owned_by: item?.owned_by || item?.details?.family || null,
      created: item?.created || item?.created_at || null,
    }))
    .filter((item) => item.id)
    .sort((a, b) => a.id.localeCompare(b.id));
};

const requestModels = async ({ provider, signal }) => {
  const response = await fetch(buildModelsUrl(provider), {
    method: "GET",
    signal,
    headers: buildHeaders(provider),
  });
  if (!response.ok) await mapHttpError(response, provider);
  return parseModelsResponse(response);
};

export const listModels = async (request = {}) => {
  const runtimeSettings = request.runtimeSettings || {};
  const provider = validateProviderForModelList(buildProviderForRequest(request));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(request.timeoutMs || runtimeSettings.timeoutMs || aiConfig.timeoutMs) || 120_000);
  const attemptedBaseUrls = [];
  let lastNetworkError = null;

  try {
    for (const attemptProvider of providerAttempts(provider)) {
      attemptedBaseUrls.push(attemptProvider.baseUrl);
      try {
        return await requestModels({ provider: attemptProvider, signal: controller.signal });
      } catch (err) {
        if (err?.name === "AbortError") throw err;
        if (err?.isOperational) throw err;
        lastNetworkError = err;
      }
    }
    throw lastNetworkError || new Error("fetch failed");
  } catch (err) {
    if (err?.name === "AbortError") {
      throw createAiError(AiErrorCodes.TIMEOUT, "AI provider models request timed out.");
    }
    if (err?.isOperational) throw err;
    throw createAiError(AiErrorCodes.PROVIDER_UNAVAILABLE, "AI provider models endpoint could not be reached.", 502, {
      provider_key: provider.key,
      attempted_base_urls: attemptedBaseUrls,
      reason: String(err?.message || err).slice(0, 200),
    });
  } finally {
    clearTimeout(timeout);
  }
};

export const chatCompletion = async (messagesOrRequest, options = {}) => {
  const request = normalizeRequest(messagesOrRequest, options);
  const runtimeSettings = request.runtimeSettings || {};
  const enabled = request.enabled ?? runtimeSettings.enabled ?? aiConfig.enabled;
  if (!enabled) throw createAiError(AiErrorCodes.DISABLED, "AI assistant is disabled.", 400);
  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    throw createAiError(AiErrorCodes.INVALID_RESPONSE, "AI messages are required.", 400);
  }

  const provider = validateProvider(buildProviderForRequest(request));
  const stream = request.stream ?? provider.stream ?? runtimeSettings.defaultStream ?? aiConfig.defaultStream;
  const maxTokens = request.maxTokens ?? runtimeSettings.defaultMaxTokens ?? aiConfig.defaultMaxTokens;
  const temperature = request.temperature ?? runtimeSettings.defaultTemperature ?? aiConfig.defaultTemperature;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(request.timeoutMs || runtimeSettings.timeoutMs || aiConfig.timeoutMs) || 120_000);
  const attemptedBaseUrls = [];
  let lastNetworkError = null;

  try {
    for (const attemptProvider of providerAttempts(provider)) {
      attemptedBaseUrls.push(attemptProvider.baseUrl);
      try {
        return await requestChatCompletion({
          provider: attemptProvider,
          messages: request.messages,
          stream,
          maxTokens,
          temperature,
          responseFormat: request.responseFormat,
          signal: controller.signal,
          onToken: request.onToken,
        });
      } catch (err) {
        if (err?.name === "AbortError") throw err;
        if (err?.isOperational) throw err;
        lastNetworkError = err;
      }
    }
    throw lastNetworkError || new Error("fetch failed");
  } catch (err) {
    if (err?.name === "AbortError") {
      throw createAiError(AiErrorCodes.TIMEOUT, "AI provider request timed out.");
    }
    if (err?.isOperational) throw err;
    throw createAiError(AiErrorCodes.PROVIDER_UNAVAILABLE, "AI provider could not be reached.", 502, {
      provider_key: provider.key,
      attempted_base_urls: attemptedBaseUrls,
      reason: String(err?.message || err).slice(0, 200),
    });
  } finally {
    clearTimeout(timeout);
  }
};
