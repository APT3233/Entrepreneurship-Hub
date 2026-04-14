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

export const updateGroupMemberSchema = {
  params: Joi.object({
    groupId: Joi.number().integer().positive().required(),
    studentId: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    role: Joi.string().valid("leader", "member"),
    status: Joi.string().valid("active", "left", "removed"),
  })
    .or("role", "status")
    .messages({
      "object.missing": "At least one of role or status is required",
    }),
};
