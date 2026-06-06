import Joi from "joi";

const targetType = Joi.string().valid("checkpoint_submission", "assignment_submission");
const providerKey = Joi.string().valid("cmd-api", "local-gemma", "cmd-local");
const providerSettingsSchema = Joi.object({
  key: providerKey.required(),
  enabled: Joi.boolean(),
  base_url: Joi.string().uri({ scheme: [/https?/] }),
  model: Joi.string().max(200),
  model_name: Joi.string().max(200),
  stream: Joi.boolean(),
  api_key_required: Joi.boolean(),
});

export const analyzeAiEvaluationSchema = {
  body: Joi.object({
    target_type: targetType.required(),
    target_id: Joi.number().integer().positive().required(),
    force_refresh: Joi.boolean().default(false),
  }),
};

export const aiJobParamsSchema = {
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
};

export const aiSuggestionTargetSchema = {
  params: Joi.object({
    targetType: targetType.required(),
    targetId: Joi.number().integer().positive().required(),
  }),
};

export const aiSuggestionActionSchema = {
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
  body: Joi.object({
    action: Joi.string().valid("accepted", "edited", "ignored", "copied").required(),
    field_name: Joi.string().max(100).allow("", null).default(null),
  }),
};

export const listAdminAiSuggestionSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    class_id: Joi.number().integer().positive().allow("", null),
    lecturer_id: Joi.number().integer().positive().allow("", null),
    status: Joi.string().valid("", "pending", "processing", "completed", "failed").allow(""),
    model: Joi.string().max(200).allow("", null),
    provider_key: providerKey.allow("", null),
    date_from: Joi.date().iso().allow("", null),
    date_to: Joi.date().iso().allow("", null),
  }),
};

export const updateAiSettingsSchema = {
  body: Joi.object({
    enabled: Joi.boolean(),
    ai_enabled: Joi.boolean(),
    active_provider: providerKey,
    ai_active_provider: providerKey,
    ai_provider: providerKey,
    base_url: Joi.string().uri({ scheme: [/https?/] }),
    model_name: Joi.string().max(200),
    max_tokens: Joi.number().integer().min(256).max(32768),
    temperature: Joi.number().min(0).max(2),
    stream: Joi.boolean(),
    allow_ai_score_suggestion: Joi.boolean(),
    allow_ai_feedback_suggestion: Joi.boolean(),
    allow_student_view_ai_feedback: Joi.boolean().valid(false),
    data_retention_days: Joi.number().integer().min(1).max(3650),
    providers: Joi.alternatives().try(
      Joi.array().items(providerSettingsSchema),
      Joi.object().pattern(providerKey, providerSettingsSchema.fork(["key"], (schema) => schema.optional())),
    ),
    api_key: Joi.string().max(2000).allow("", null),
  }).min(1),
};

export const testAiSettingsSchema = {
  body: Joi.object({
    provider_key: providerKey,
    base_url: Joi.string().uri({ scheme: [/https?/] }),
    model_name: Joi.string().max(200),
    model: Joi.string().max(200),
    stream: Joi.boolean(),
    api_key_required: Joi.boolean(),
    max_tokens: Joi.number().integer().min(256).max(32768),
    temperature: Joi.number().min(0).max(2),
    api_key: Joi.string().max(2000).allow("", null),
  }).default({}),
};

export const testAiPromptSchema = {
  body: Joi.object({
    provider_key: providerKey,
    prompt: Joi.string().max(4000).required(),
    base_url: Joi.string().uri({ scheme: [/https?/] }),
    model_name: Joi.string().max(200),
    model: Joi.string().max(200),
    stream: Joi.boolean(),
    api_key_required: Joi.boolean(),
    max_tokens: Joi.number().integer().min(16).max(4096),
    temperature: Joi.number().min(0).max(2),
    api_key: Joi.string().max(2000).allow("", null),
  }),
};
