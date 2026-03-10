import Joi from "joi";

export const createClassSchema = {
  body: Joi.object({
    subject_id: Joi.number().integer().positive().required().messages({
      "any.required": "Subject ID is required",
    }),
    semester_id: Joi.number().integer().positive().required().messages({
      "any.required": "Semester ID is required",
    }),
    class_code: Joi.string().max(50).required().messages({
      "any.required": "Class code is required",
    }),
    class_name: Joi.string().max(200).allow(null, ""),
    teacher_id: Joi.number().integer().positive().allow(null),
    max_students: Joi.number().integer().min(1).max(200).default(40),
    min_group_members: Joi.number().integer().min(1).max(20).default(4),
    max_group_members: Joi.number()
      .integer()
      .min(Joi.ref("min_group_members"))
      .max(20)
      .default(6),
    status: Joi.string()
      .valid("draft", "active", "completed", "archived")
      .default("draft"),
  }),
};

export const updateClassSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    subject_id: Joi.number().integer().positive(),
    semester_id: Joi.number().integer().positive(),
    class_code: Joi.string().max(50),
    class_name: Joi.string().max(200).allow(null, ""),
    teacher_id: Joi.number().integer().positive().allow(null),
    max_students: Joi.number().integer().min(1).max(200),
    min_group_members: Joi.number().integer().min(1).max(20),
    max_group_members: Joi.number()
      .integer()
      .min(Joi.ref("min_group_members"))
      .max(20),
    status: Joi.string().valid("draft", "active", "completed", "archived"),
  }).min(1),
};

export const listClassSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string(),
    status: Joi.string().valid("draft", "active", "completed", "archived"),
    subject_id: Joi.number().integer().positive(),
    semester_id: Joi.number().integer().positive(),
  }),
};

export const classParamsSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};
