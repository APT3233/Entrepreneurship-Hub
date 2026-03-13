import Joi from "joi";

export const createSubjectSchema = {
  body: Joi.object({
    subject_code: Joi.string().max(20).required().messages({
      "any.required": "Subject code is required",
      "string.max": "Subject code must not exceed 20 characters",
    }),
    subject_name: Joi.string().max(200).required().messages({
      "any.required": "Subject name is required",
    }),
    subject_name_en: Joi.string().max(200).allow(null, ""),
    description: Joi.string().allow(null, ""),
    credits: Joi.number().integer().min(0).max(10).default(0),
    status: Joi.string().valid("active", "inactive").default("active"),
  }),
};

export const updateSubjectSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    subject_code: Joi.string().max(20),
    subject_name: Joi.string().max(200),
    subject_name_en: Joi.string().max(200).allow(null, ""),
    description: Joi.string().allow(null, ""),
    credits: Joi.number().integer().min(0).max(10),
    status: Joi.string().valid("active", "inactive"),
  }).min(1),
};

export const listSubjectSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(100).allow(""),
    sort: Joi.string(),
    sortBy: Joi.string().valid("subject_code", "subject_name", "credits", "status", "created_at"),
    sortOrder: Joi.string().valid("asc", "desc"),
    status: Joi.string().valid("active", "inactive"),
  }),
};

export const subjectParamsSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};
