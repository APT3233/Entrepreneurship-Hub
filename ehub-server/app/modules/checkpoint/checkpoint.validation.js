import Joi from "joi";

/** Hạn nộp phải sau thời điểm hiện tại (không cho quá khứ). */
const deadlineMustBeFuture = (value, helpers) => {
  if (value === undefined || value === null) return value;
  const t = new Date(value).getTime();
  if (Number.isNaN(t) || t <= Date.now()) {
    return helpers.error("any.custom", { message: "Hạn nộp không được là thời điểm đã qua." });
  }
  return value;
};

/**
 * Validations for Checkpoint module
 * Following Enterprise standards and Joi best practices
 */

export const createCheckpointSchema = {
  body: Joi.object({
    class_id: Joi.number().integer().positive().required(),
    title: Joi.string().max(255).required(),
    description: Joi.string().allow(null, ""),
    order_index: Joi.number().integer().min(1).default(1),
    deadline: Joi.date().iso().required().custom(deadlineMustBeFuture),
    open_at: Joi.date().iso().allow(null, ""),
    max_score: Joi.number().min(0).max(100).default(10),
    weight: Joi.number().min(0).max(1).default(0.25),
    required_file_types: Joi.string().allow(null, ""),
    max_file_size_mb: Joi.number().integer().min(1).default(15),
    max_files: Joi.number().integer().min(1).default(3),
    attachment_url: Joi.string().max(100000).allow(null, ""),
    status: Joi.string().valid("draft", "open", "closed").default("draft"),
  }),
};

export const bulkCreateCheckpointSchema = {
  body: Joi.object({
    class_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
    title: Joi.string().max(255).required(),
    description: Joi.string().allow(null, ""),
    order_index: Joi.number().integer().min(1).default(1),
    deadline: Joi.date().iso().required().custom(deadlineMustBeFuture),
    open_at: Joi.date().iso().allow(null, ""),
    max_score: Joi.number().min(0).max(100).default(10),
    weight: Joi.number().min(0).max(1).default(0.25),
    required_file_types: Joi.string().allow(null, ""),
    max_file_size_mb: Joi.number().integer().min(1).default(15),
    max_files: Joi.number().integer().min(1).default(3),
    attachment_url: Joi.string().max(100000).allow(null, ""),
    status: Joi.string().valid("draft", "open", "closed").default("draft"),
  }),
};

export const updateCheckpointSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    title: Joi.string().max(255),
    description: Joi.string().allow(null, ""),
    order_index: Joi.number().integer().min(1),
    deadline: Joi.date().iso().custom(deadlineMustBeFuture),
    open_at: Joi.date().iso().allow(null, ""),
    max_score: Joi.number().min(0).max(100),
    weight: Joi.number().min(0).max(1),
    required_file_types: Joi.string().allow(null, ""),
    max_file_size_mb: Joi.number().integer().min(1),
    max_files: Joi.number().integer().min(1),
    attachment_url: Joi.string().max(100000).allow(null, ""),
    status: Joi.string().valid("draft", "open", "closed"),
  }).min(1),
};

export const listCheckpointSchema = {
  query: Joi.object({
    class_id: Joi.number().integer().positive(),
    semester_id: Joi.number().integer().positive(),
    year: Joi.number().integer().min(2000).max(3000),
    lecturerScope: Joi.string().valid("mine"),
    status: Joi.string().valid("draft", "open", "closed"),
  }),
};

export const checkpointParamsSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

export const initiateUploadSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    files: Joi.array().items(
      Joi.object({
        name: Joi.string().max(500).required(),
        size: Joi.number().integer().positive().required(),
        type: Joi.string().max(100).required(),
      })
    ).min(1).max(10).required(),
  }),
};

export const confirmUploadSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    session_id: Joi.number().integer().positive().required(),
    note: Joi.string().allow(null, "").max(2000),
  }),
};
