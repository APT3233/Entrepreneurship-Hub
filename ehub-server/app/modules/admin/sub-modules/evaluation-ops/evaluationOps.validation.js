import Joi from "joi";

const paginationQuery = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

const idParam = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

const optionalId = Joi.number().integer().positive().allow("");
const optionalText = Joi.string().max(150).allow("");
const dateFilter = Joi.date().iso().allow("");

const targetTypeFilter = Joi.string().valid("", "checkpoint", "assignment").allow("");
const evaluationStatusFilter = Joi.string().valid("", "draft", "submitted", "confirmed").allow("");

const evaluationManagementQuery = {
  semester_id: optionalId,
  subject_id: optionalId,
  class_id: optionalId,
  lecturer_id: optionalId,
  target_type: targetTypeFilter,
};

export const listAdminRubricsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    subject_id: optionalId,
    type: Joi.string().valid("", "checkpoint", "assignment", "final").allow(""),
    status: Joi.string().valid("", "draft", "active", "archived").allow(""),
  }),
};

export const adminRubricIdParamSchema = idParam;

export const updateAdminGradingConfigSchema = {
  body: Joi.object({
    feedback_required: Joi.boolean(),
    min_feedback_length: Joi.number().integer().min(0).max(10000),
    allow_resubmit: Joi.boolean(),
    allow_late_submission: Joi.boolean(),
    allow_grade_after_closed: Joi.boolean(),
    final_score_calculation: Joi.string().valid("manual", "weighted_sum"),
    ai_suggestion_enabled: Joi.boolean(),
    ai_auto_grading_enabled: Joi.boolean().valid(false),
  }).min(1),
};

export const listAdminEvaluationResultsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    semester_id: optionalId,
    subject_id: optionalId,
    class_id: optionalId,
    group_id: optionalId,
    graded_by: optionalId,
    status: Joi.string().valid("", "not_submitted", "submitted", "resubmitted", "graded").allow(""),
    source_type: Joi.string().valid("", "checkpoint", "assignment").allow(""),
    score_min: Joi.number().min(0).allow(""),
    score_max: Joi.number().min(0).allow(""),
  }),
};

export const adminEvaluationOverviewSchema = {
  query: Joi.object({
    ...evaluationManagementQuery,
  }),
};

export const listAdminEvaluationSessionsSchema = {
  query: Joi.object({
    ...paginationQuery,
    ...evaluationManagementQuery,
    search: optionalText,
    evaluator_id: optionalId,
    status: evaluationStatusFilter,
  }),
};

export const adminEvaluationSessionIdParamSchema = idParam;

export const updateAdminEvaluationSessionStatusSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    reason: Joi.string().max(1000).allow(""),
  }),
};

export const listAdminGradingProgressSchema = {
  query: Joi.object({
    ...paginationQuery,
    ...evaluationManagementQuery,
    search: optionalText,
    status: Joi.string().valid("", "draft", "open", "closed", "archived", "active", "completed").allow(""),
  }),
};

export const listAdminRubricUsageSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    subject_id: optionalId,
    status: Joi.string().valid("", "draft", "active", "archived").allow(""),
    unused_only: Joi.boolean().allow(""),
  }),
};

export const listAdminGradeAuditSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    user_id: optionalId,
    action: optionalText,
    table_name: optionalText,
    date_from: dateFilter,
    date_to: dateFilter,
  }),
};

export const adminEvaluationExportSchema = {
  body: Joi.object({
    export_type: Joi.string().valid("results", "sessions", "progress", "rubric_usage", "grade_audit", "criteria_scores").required(),
    format: Joi.string().valid("csv", "xlsx").default("csv"),
    filters: Joi.object().unknown(true).default({}),
  }),
};

export const listAdminImportLogsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    status: Joi.string().valid("", "processing", "completed", "failed", "cancelled").allow(""),
    target_table: optionalText,
    class_id: optionalId,
    user_id: optionalId,
    date_from: dateFilter,
    date_to: dateFilter,
  }),
};

export const listAdminInvitationsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    type: Joi.string().valid("", "class_invite", "group_invite", "email_event").allow(""),
    status: Joi.string().valid("", "pending", "used", "accepted", "declined", "expired", "revoked", "processing", "done", "failed", "dead").allow(""),
    email_delivery_status: Joi.string().valid("", "queued", "sending", "sent", "failed", "pending", "processing", "done", "dead").allow(""),
  }),
};

export const adminInvitationActionSchema = {
  params: Joi.object({
    type: Joi.string().valid("class_invite", "group_invite").required(),
    id: Joi.number().integer().positive().required(),
  }),
};

export const adminEmailEventParamSchema = idParam;

export const listAdminAuditLogsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    user_id: optionalId,
    action: optionalText,
    table_name: optionalText,
    date_from: dateFilter,
    date_to: dateFilter,
  }),
};

export const listAdminApiAccessLogsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    method: Joi.string().valid("", "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS").allow(""),
    status_code: Joi.number().integer().min(100).max(599).allow(""),
    user_id: optionalId,
    date_from: dateFilter,
    date_to: dateFilter,
    slow: Joi.boolean().allow(""),
  }),
};

export const adminImportExportActionSchema = {
  params: Joi.object({
    action: Joi.string().valid("upload", "template", "export").required(),
  }),
};
