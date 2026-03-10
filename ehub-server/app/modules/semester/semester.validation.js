import Joi from "joi";

export const createSemesterSchema = {
  body: Joi.object({
    semester_code: Joi.string().max(20).required().messages({
      "any.required": "Semester code is required",
    }),
    semester_name: Joi.string().max(100).required().messages({
      "any.required": "Semester name is required",
    }),
    year: Joi.number().integer().min(2020).max(2100).required().messages({
      "any.required": "Year is required",
    }),
    start_date: Joi.date().iso().required().messages({
      "any.required": "Start date is required",
    }),
    end_date: Joi.date()
      .iso()
      .greater(Joi.ref("start_date"))
      .required()
      .messages({
        "any.required": "End date is required",
        "date.greater": "End date must be after start date",
      }),
    status: Joi.string()
      .valid("upcoming", "ongoing", "completed")
      .default("upcoming"),
  }),
};

export const updateSemesterSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    semester_code: Joi.string().max(20),
    semester_name: Joi.string().max(100),
    year: Joi.number().integer().min(2020).max(2100),
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso(),
    status: Joi.string().valid("upcoming", "ongoing", "completed"),
  }).min(1),
};

export const listSemesterSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string(),
    status: Joi.string().valid("upcoming", "ongoing", "completed"),
    year: Joi.number().integer().min(2020).max(2100),
  }),
};

export const semesterParamsSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};
