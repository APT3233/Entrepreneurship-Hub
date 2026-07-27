import Joi from "joi";

const positiveId = Joi.number().integer().positive();
const optionalText = Joi.string().trim().max(10000).allow("", null);
const paginationQuery = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

export const listMatchingRequestsSchema = {
  query: Joi.object({
    ...paginationQuery,
    group_id: positiveId.allow("", null),
    class_id: positiveId.allow("", null),
    semester_id: positiveId.allow("", null),
    status: Joi.string().valid("", "pending", "generated", "approved", "rejected", "converted_to_assignment", "cancelled").allow(""),
    priority: Joi.string().valid("", "low", "normal", "high", "urgent").allow(""),
    search: Joi.string().trim().max(500).allow("", null),
  }),
};

export const createMatchingRequestSchema = {
  body: Joi.object({
    group_id: positiveId.required(),
    source_assignment_request_id: positiveId.allow(null),
    support_needed: Joi.string().trim().max(10000).required(),
    preferred_mentor_type: Joi.string().valid("business", "technical", "any").default("any"),
    required_expertise: Joi.array().items(positiveId).max(30).allow(null),
    priority: Joi.string().valid("low", "normal", "high", "urgent").default("normal"),
  }),
};

export const matchingRequestIdParamSchema = {
  params: Joi.object({ id: positiveId.required() }),
};

export const generateMatchingSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    matching_method: Joi.string().valid("rule_based", "ai", "hybrid").default("hybrid"),
    limit: Joi.number().integer().min(1).max(20).default(10),
  }),
};

export const suggestionIdParamSchema = {
  params: Joi.object({ id: positiveId.required() }),
};

export const recordSuggestionActionSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    action: Joi.string().valid("viewed", "shortlisted", "approved", "rejected", "ignored").required(),
    note: optionalText,
  }),
};

export const convertSuggestionSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    assignment_type: Joi.string().valid("primary", "supporting", "business", "technical").default("supporting"),
    status: Joi.string().valid("proposed", "pending_mentor", "active").default("proposed"),
    start_date: Joi.date().iso().allow(null),
    end_date: Joi.date().iso().allow(null),
    expected_sessions: Joi.number().integer().min(0).max(200).allow(null),
    note: optionalText,
  }),
};
