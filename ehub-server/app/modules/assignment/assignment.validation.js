import Joi from "joi";

export const createAssignmentSchema = {
  body: Joi.object({
    class_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
    title: Joi.string().max(200).required(),
    description: Joi.string().allow(null, ""),
    deadline: Joi.date().iso().required(),
    max_score: Joi.number().positive().max(1000).default(10),
    status: Joi.string().valid("open", "closed", "archived").default("open"),
  }),
};

export const updateAssignmentSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    title: Joi.string().max(200),
    description: Joi.string().allow(null, ""),
    deadline: Joi.date().iso(),
    max_score: Joi.number().positive().max(1000),
    status: Joi.string().valid("open", "closed", "archived"),
  }).min(1),
};

export const updateAssignmentStatusSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    status: Joi.string().valid("open", "closed").required(),
  }),
};

export const listAssignmentSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string(),
    status: Joi.string().valid("open", "closed", "archived"),
    class_id: Joi.number().integer().positive(),
    semester_id: Joi.number().integer().positive(),
    year: Joi.number().integer().min(2000).max(3000),
    lecturerScope: Joi.string().valid("mine"),
  }),
};

export const assignmentParamsSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};
