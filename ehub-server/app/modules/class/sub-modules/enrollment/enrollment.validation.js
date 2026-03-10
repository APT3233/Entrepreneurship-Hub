import Joi from "joi";

export const enrollStudentSchema = {
  params: Joi.object({
    classId: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    student_id: Joi.number().integer().positive().required().messages({
      "any.required": "Student ID is required",
    }),
  }),
};

export const unenrollStudentSchema = {
  params: Joi.object({
    classId: Joi.number().integer().positive().required(),
    studentId: Joi.number().integer().positive().required(),
  }),
};

export const listEnrollmentSchema = {
  params: Joi.object({
    classId: Joi.number().integer().positive().required(),
  }),
};
