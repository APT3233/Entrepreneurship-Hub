import Joi from "joi";

export const createStudentSchema = {
  body: Joi.object({
    user_id: Joi.number().integer().positive().allow(null),
    student_code: Joi.string().max(20).required().messages({
      "any.required": "Student code (MSSV) is required",
    }),
    full_name: Joi.string().max(150).required().messages({
      "any.required": "Full name is required",
    }),
    email: Joi.string().email().max(150).required().messages({
      "any.required": "Email is required",
    }),
    phone: Joi.string().max(20).allow(null, ""),
    major: Joi.string().max(100).allow(null, ""),
    campus: Joi.string().max(50).allow(null, ""),
    status: Joi.string()
      .valid("active", "inactive", "graduated", "suspended")
      .default("active"),
  }),
};

export const updateStudentSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    user_id: Joi.number().integer().positive().allow(null),
    student_code: Joi.string().max(20),
    full_name: Joi.string().max(150),
    email: Joi.string().email().max(150),
    phone: Joi.string().max(20).allow(null, ""),
    major: Joi.string().max(100).allow(null, ""),
    campus: Joi.string().max(50).allow(null, ""),
    status: Joi.string().valid("active", "inactive", "graduated", "suspended"),
  }).min(1),
};

export const listStudentSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string(),
    status: Joi.string().valid("active", "inactive", "graduated", "suspended"),
    major: Joi.string().max(100),
    campus: Joi.string().max(50),
    search: Joi.string().max(100),
  }),
};

export const studentParamsSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};
