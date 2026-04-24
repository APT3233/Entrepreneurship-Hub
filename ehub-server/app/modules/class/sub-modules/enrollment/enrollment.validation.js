import Joi from "joi";

export const enrollStudentSchema = {
  params: Joi.object({
    classId: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    student_id: Joi.number().integer().positive(),
    student_code: Joi.string().trim(),
    full_name: Joi.string().trim(),
    email: Joi.string().email().trim(),
    major: Joi.string().trim().allow("", null),
  }).or("student_id", "student_code"),
};

export const unenrollStudentSchema = {
  params: Joi.object({
    classId: Joi.number().integer().positive().required(),
    studentId: Joi.number().integer().positive().required(),
  }),
};

export const updateEnrollmentSchema = {
  params: Joi.object({
    classId: Joi.number().integer().positive().required(),
    studentId: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    student_code: Joi.string().trim(),
    full_name: Joi.string().trim(),
    email: Joi.string().email().trim(),
    major: Joi.string().trim().allow("", null),
  }),
};

export const listEnrollmentSchema = {
  params: Joi.object({
    classId: Joi.number().integer().positive().required(),
  }),
};
