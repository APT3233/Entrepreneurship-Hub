import { aiConfig } from "app/config/ai.js";
import { BadRequest, NotFound } from "app/core/errors/errorFactory.js";
import { AiErrorCodes, createAiError, publicAiError } from "app/core/ai/aiErrors.js";
import { chatCompletion, listModels } from "app/core/ai/aiClient.js";
import { normalizeAiSuggestionJson } from "app/core/ai/aiJsonExtractor.js";
import { getProvider, getProviderPublicConfig, normalizeProviderKey, validateProvider } from "app/core/ai/aiProviderManager.js";
import { logger } from "app/core/logger/index.js";
import { canEncryptSecrets, decryptSecret, encryptSecret } from "app/core/security/secretCipher.js";
import { parsePagination } from "app/core/utils/pagination.js";
import { buildAiEvaluationPrompt } from "./aiEvaluation.prompt.js";
import { extractSourceAttachmentText, extractSubmissionText } from "./aiEvaluation.extractor.js";
import { assertCanAccessAiSuggestion, assertCanConfigureAi } from "./aiEvaluation.permission.js";

const AI_SETTING_DEFINITIONS = {
  ai_enabled: { data_type: "boolean", default_value: aiConfig.enabled, description: "Bật AI Evaluation Assistant" },
  ai_active_provider: { data_type: "string", default_value: aiConfig.activeProvider, description: "AI provider đang sử dụng" },
  ai_provider: { data_type: "string", default_value: aiConfig.activeProvider, description: "Legacy AI provider đang sử dụng" },
  base_url: { data_type: "string", default_value: aiConfig.providers["cmd-api"].baseUrl, description: "Legacy CMD provider base URL" },
  model_name: { data_type: "string", default_value: aiConfig.providers["cmd-api"].model, description: "Legacy CMD model dùng cho AI evaluation" },
  max_tokens: { data_type: "integer", default_value: aiConfig.defaultMaxTokens, description: "Số token tối đa AI có thể trả về" },
  temperature: { data_type: "string", default_value: aiConfig.defaultTemperature, description: "Độ sáng tạo của model" },
  stream: { data_type: "boolean", default_value: aiConfig.defaultStream, description: "Gọi provider ở chế độ streaming mặc định" },
  allow_ai_score_suggestion: { data_type: "boolean", default_value: true, description: "Cho phép AI gợi ý điểm tham khảo" },
  allow_ai_feedback_suggestion: { data_type: "boolean", default_value: true, description: "Cho phép AI gợi ý feedback" },
  allow_student_view_ai_feedback: { data_type: "boolean", default_value: false, description: "Không cho sinh viên xem AI suggestion mặc định" },
  data_retention_days: { data_type: "integer", default_value: 180, description: "Số ngày giữ dữ liệu AI suggestion" },
  provider_cmd_api_enabled: { data_type: "boolean", default_value: aiConfig.providers["cmd-api"].enabled, description: "Bật provider CMD API" },
  provider_cmd_api_base_url: { data_type: "string", default_value: aiConfig.providers["cmd-api"].baseUrl, description: "CMD API base URL" },
  provider_cmd_api_model: { data_type: "string", default_value: aiConfig.providers["cmd-api"].model, description: "CMD API model" },
  provider_cmd_api_stream: { data_type: "boolean", default_value: aiConfig.providers["cmd-api"].stream, description: "CMD API stream mode" },
  provider_local_gemma_enabled: { data_type: "boolean", default_value: aiConfig.providers["local-gemma"].enabled, description: "Bật provider Local Gemma" },
  provider_local_gemma_base_url: { data_type: "string", default_value: aiConfig.providers["local-gemma"].baseUrl, description: "Local Gemma/Ollama base URL" },
  provider_local_gemma_model: { data_type: "string", default_value: aiConfig.providers["local-gemma"].model, description: "Local Gemma/Ollama model" },
  provider_local_gemma_stream: { data_type: "boolean", default_value: aiConfig.providers["local-gemma"].stream, description: "Local Gemma stream mode" },
  provider_local_gemma_api_key_required: { data_type: "boolean", default_value: aiConfig.providers["local-gemma"].apiKeyRequired, description: "Local Gemma có bắt buộc API key không" },
};

const AI_API_KEY_SETTING_KEY = "cmd_api_key_encrypted";
const MASKED_API_KEY = "********";
const PROVIDER_KEYS = Object.freeze(["cmd-api", "local-gemma"]);

const parseBoolean = (value) => value === true || value === "true" || value === "1" || value === 1;
const parseJson = (value, fallback = []) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return value;
  try {
    return JSON.parse(value || "null") ?? fallback;
  } catch {
    return fallback;
  }
};
const parseSettingValue = (setting) => {
  if (!setting) return null;
  if (setting.data_type === "boolean") return parseBoolean(setting.setting_value);
  if (setting.data_type === "integer") return Number(setting.setting_value || 0);
  if (setting.data_type === "json") return parseJson(setting.setting_value, null);
  if (setting.setting_key === "temperature") return Number(setting.setting_value);
  return setting.setting_value;
};
const serializeSettingValue = (key, value) => {
  const def = AI_SETTING_DEFINITIONS[key];
  if (!def) throw BadRequest(`Cấu hình AI ${key} không được hỗ trợ.`);
  if (key === "allow_student_view_ai_feedback" && parseBoolean(value)) {
    throw BadRequest("Sinh viên không được xem AI suggestion trong giai đoạn này.");
  }
  if (key === "ai_active_provider" || key === "ai_provider") {
    const providerKey = normalizeProviderKey(value);
    if (!PROVIDER_KEYS.includes(providerKey)) throw BadRequest("AI provider không được hỗ trợ.");
    return providerKey;
  }
  if (def.data_type === "boolean") return parseBoolean(value) ? "true" : "false";
  if (def.data_type === "integer") {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 0) throw BadRequest(`${key} phải là số nguyên không âm.`);
    return String(number);
  }
  if (key === "temperature") {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > 2) throw BadRequest("temperature phải nằm trong khoảng 0-2.");
    return String(number);
  }
  return String(value ?? "");
};
const providerSettingName = (providerKey, suffix) => `provider_${normalizeProviderKey(providerKey).replace(/-/g, "_")}_${suffix}`;
const readSetting = (byKey, key, fallback) => (byKey.has(key) ? parseSettingValue(byKey.get(key)) : fallback);
const resolveActiveProviderKey = (byKey) => normalizeProviderKey(
  readSetting(byKey, "ai_active_provider", readSetting(byKey, "ai_provider", aiConfig.activeProvider)),
);
const getApiKeyStatus = (byKey) => {
  const encryptedValue = String(byKey.get(AI_API_KEY_SETTING_KEY)?.setting_value || "").trim();
  const envConfigured = Boolean(aiConfig.providers["cmd-api"].apiKey);
  const databaseConfigured = Boolean(encryptedValue);
  const configured = envConfigured || databaseConfigured;
  return {
    configured,
    source: envConfigured ? "env" : databaseConfigured ? "database" : "none",
    masked: configured ? MASKED_API_KEY : "",
    envConfigured,
    databaseConfigured,
    storageReady: canEncryptSecrets(aiConfig.secretEncryptionKey),
  };
};
const resolveRuntimeApiKey = (byKey, status = getApiKeyStatus(byKey)) => {
  if (aiConfig.providers["cmd-api"].apiKey) return aiConfig.providers["cmd-api"].apiKey;

  const encryptedValue = String(byKey.get(AI_API_KEY_SETTING_KEY)?.setting_value || "").trim();
  if (!encryptedValue) return "";
  if (!status.storageReady) {
    throw createAiError(
      AiErrorCodes.MISSING_SECRET_ENCRYPTION_KEY,
      "AI API key is stored in database but AI_SECRET_ENCRYPTION_KEY is missing.",
      500,
    );
  }

  try {
    const decrypted = decryptSecret(encryptedValue, aiConfig.secretEncryptionKey).trim();
    if (!decrypted) throw new Error("empty_decrypted_secret");
    return decrypted;
  } catch {
    throw createAiError(
      AiErrorCodes.SECRET_DECRYPTION_FAILED,
      "Stored AI API key could not be decrypted.",
      500,
    );
  }
};
const pageArgs = (query) => parsePagination({ page: query.page, limit: query.limit });
const isRetryableAiError = (err) => [
  AiErrorCodes.TIMEOUT,
  AiErrorCodes.NETWORK_ERROR,
  AiErrorCodes.PROVIDER_UNAVAILABLE,
  AiErrorCodes.PROVIDER_ERROR,
].includes(err?.aiCode || err?.errorCode);

const sourceAttachmentMaxChars = (maxChars) => Math.min(20_000, Math.max(8_000, Math.floor((Number(maxChars) || 60_000) / 3)));

const aiJsonResponseFormat = (provider) => (provider?.key === "local-gemma" ? { type: "json_object" } : null);

const buildJsonRepairMessages = ({ originalMessages, rawText, rubric }) => [
  {
    role: "system",
    content: [
      "Bạn sửa output AI Evaluation Assistant thành đúng một JSON object hợp lệ.",
      "Không markdown, không giải thích, không thêm văn bản ngoài JSON.",
      "Giữ đúng criterion_id trong rubric. Nếu không đủ căn cứ thì suggested_score = null.",
    ].join(" "),
  },
  ...originalMessages,
  {
    role: "assistant",
    content: String(rawText || "").slice(0, 8000),
  },
  {
    role: "user",
    content: JSON.stringify({
      repair_task: "Previous assistant response was invalid JSON. Re-evaluate from INPUT_JSON and return only valid JSON matching this schema.",
      valid_criterion_ids: (rubric.criteria || []).map((criterion) => Number(criterion.id)),
      schema: {
        summary: "string",
        strengths: ["string"],
        weaknesses: ["string"],
        missing_requirements: ["string"],
        criterion_suggestions: [
          {
            criterion_id: 1,
            suggested_score: null,
            suggested_feedback: "string",
            evidence_text: null,
            confidence_score: 0.5,
          },
        ],
        suggested_overall_feedback: "string",
        suggested_total_score: null,
        confidence_score: 0.5,
        project_potential_level: "low | medium | high | unknown",
        project_potential_reasons: ["string"],
        project_potential_next_steps: ["string"],
        project_potential_confidence_score: 0.5,
      },
    }),
  },
];

const logDebugPrompt = ({ config, job, context, messages }) => {
  if (!config.debugRawResponse) return;
  const promptText = messages.map((message) => `${message.role}: ${message.content}`).join("\n\n");
  const maxChars = Number(config.debugPromptMaxChars) || 12_000;
  logger.debug("[AiEvaluation] prompt sent to AI provider", {
    jobId: Number(job.id),
    targetType: job.target_type,
    targetId: Number(job.target_id),
    sourceId: context.source_id == null ? null : Number(context.source_id),
    providerKey: config.providerKey || config.activeProvider || null,
    model: config.model,
    promptLength: promptText.length,
    promptTruncatedInLog: promptText.length > maxChars,
    prompt: promptText.length > maxChars ? promptText.slice(0, maxChars) : promptText,
  });
};

export const createAiEvaluationService = ({ aiEvaluationRepository, storageService, transaction, auditService }) => {
  const buildRuntimeProvider = (providerKey, byKey, { skipApiKeyResolve = false } = {}) => {
    const key = normalizeProviderKey(providerKey);
    const base = aiConfig.providers[key];
    if (!base) return null;
    const isCmd = key === "cmd-api";
    const apiKeyStatus = isCmd ? getApiKeyStatus(byKey) : {
      configured: Boolean(base.apiKey),
      source: base.apiKey ? "env" : "none",
    };
    const provider = {
      ...base,
      enabled: readSetting(byKey, providerSettingName(key, "enabled"), base.enabled),
      baseUrl: readSetting(byKey, providerSettingName(key, "base_url"), isCmd ? readSetting(byKey, "base_url", base.baseUrl) : base.baseUrl),
      model: readSetting(byKey, providerSettingName(key, "model"), isCmd ? readSetting(byKey, "model_name", base.model) : base.model),
      stream: readSetting(byKey, providerSettingName(key, "stream"), base.stream),
      apiKeyRequired: readSetting(byKey, providerSettingName(key, "api_key_required"), base.apiKeyRequired),
      apiKey: isCmd ? (skipApiKeyResolve ? "" : resolveRuntimeApiKey(byKey, apiKeyStatus)) : base.apiKey,
      apiKeySource: apiKeyStatus.source,
      apiKeyStatus,
    };
    return provider;
  };

  const getRuntimeConfig = async ({ skipApiKeyResolve = false } = {}) => {
    const rows = await aiEvaluationRepository.listAiSettings();
    const byKey = new Map(rows.map((row) => [row.setting_key, row]));
    const activeProvider = resolveActiveProviderKey(byKey);
    const providers = Object.fromEntries(
      PROVIDER_KEYS.map((providerKey) => [providerKey, buildRuntimeProvider(providerKey, byKey, { skipApiKeyResolve })]),
    );
    const active = providers[activeProvider] || providers[aiConfig.activeProvider];
    return {
      enabled: readSetting(byKey, "ai_enabled", aiConfig.enabled),
      activeProvider,
      provider: activeProvider,
      providerKey: active?.key || activeProvider,
      providers,
      model: active?.model || aiConfig.model,
      stream: readSetting(byKey, "stream", aiConfig.defaultStream),
      defaultStream: readSetting(byKey, "stream", aiConfig.defaultStream),
      maxTokens: readSetting(byKey, "max_tokens", aiConfig.defaultMaxTokens),
      defaultMaxTokens: readSetting(byKey, "max_tokens", aiConfig.defaultMaxTokens),
      temperature: readSetting(byKey, "temperature", aiConfig.defaultTemperature),
      defaultTemperature: readSetting(byKey, "temperature", aiConfig.defaultTemperature),
      timeoutMs: aiConfig.timeoutMs,
      debugRawResponse: aiConfig.debugRawResponse,
      debugPromptMaxChars: aiConfig.debugPromptMaxChars,
      inputMaxChars: aiConfig.inputMaxChars,
      allowAiScoreSuggestion: readSetting(byKey, "allow_ai_score_suggestion", true),
      allowAiFeedbackSuggestion: readSetting(byKey, "allow_ai_feedback_suggestion", true),
      allowStudentViewAiFeedback: readSetting(byKey, "allow_student_view_ai_feedback", false),
      dataRetentionDays: readSetting(byKey, "data_retention_days", 180),
    };
  };

  const assertAiReady = (config, providerKey = null) => {
    if (!config.enabled) throw createAiError(AiErrorCodes.DISABLED, "AI assistant is disabled.", 400);
    const provider = getProvider(providerKey || config.activeProvider, config);
    return validateProvider(provider);
  };

  const requestAiEvaluationJson = async ({ provider, config, messages, rubric, job, context }) => {
    const request = {
      providerKey: provider.key,
      messages,
      runtimeSettings: config,
      model: provider.model,
      stream: provider.key === "local-gemma" ? false : provider.stream,
      maxTokens: config.defaultMaxTokens,
      temperature: config.defaultTemperature,
      timeoutMs: config.timeoutMs,
      responseFormat: aiJsonResponseFormat(provider),
    };

    const rawText = await chatCompletion(request);
    try {
      return { rawText, normalized: normalizeAiSuggestionJson(rawText, rubric.criteria || []), repaired: false };
    } catch (err) {
      if ((err?.aiCode || err?.errorCode) !== AiErrorCodes.INVALID_JSON) throw err;
      logger.warn("[AiEvaluation] invalid AI JSON; retrying JSON repair", {
        jobId: Number(job.id),
        targetType: job.target_type,
        targetId: Number(job.target_id),
        providerKey: provider.key,
        model: provider.model,
        rawLength: String(rawText || "").length,
      });
      const repairRawText = await chatCompletion({
        ...request,
        messages: buildJsonRepairMessages({ originalMessages: messages, rawText, rubric }),
        temperature: 0,
      });
      const normalized = normalizeAiSuggestionJson(repairRawText, rubric.criteria || []);
      await auditService.log({
        userId: job.requested_by || null,
        action: "ai_evaluation_json_repaired",
        tableName: "ai_analysis_jobs",
        recordId: job.id,
        title: context.source_title,
        newValues: { provider_key: provider.key, model: provider.model, first_response_length: String(rawText || "").length },
      });
      return { rawText: repairRawText, normalized, repaired: true };
    }
  };

  const formatSuggestion = async (suggestion) => {
    if (!suggestion) return null;
    const criteria = await aiEvaluationRepository.listCriterionSuggestions(suggestion.id);
    return {
      ...suggestion,
      id: Number(suggestion.id),
      job_id: Number(suggestion.job_id),
      target_id: Number(suggestion.target_id),
      rubric_id: Number(suggestion.rubric_id),
      strengths: parseJson(suggestion.strengths, []),
      weaknesses: parseJson(suggestion.weaknesses, []),
      missing_requirements: parseJson(suggestion.missing_requirements, []),
      project_potential_reasons: parseJson(suggestion.project_potential_reasons, []),
      project_potential_next_steps: parseJson(suggestion.project_potential_next_steps, []),
      suggested_total_score: suggestion.suggested_total_score == null ? null : Number(suggestion.suggested_total_score),
      confidence_score: suggestion.confidence_score == null ? null : Number(suggestion.confidence_score),
      project_potential_confidence_score: suggestion.project_potential_confidence_score == null ? null : Number(suggestion.project_potential_confidence_score),
      criterion_suggestions: criteria.map((criterion) => ({
        ...criterion,
        id: Number(criterion.id),
        criterion_id: Number(criterion.criterion_id),
        suggested_score: criterion.suggested_score == null ? null : Number(criterion.suggested_score),
        confidence_score: criterion.confidence_score == null ? null : Number(criterion.confidence_score),
        max_score: criterion.max_score == null ? null : Number(criterion.max_score),
      })),
    };
  };

  const getContextForTarget = async (targetType, targetId, actor = null) => {
    const context = await aiEvaluationRepository.findSubmissionContext(targetType, targetId);
    if (!context) throw NotFound("Submission");
    if (actor) assertCanAccessAiSuggestion(context, actor);
    return { ...context, target_type: targetType, target_id: Number(targetId) };
  };

  const analyze = async (body, actor, auditMeta = {}) => {
    const targetType = body.target_type;
    const targetId = Number(body.target_id);
    const context = await getContextForTarget(targetType, targetId, actor);
    if (!context.rubric_id) throw BadRequest("Submission này chưa được bind rubric.");
    const config = await getRuntimeConfig();
    const provider = assertAiReady(config);

    if (!body.force_refresh) {
      const latest = await aiEvaluationRepository.findLatestCompletedSuggestionByTarget(targetType, targetId);
      if (latest) return { statusCode: 200, data: { job: null, suggestion: await formatSuggestion(latest), reused: true } };
      const active = await aiEvaluationRepository.findActiveJobByTarget(targetType, targetId);
      if (active) return { statusCode: 202, data: { job: active, suggestion: null, reused: true } };
    }

    const jobId = await aiEvaluationRepository.createJob({
      target_type: targetType,
      target_id: targetId,
      requested_by: actor.id,
      provider_key: provider.key,
      model_name: provider.model,
    });
    const job = await aiEvaluationRepository.findJobById(jobId);
    await auditService.log({
      userId: actor?.id || null,
      action: "ai_evaluation_analyze_requested",
      tableName: "ai_analysis_jobs",
      recordId: jobId,
      title: context.source_title,
      newValues: {
        target_type: targetType,
        target_id: targetId,
        provider_key: provider.key,
        model: provider.model,
        force_refresh: Boolean(body.force_refresh),
      },
      ipAddress: auditMeta.ipAddress || null,
      userAgent: auditMeta.userAgent || null,
    });
    return { statusCode: 202, data: { job, suggestion: null, reused: false } };
  };

  const getJob = async (id, actor) => {
    const job = await aiEvaluationRepository.findJobById(id);
    if (!job) throw NotFound("AI analysis job");
    await getContextForTarget(job.target_type, job.target_id, actor);
    const suggestion = job.status === "completed"
      ? await aiEvaluationRepository.findLatestCompletedSuggestionByTarget(job.target_type, job.target_id)
      : null;
    return { job, suggestion: suggestion ? await formatSuggestion(suggestion) : null };
  };

  const getLatestSuggestion = async (targetType, targetId, actor) => {
    await getContextForTarget(targetType, targetId, actor);
    const suggestion = await aiEvaluationRepository.findLatestCompletedSuggestionByTarget(targetType, targetId);
    return suggestion ? formatSuggestion(suggestion) : null;
  };

  const recordAction = async (id, body, actor, auditMeta = {}) => {
    const suggestion = await aiEvaluationRepository.findSuggestionById(id);
    if (!suggestion) throw NotFound("AI suggestion");
    await getContextForTarget(suggestion.target_type, suggestion.target_id, actor);
    const actionId = await aiEvaluationRepository.createAction({
      ai_suggestion_id: id,
      user_id: actor.id,
      action: body.action,
      field_name: body.field_name || null,
    });
    await auditService.log({
      userId: actor?.id || null,
      action: "ai_suggestion_action",
      tableName: "ai_suggestion_actions",
      recordId: actionId,
      title: body.action,
      newValues: { ai_suggestion_id: Number(id), action: body.action, field_name: body.field_name || null },
      ipAddress: auditMeta.ipAddress || null,
      userAgent: auditMeta.userAgent || null,
    });
    return { id: actionId, logged: true };
  };

  const processJob = async (job) => {
    const config = await getRuntimeConfig();
    const provider = assertAiReady(config, job.provider_key || config.activeProvider);
    const runConfig = { ...config, providerKey: provider.key, model: provider.model };
    const context = await getContextForTarget(job.target_type, job.target_id);
    if (!context.rubric_id) throw BadRequest("Submission này chưa được bind rubric.");
    const rubric = await aiEvaluationRepository.findRubricDetailById(context.rubric_id);
    if (!rubric) throw NotFound("Rubric");
    const files = await aiEvaluationRepository.listSubmissionFiles(job.target_type, job.target_id);
    const sourceMaterials = await extractSourceAttachmentText({
      attachmentUrl: context.source_attachment_url,
      storageService,
      maxChars: sourceAttachmentMaxChars(config.inputMaxChars),
    });
    const extracted = await extractSubmissionText({ files, storageService, maxChars: config.inputMaxChars });
    const messages = buildAiEvaluationPrompt({ context, rubric, extracted, sourceMaterials });
    logDebugPrompt({ config: runConfig, job, context, messages });
    const { rawText, normalized, repaired } = await requestAiEvaluationJson({ provider, config, messages, rubric, job, context });
    if (
      normalized.data.suggested_total_score !== null &&
      normalized.data.suggested_total_score > Number(rubric.total_score)
    ) {
      normalized.data.suggested_total_score = null;
    }

    const suggestionId = await transaction.run(async (conn) => {
      const id = await aiEvaluationRepository.createSuggestion({
        job_id: Number(job.id),
        target_type: job.target_type,
        target_id: Number(job.target_id),
        rubric_id: Number(context.rubric_id),
        ...normalized.data,
        suggested_total_score: config.allowAiScoreSuggestion ? normalized.data.suggested_total_score : null,
        suggested_overall_feedback: config.allowAiFeedbackSuggestion
          ? normalized.data.suggested_overall_feedback
          : "AI feedback suggestion is disabled by admin settings.",
        model_name: provider.model,
        provider_key: provider.key,
        raw_response: config.debugRawResponse ? rawText : null,
      }, conn);
      for (const criterion of normalized.data.criterion_suggestions) {
        await aiEvaluationRepository.createCriterionSuggestion({
          ai_suggestion_id: id,
          criterion_id: criterion.criterion_id,
          suggested_score: config.allowAiScoreSuggestion ? criterion.suggested_score : null,
          suggested_feedback: config.allowAiFeedbackSuggestion ? criterion.suggested_feedback : "AI feedback suggestion is disabled by admin settings.",
          evidence_text: criterion.evidence_text,
          confidence_score: criterion.confidence_score,
        }, conn);
      }
      await aiEvaluationRepository.markJobCompleted(job.id, conn);
      return id;
    });

    if (normalized.warnings.length) {
      await auditService.log({
        userId: job.requested_by || null,
        action: "ai_evaluation_warnings",
        tableName: "ai_evaluation_suggestions",
        recordId: suggestionId,
        title: context.source_title,
        newValues: { warnings: normalized.warnings },
      });
    }
    await auditService.log({
      userId: job.requested_by || null,
      action: "ai_evaluation_completed",
      tableName: "ai_analysis_jobs",
      recordId: job.id,
      title: context.source_title,
      newValues: { suggestion_id: suggestionId, provider_key: provider.key, model: provider.model, repaired_json: repaired },
    });
    return suggestionId;
  };

  const handleJobFailure = async (job, err) => {
    const maxAttempts = aiConfig.worker.maxAttempts;
    const retry = isRetryableAiError(err) && Number(job.attempts || 0) < maxAttempts;
    const publicError = publicAiError(err);
    await aiEvaluationRepository.markJobFailed(job.id, `${publicError.code}: ${publicError.message}`, retry);
    if (!retry) {
      await auditService.log({
        userId: job.requested_by || null,
        action: "ai_evaluation_failed",
        tableName: "ai_analysis_jobs",
        recordId: job.id,
        newValues: publicError,
      });
    }
  };

  const listAdminSuggestions = async (query) => {
    const pagination = pageArgs(query);
    const result = await aiEvaluationRepository.listAdminSuggestions({
      classId: query.class_id || null,
      lecturerId: query.lecturer_id || null,
      status: query.status || null,
      model: query.model || null,
      providerKey: query.provider_key || null,
      dateFrom: query.date_from || null,
      dateTo: query.date_to || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getAiSettings = async (actor) => {
    assertCanConfigureAi(actor);
    const config = await getRuntimeConfig({ skipApiKeyResolve: true });
    const cmdStatus = config.providers["cmd-api"]?.apiKeyStatus || { configured: false, source: "none" };
    return {
      enabled: Boolean(config.enabled),
      active_provider: config.activeProvider,
      global: {
        max_tokens: Number(config.defaultMaxTokens),
        temperature: Number(config.defaultTemperature),
        stream: Boolean(config.defaultStream),
        allow_ai_score_suggestion: Boolean(config.allowAiScoreSuggestion),
        allow_ai_feedback_suggestion: Boolean(config.allowAiFeedbackSuggestion),
        allow_student_view_ai_feedback: false,
        data_retention_days: Number(config.dataRetentionDays),
      },
      providers: PROVIDER_KEYS.map((providerKey) => ({
        ...getProviderPublicConfig(config.providers[providerKey]),
        health_status: "unknown",
        model_status: "unknown",
      })),
      secret_storage: {
        cmd_api_key_configured: Boolean(cmdStatus.configured),
        cmd_api_key_source: cmdStatus.source || "none",
        cmd_api_key_masked: cmdStatus.configured ? MASKED_API_KEY : "",
        cmd_api_key_env_configured: Boolean(cmdStatus.envConfigured),
        cmd_api_key_database_configured: Boolean(cmdStatus.databaseConfigured),
        storage_ready: canEncryptSecrets(aiConfig.secretEncryptionKey),
      },
    };
  };

  const getProviderForTest = async (body = {}) => {
    const requestApiKey = String(body.api_key || "").trim();
    const runtime = await getRuntimeConfig({ skipApiKeyResolve: Boolean(requestApiKey) });
    const providerKey = normalizeProviderKey(body.provider_key || body.active_provider || body.ai_provider || runtime.activeProvider);
    const current = getProvider(providerKey, runtime);
    const override = {
      ...(body.base_url ? { baseUrl: body.base_url } : {}),
      ...(body.model_name ? { model: body.model_name } : {}),
      ...(body.model ? { model: body.model } : {}),
      ...(body.stream !== undefined ? { stream: parseBoolean(body.stream) } : {}),
      ...(body.api_key_required !== undefined ? { apiKeyRequired: parseBoolean(body.api_key_required) } : {}),
      ...(requestApiKey ? { apiKey: requestApiKey, apiKeySource: "request" } : {}),
    };
    const nextProvider = validateProvider({ ...current, ...override });
    return {
      runtime: {
        ...runtime,
        enabled: true,
        activeProvider: providerKey,
        providers: { ...runtime.providers, [providerKey]: nextProvider },
      },
      provider: nextProvider,
      usedRequestApiKey: Boolean(requestApiKey),
    };
  };

  const testConnection = async (body = {}, actor, auditMeta = {}) => {
    assertCanConfigureAi(actor);
    const { runtime, provider, usedRequestApiKey } = await getProviderForTest(body);
    const startedAt = Date.now();
    await chatCompletion({
      providerKey: provider.key,
      runtimeSettings: runtime,
      messages: [{ role: "user", content: "Reply with OK only." }],
      maxTokens: 32,
      temperature: 0,
      stream: false,
      timeoutMs: Math.min(120_000, Number(runtime.timeoutMs) || 120_000),
    });

    await auditService.log({
      userId: actor?.id || null,
      action: "admin_test_ai_provider",
      tableName: "system_settings",
      recordId: null,
      newValues: {
        provider_key: provider.key,
        base_url: provider.baseUrl,
        model: provider.model,
        api_key_source: provider.apiKeySource || "none",
        used_request_api_key: usedRequestApiKey,
      },
      ipAddress: auditMeta.ipAddress || null,
      userAgent: auditMeta.userAgent || null,
    });

    return {
      provider_key: provider.key,
      status: "online",
      model: provider.model,
      latency_ms: Date.now() - startedAt,
      message: "Provider is reachable",
    };
  };

  const listProviderModels = async (body = {}, actor, auditMeta = {}) => {
    assertCanConfigureAi(actor);
    const { runtime, provider } = await getProviderForTest(body);
    const startedAt = Date.now();
    const models = await listModels({
      providerKey: provider.key,
      runtimeSettings: runtime,
      timeoutMs: Math.min(120_000, Number(runtime.timeoutMs) || 120_000),
    });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_list_ai_provider_models",
      tableName: "system_settings",
      recordId: null,
      newValues: { provider_key: provider.key, base_url: provider.baseUrl, model_count: models.length },
      ipAddress: auditMeta.ipAddress || null,
      userAgent: auditMeta.userAgent || null,
    });
    return {
      provider_key: provider.key,
      base_url: provider.baseUrl,
      models,
      latency_ms: Date.now() - startedAt,
    };
  };

  const testPrompt = async (body = {}, actor, auditMeta = {}) => {
    assertCanConfigureAi(actor);
    const prompt = String(body.prompt || "").trim();
    if (!prompt) throw BadRequest("Prompt test không được để trống.");
    const { runtime, provider } = await getProviderForTest(body);
    const startedAt = Date.now();
    const output = await chatCompletion({
      providerKey: provider.key,
      runtimeSettings: runtime,
      messages: [{ role: "user", content: prompt }],
      maxTokens: Math.min(512, Number(body.max_tokens || runtime.defaultMaxTokens) || 512),
      temperature: body.temperature === undefined ? 0 : Number(body.temperature),
      stream: false,
      timeoutMs: Math.min(120_000, Number(runtime.timeoutMs) || 120_000),
    });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_test_ai_prompt",
      tableName: "system_settings",
      recordId: null,
      newValues: { provider_key: provider.key, model: provider.model, prompt_length: prompt.length },
      ipAddress: auditMeta.ipAddress || null,
      userAgent: auditMeta.userAgent || null,
    });
    return { provider_key: provider.key, model: provider.model, output, latency_ms: Date.now() - startedAt };
  };

  const testAiSettings = (body = {}, actor, auditMeta = {}) => testConnection(body, actor, auditMeta);

  const updateAiSettings = async (body, actor, auditMeta = {}) => {
    assertCanConfigureAi(actor);
    const before = await getRuntimeConfig({ skipApiKeyResolve: true });
    const saveSetting = async (settingKey, value) => {
      const def = AI_SETTING_DEFINITIONS[settingKey];
      await aiEvaluationRepository.upsertAiSetting({
        setting_key: settingKey,
        setting_value: serializeSettingValue(settingKey, value),
        data_type: def.data_type,
        description: def.description,
        updated_by: actor?.id || null,
      });
    };

    if (body.enabled !== undefined) await saveSetting("ai_enabled", body.enabled);
    if (body.ai_enabled !== undefined) await saveSetting("ai_enabled", body.ai_enabled);
    if (body.active_provider !== undefined) await saveSetting("ai_active_provider", body.active_provider);
    if (body.ai_active_provider !== undefined) await saveSetting("ai_active_provider", body.ai_active_provider);
    if (body.ai_provider !== undefined) await saveSetting("ai_active_provider", body.ai_provider);
    if (body.max_tokens !== undefined) await saveSetting("max_tokens", body.max_tokens);
    if (body.temperature !== undefined) await saveSetting("temperature", body.temperature);
    if (body.stream !== undefined) await saveSetting("stream", body.stream);
    if (body.allow_ai_score_suggestion !== undefined) await saveSetting("allow_ai_score_suggestion", body.allow_ai_score_suggestion);
    if (body.allow_ai_feedback_suggestion !== undefined) await saveSetting("allow_ai_feedback_suggestion", body.allow_ai_feedback_suggestion);
    if (body.allow_student_view_ai_feedback !== undefined) await saveSetting("allow_student_view_ai_feedback", false);
    if (body.data_retention_days !== undefined) await saveSetting("data_retention_days", body.data_retention_days);

    const providerPayloads = [];
    const addProviderPayload = (payload) => {
      if (!payload) return;
      const key = normalizeProviderKey(payload.key || payload.provider_key);
      if (!PROVIDER_KEYS.includes(key)) throw BadRequest("AI provider không được hỗ trợ.");
      providerPayloads.push({ ...payload, key });
    };
    if (Array.isArray(body.providers)) body.providers.forEach(addProviderPayload);
    else if (body.providers && typeof body.providers === "object") {
      Object.entries(body.providers).forEach(([key, payload]) => addProviderPayload({ ...(payload || {}), key }));
    }
    if (body.base_url !== undefined || body.model_name !== undefined || body.provider_stream !== undefined) {
      addProviderPayload({ key: "cmd-api", base_url: body.base_url, model: body.model_name, stream: body.provider_stream });
    }

    for (const provider of providerPayloads) {
      if (provider.enabled !== undefined) await saveSetting(providerSettingName(provider.key, "enabled"), provider.enabled);
      if (provider.base_url !== undefined) {
        if (!String(provider.base_url || "").trim()) throw BadRequest("Provider base_url không được để trống.");
        await saveSetting(providerSettingName(provider.key, "base_url"), provider.base_url);
      }
      if (provider.model !== undefined) {
        if (!String(provider.model || "").trim()) throw BadRequest("Provider model không được để trống.");
        await saveSetting(providerSettingName(provider.key, "model"), provider.model);
      }
      if (provider.model_name !== undefined) {
        if (!String(provider.model_name || "").trim()) throw BadRequest("Provider model không được để trống.");
        await saveSetting(providerSettingName(provider.key, "model"), provider.model_name);
      }
      if (provider.stream !== undefined) await saveSetting(providerSettingName(provider.key, "stream"), provider.stream);
      if (provider.api_key_required !== undefined && provider.key === "local-gemma") {
        await saveSetting(providerSettingName(provider.key, "api_key_required"), provider.api_key_required);
      }
    }

    const nextApiKey = String(body.api_key || "").trim();
    if (nextApiKey && !canEncryptSecrets(aiConfig.secretEncryptionKey)) {
      throw BadRequest("Thiếu AI_SECRET_ENCRYPTION_KEY hoặc APP_SECRET_ENCRYPTION_KEY để mã hoá API key trong DB.");
    }
    let apiKeyUpdated = false;
    if (nextApiKey) {
      await aiEvaluationRepository.upsertAiSetting({
        setting_key: AI_API_KEY_SETTING_KEY,
        setting_value: encryptSecret(nextApiKey, aiConfig.secretEncryptionKey),
        data_type: "string",
        description: "Encrypted CMD local API key. Env CMD_API_KEY has priority.",
        updated_by: actor?.id || null,
      });
      apiKeyUpdated = true;
    }
    const after = await getRuntimeConfig({ skipApiKeyResolve: true });
    if (before.activeProvider !== after.activeProvider) {
      await auditService.log({
        userId: actor?.id || null,
        action: "admin_switch_ai_provider",
        tableName: "system_settings",
        recordId: null,
        newValues: { from: before.activeProvider, to: after.activeProvider },
        ipAddress: auditMeta.ipAddress || null,
        userAgent: auditMeta.userAgent || null,
      });
    }
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_ai_settings",
      tableName: "system_settings",
      recordId: null,
      newValues: {
        updated_settings: Object.keys(body).filter((key) => key !== "api_key"),
        api_key_updated: apiKeyUpdated,
      },
      ipAddress: auditMeta.ipAddress || null,
      userAgent: auditMeta.userAgent || null,
    });
    return getAiSettings(actor);
  };

  return {
    analyze,
    getJob,
    getLatestSuggestion,
    recordAction,
    processJob,
    handleJobFailure,
    listAdminSuggestions,
    getAiSettings,
    listProviderModels,
    testConnection,
    testPrompt,
    testAiSettings,
    updateAiSettings,
  };
};
