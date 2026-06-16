import Joi from "joi";

const nullableString = (max = 8000) => Joi.string().max(max).allow(null, "");
const positiveId = Joi.number().integer().positive();
const optionalPositiveId = positiveId.empty("");
const paginationQuery = {
  page: Joi.number().integer().min(1).default(1).empty(""),
  limit: Joi.number().integer().min(1).max(100).default(20).empty(""),
};

export const listRubricSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(200).allow("").empty(""),
    subject_id: optionalPositiveId,
    status: Joi.string().valid("draft", "active", "archived").empty(""),
  }),
};

export const rubricParamsSchema = {
  params: Joi.object({
    id: positiveId.required(),
  }),
};

export const createRubricSchema = {
  body: Joi.object({
    subject_id: optionalPositiveId.allow(null),
    name: Joi.string().max(200).required(),
    description: nullableString(),
    total_score: Joi.number().positive().max(1000).required(),
    status: Joi.string().valid("draft", "active", "archived").default("draft"),
  }),
};

export const updateRubricSchema = {
  params: Joi.object({
    id: positiveId.required(),
  }),
  body: Joi.object({
    subject_id: optionalPositiveId.allow(null),
    name: Joi.string().max(200),
    description: nullableString(),
    total_score: Joi.number().positive().max(1000),
    status: Joi.string().valid("draft", "active", "archived"),
  }).min(1),
};

export const cloneRubricSchema = {
  params: Joi.object({
    id: positiveId.required(),
  }),
  body: Joi.object({
    name: Joi.string().max(200).allow("").empty(""),
    description: nullableString(),
    status: Joi.string().valid("draft", "active", "archived").default("draft"),
  }).default({}),
};

export const createCriterionSchema = {
  params: Joi.object({
    id: positiveId.required(),
  }),
  body: Joi.object({
    name: Joi.string().max(200).required(),
    description: nullableString(),
    max_score: Joi.number().positive().max(1000).required(),
    weight: Joi.number().min(0).max(100).default(1),
    order_index: Joi.number().integer().min(1).default(1),
    is_required_feedback: Joi.boolean().default(false),
  }),
};

export const updateCriterionSchema = {
  params: Joi.object({
    id: positiveId.required(),
    criterionId: positiveId.required(),
  }),
  body: Joi.object({
    name: Joi.string().max(200),
    description: nullableString(),
    max_score: Joi.number().positive().max(1000),
    weight: Joi.number().min(0).max(100),
    order_index: Joi.number().integer().min(1),
    is_required_feedback: Joi.boolean(),
  }).min(1),
};

export const deleteCriterionSchema = {
  params: Joi.object({
    id: positiveId.required(),
    criterionId: positiveId.required(),
  }),
};

export const bindRubricSchema = {
  params: Joi.object({
    id: positiveId.required(),
  }),
  body: Joi.object({
    target_type: Joi.string().valid("checkpoint", "assignment").required(),
    target_id: Joi.string().required(),
  }),
};

export const gradingFormSchema = {
  params: Joi.object({
    targetType: Joi.string().valid("checkpoint_submission", "assignment_submission").required(),
    targetId: positiveId.required(),
  }),
};

export const gradingDashboardSchema = {
  query: Joi.object({
    class_id: optionalPositiveId,
    semester_id: optionalPositiveId,
    year: Joi.number().integer().positive().empty(""),
  }),
};

export const listGradingSubmissionSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(200).allow("").empty(""),
    source_type: Joi.string().valid("checkpoint", "assignment").empty(""),
    class_id: optionalPositiveId,
    checkpoint_id: Joi.string().empty(""),
    assignment_id: Joi.string().empty(""),
    status: Joi.string().valid("submitted", "resubmitted", "graded").empty(""),
    is_late: Joi.number().valid(0, 1).empty(""),
    evaluation_status: Joi.string().valid("not_started", "draft", "submitted", "confirmed").empty(""),
    semester_id: optionalPositiveId,
    year: Joi.number().integer().positive().empty(""),
  }),
};

const evaluationScoreSchema = Joi.object({
  criterion_id: positiveId.required(),
  score: Joi.number().min(0).max(1000).required(),
  feedback: nullableString(),
});

export const saveEvaluationSchema = {
  body: Joi.object({
    target_type: Joi.string().valid("checkpoint_submission", "assignment_submission").required(),
    target_id: positiveId.required(),
    evaluation_session_id: optionalPositiveId,
    overall_feedback: nullableString(),
    direct_score: Joi.number().min(0).max(1000).allow(null).empty(""),
    scores: Joi.array().items(evaluationScoreSchema).default([]),
  }),
};

export const evaluationParamsSchema = {
  params: Joi.object({
    id: positiveId.required(),
  }),
};

export const listEvaluationSchema = {
  query: Joi.object({
    ...paginationQuery,
    class_id: optionalPositiveId,
    checkpoint_id: Joi.string().empty(""),
    assignment_id: Joi.string().empty(""),
    group_id: optionalPositiveId,
    status: Joi.string().valid("draft", "submitted", "confirmed").empty(""),
  }),
};
