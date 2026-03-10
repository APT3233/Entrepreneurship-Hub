import Joi from "joi";

export const addGroupMemberSchema = {
  params: Joi.object({
    groupId: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    student_id: Joi.number().integer().positive().required().messages({
      "any.required": "Student ID is required",
    }),
    role: Joi.string().valid("leader", "member").default("member"),
  }),
};

export const removeGroupMemberSchema = {
  params: Joi.object({
    groupId: Joi.number().integer().positive().required(),
    studentId: Joi.number().integer().positive().required(),
  }),
};

export const listGroupMemberSchema = {
  params: Joi.object({
    groupId: Joi.number().integer().positive().required(),
  }),
};
