import Joi from "joi";

const positiveId = Joi.number().integer().positive();
const optionalText = Joi.string().trim().max(10000).allow("", null);
const optionalUrl = Joi.string().trim().max(500).allow("", null);
const paginationQuery = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

export const assignmentTypes = ["primary", "supporting", "business", "technical"];
export const assignmentStatuses = ["proposed", "pending_mentor", "active", "rejected", "cancelled", "completed"];
export const requestRoles = ["business", "technical", "any"];
export const requestPriorities = ["low", "normal", "high", "urgent"];
export const sessionTypes = ["online", "offline", "hybrid"];
export const sessionStatuses = ["scheduled", "completed", "cancelled", "no_show", "rescheduled"];

export const listAssignmentsSchema = {
  query: Joi.object({
    ...paginationQuery,
    semester_id: positiveId.allow("", null),
    subject_id: positiveId.allow("", null),
    class_id: positiveId.allow("", null),
    group_id: positiveId.allow("", null),
    mentor_id: positiveId.allow("", null),
    assignment_type: Joi.string().valid("", ...assignmentTypes).allow(""),
    status: Joi.string().valid("", ...assignmentStatuses).allow(""),
    search: Joi.string().trim().max(500).allow("", null),
  }),
};

export const assignmentIdParamSchema = {
  params: Joi.object({ id: positiveId.required() }),
};

export const groupIdParamSchema = {
  params: Joi.object({ groupId: positiveId.required() }),
};

const assignmentBody = {
  mentor_id: positiveId.required(),
  group_id: positiveId.required(),
  assignment_type: Joi.string().valid(...assignmentTypes).default("primary"),
  status: Joi.string().valid(...assignmentStatuses).default("pending_mentor"),
  start_date: Joi.date().iso().allow(null),
  end_date: Joi.date().iso().allow(null),
  expected_sessions: Joi.number().integer().min(0).max(200).allow(null),
  note: optionalText,
};

export const createAssignmentSchema = { body: Joi.object(assignmentBody) };
export const createGroupAssignmentSchema = {
  params: Joi.object({ groupId: positiveId.required() }),
  body: Joi.object({ ...assignmentBody, group_id: positiveId.optional() }),
};

export const updateAssignmentSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    assignment_type: Joi.string().valid(...assignmentTypes),
    start_date: Joi.date().iso().allow(null),
    end_date: Joi.date().iso().allow(null),
    expected_sessions: Joi.number().integer().min(0).max(200).allow(null),
    note: optionalText,
  }).min(1),
};

export const updateAssignmentStatusSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    status: Joi.string().valid(...assignmentStatuses).required(),
    note: optionalText,
    rejection_reason: optionalText,
  }),
};

export const createAssignmentRequestSchema = {
  params: Joi.object({ groupId: positiveId.required() }),
  body: Joi.object({
    requested_role: Joi.string().valid(...requestRoles).default("any"),
    requested_expertise: Joi.array().items(Joi.string().trim().max(100)).max(30).allow(null),
    problem_statement: optionalText,
    support_needed: Joi.string().trim().max(10000).required(),
    priority: Joi.string().valid(...requestPriorities).default("normal"),
  }),
};

export const respondAssignmentSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    response: Joi.string().valid("accept", "decline").required(),
    note: optionalText,
    rejection_reason: optionalText,
  }),
};

export const listSessionsSchema = {
  query: Joi.object({
    ...paginationQuery,
    assignment_id: positiveId.allow("", null),
    mentor_id: positiveId.allow("", null),
    group_id: positiveId.allow("", null),
    class_id: positiveId.allow("", null),
    semester_id: positiveId.allow("", null),
    status: Joi.string().valid("", ...sessionStatuses).allow(""),
    search: Joi.string().trim().max(500).allow("", null),
  }),
};

export const listActionItemsSchema = {
  query: Joi.object({
    ...paginationQuery,
    assignment_id: positiveId.allow("", null),
    mentor_id: positiveId.allow("", null),
    group_id: positiveId.allow("", null),
    class_id: positiveId.allow("", null),
    semester_id: positiveId.allow("", null),
    status: Joi.string().valid("", ...sessionStatuses).allow(""),
    item_status: Joi.string().valid("", "open", "in_progress", "done", "cancelled").allow(""),
    search: Joi.string().trim().max(500).allow("", null),
  }),
};

const sessionBody = {
  assignment_id: positiveId.required(),
  title: Joi.string().trim().max(200).required(),
  description: optionalText,
  session_type: Joi.string().valid(...sessionTypes).default("online"),
  meeting_link: optionalUrl,
  location: Joi.string().trim().max(255).allow("", null),
  scheduled_start_at: Joi.date().iso().required(),
  scheduled_end_at: Joi.date().iso().required(),
  actual_start_at: Joi.date().iso().allow(null),
  actual_end_at: Joi.date().iso().allow(null),
};

export const createSessionSchema = { body: Joi.object(sessionBody) };
export const updateSessionSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({ ...sessionBody, assignment_id: positiveId.optional(), title: Joi.string().trim().max(200) }).min(1),
};
export const sessionIdParamSchema = { params: Joi.object({ id: positiveId.required() }) };
export const updateSessionStatusSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    status: Joi.string().valid(...sessionStatuses).required(),
    actual_start_at: Joi.date().iso().allow(null),
    actual_end_at: Joi.date().iso().allow(null),
    cancellation_reason: optionalText,
  }),
};

export const createNoteSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    note_type: Joi.string().valid("mentor_note", "student_note", "lecturer_note", "private_admin_note").default("mentor_note"),
    content: Joi.string().trim().max(10000).required(),
    visibility: Joi.string().valid("private_to_author", "internal", "shared_with_group", "shared_with_mentor").default("internal"),
  }),
};

export const createFeedbackSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    target_type: Joi.string().valid("mentor", "group", "session").required(),
    target_id: positiveId.required(),
    rating: Joi.number().integer().min(1).max(5).allow(null),
    feedback: optionalText,
    strengths: optionalText,
    improvements: optionalText,
  }),
};

export const createActionItemSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    assigned_to_user_id: positiveId.allow(null),
    title: Joi.string().trim().max(200).required(),
    description: optionalText,
    due_date: Joi.date().iso().allow(null),
  }),
};

export const actionItemIdParamSchema = { params: Joi.object({ id: positiveId.required() }) };
export const updateActionItemStatusSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({ status: Joi.string().valid("open", "in_progress", "done", "cancelled").required() }),
};

export const classIdParamSchema = { params: Joi.object({ classId: positiveId.required() }) };
