import Joi from "joi";

const entityId = Joi.alternatives()
  .try(Joi.number().integer().positive(), Joi.string().max(36))
  .required();

const idParam = {
  params: Joi.object({
    id: entityId,
  }),
};

const fileParam = {
  params: Joi.object({
    source: Joi.string().valid("checkpoint", "assignment").required(),
    id: Joi.number().integer().positive().required(),
  }),
};

const paginationQuery = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

const checkpointStatus = Joi.string().valid("draft", "open", "closed", "archived");
const assignmentStatus = Joi.string().valid("open", "closed", "archived");
const groupStatus = Joi.string().valid("forming", "active", "inactive", "completed", "dissolved");
const deadlineFilter = Joi.string().valid("", "overdue", "upcoming").allow("");
const submissionStatus = Joi.string().valid("", "not_submitted", "submitted", "resubmitted", "pending_grading", "graded").allow("");

export const adminProjectSubmissionIdParamSchema = idParam;
export const adminSubmissionFileParamSchema = fileParam;

export const listAdminProjectsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    semester_id: Joi.number().integer().positive().allow(""),
    class_id: Joi.number().integer().positive().allow(""),
    category: Joi.string().max(100).allow(""),
    status: groupStatus.valid("", "forming", "active", "inactive", "completed", "dissolved").allow(""),
  }),
};

export const updateAdminProjectSchema = {
  ...idParam,
  body: Joi.object({
    topic: Joi.string().max(500).allow(null, ""),
    topic_desc: Joi.string().allow(null, ""),
    category: Joi.string().max(100).allow(null, ""),
    zalo_link: Joi.string().max(500).allow(null, ""),
    mentor_name: Joi.string().max(200).allow(null, ""),
    mentor_dept: Joi.string().max(200).allow(null, ""),
  }).min(1),
};

export const listAdminCheckpointsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    class_id: Joi.number().integer().positive().allow(""),
    semester_id: Joi.number().integer().positive().allow(""),
    status: checkpointStatus.valid("", "draft", "open", "closed", "archived").allow(""),
    deadline: deadlineFilter,
  }),
};

export const createAdminCheckpointSchema = {
  body: Joi.object({
    class_id: Joi.number().integer().positive().required(),
    title: Joi.string().max(200).required(),
    description: Joi.string().allow(null, ""),
    order_index: Joi.number().integer().min(1).max(255).default(1),
    deadline: Joi.date().iso().required(),
    open_at: Joi.date().iso().allow(null, ""),
    max_score: Joi.number().positive().max(999.99).default(10),
    weight: Joi.number().min(0).max(999.99).default(1),
    required_file_types: Joi.string().max(200).allow(null, ""),
    max_file_size_mb: Joi.number().integer().min(1).max(500).default(20),
    max_files: Joi.number().integer().min(1).max(20).default(5),
    attachment_url: Joi.string().allow(null, ""),
    status: checkpointStatus.default("draft"),
  }),
};

export const updateAdminCheckpointSchema = {
  ...idParam,
  body: Joi.object({
    class_id: Joi.number().integer().positive(),
    title: Joi.string().max(200),
    description: Joi.string().allow(null, ""),
    order_index: Joi.number().integer().min(1).max(255),
    deadline: Joi.date().iso(),
    open_at: Joi.date().iso().allow(null, ""),
    max_score: Joi.number().positive().max(999.99),
    weight: Joi.number().min(0).max(999.99),
    required_file_types: Joi.string().max(200).allow(null, ""),
    max_file_size_mb: Joi.number().integer().min(1).max(500),
    max_files: Joi.number().integer().min(1).max(20),
    attachment_url: Joi.string().allow(null, ""),
    status: checkpointStatus,
    force: Joi.boolean().default(false),
  }).min(1),
};

export const updateAdminCheckpointStatusSchema = {
  ...idParam,
  body: Joi.object({
    status: checkpointStatus.required(),
  }),
};

export const listAdminCheckpointSubmissionsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    semester_id: Joi.number().integer().positive().allow(""),
    class_id: Joi.number().integer().positive().allow(""),
    group_id: Joi.number().integer().positive().allow(""),
    checkpoint_id: Joi.string().max(36).allow(""),
    status: submissionStatus,
    is_late: Joi.boolean().allow(""),
    graded_by: Joi.number().integer().positive().allow(""),
  }),
};

export const gradeAdminSubmissionSchema = {
  ...idParam,
  body: Joi.object({
    score: Joi.number().min(0).required(),
    feedback: Joi.string().trim().required(),
  }),
};

export const listAdminAssignmentsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    class_id: Joi.number().integer().positive().allow(""),
    semester_id: Joi.number().integer().positive().allow(""),
    status: assignmentStatus.valid("", "open", "closed", "archived").allow(""),
    deadline: deadlineFilter,
  }),
};

export const createAdminAssignmentSchema = {
  body: Joi.object({
    class_id: Joi.number().integer().positive().required(),
    title: Joi.string().max(200).required(),
    description: Joi.string().allow(null, ""),
    deadline: Joi.date().iso().required(),
    max_score: Joi.number().positive().max(999.99).default(10),
    status: assignmentStatus.default("open"),
    required_file_types: Joi.string().max(200).allow(null, ""),
    max_file_size_mb: Joi.number().integer().min(1).max(500).default(20),
    max_files: Joi.number().integer().min(1).max(20).default(5),
    attachment_url: Joi.string().allow(null, ""),
  }),
};

export const updateAdminAssignmentSchema = {
  ...idParam,
  body: Joi.object({
    class_id: Joi.number().integer().positive(),
    title: Joi.string().max(200),
    description: Joi.string().allow(null, ""),
    deadline: Joi.date().iso(),
    max_score: Joi.number().positive().max(999.99),
    status: assignmentStatus,
    required_file_types: Joi.string().max(200).allow(null, ""),
    max_file_size_mb: Joi.number().integer().min(1).max(500),
    max_files: Joi.number().integer().min(1).max(20),
    attachment_url: Joi.string().allow(null, ""),
    force: Joi.boolean().default(false),
  }).min(1),
};

export const updateAdminAssignmentStatusSchema = {
  ...idParam,
  body: Joi.object({
    status: assignmentStatus.required(),
  }),
};

export const listAdminAssignmentSubmissionsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    semester_id: Joi.number().integer().positive().allow(""),
    class_id: Joi.number().integer().positive().allow(""),
    group_id: Joi.number().integer().positive().allow(""),
    assignment_id: Joi.string().max(36).allow(""),
    status: submissionStatus,
    is_late: Joi.boolean().allow(""),
    graded_by: Joi.number().integer().positive().allow(""),
  }),
};

export const listAdminSubmissionFilesSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    source: Joi.string().valid("", "checkpoint", "assignment").allow(""),
    checkpoint_id: Joi.string().max(36).allow(""),
    assignment_id: Joi.string().max(36).allow(""),
    is_deleted: Joi.boolean().allow(""),
  }),
};
