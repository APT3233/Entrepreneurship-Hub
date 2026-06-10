import Joi from "joi";

export const createGroupSchema = {
  body: Joi.object({
    class_id: Joi.number().integer().positive().required().messages({
      "any.required": "Class ID is required",
    }),
    group_code: Joi.string().max(50).required().messages({
      "any.required": "Group code is required",
    }),
    group_name: Joi.string().max(200).required().messages({
      "any.required": "Group name is required",
    }),
    description: Joi.string().allow(null, ""),
    topic: Joi.string().allow(null, ""),
    topic_desc: Joi.string().allow(null, ""),
    zalo_link: Joi.string().allow(null, ""),
    category: Joi.string().allow(null, ""),
    mentor_name: Joi.string().allow(null, ""),
    mentor_dept: Joi.string().allow(null, ""),
    mentor_id: Joi.number().integer().positive().allow(null),
    max_members: Joi.number().integer().min(4).max(6).default(6),
    status: Joi.string()
      .valid("forming", "active", "inactive", "completed", "dissolved")
      .default("forming"),
    members: Joi.array()
      .items(Joi.object({ student_id: Joi.number().integer().positive().required() }))
      .default([]),
    leader_student_id: Joi.number().integer().positive().when("members", {
      is: Joi.array().min(1),
      then: Joi.required().messages({ "any.required": "leader_student_id is required when members is non-empty" }),
      otherwise: Joi.forbidden(),
    }),
  }),
};

export const updateGroupSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    group_code: Joi.string().max(50),
    group_name: Joi.string().max(200),
    description: Joi.string().allow(null, ""),
    topic: Joi.string().allow(null, ""),
    topic_desc: Joi.string().allow(null, ""),
    zalo_link: Joi.string().allow(null, ""),
    category: Joi.string().allow(null, ""),
    mentor_name: Joi.string().allow(null, ""),
    mentor_dept: Joi.string().allow(null, ""),
    max_members: Joi.number().integer().min(4).max(6),
    status: Joi.string().valid(
      "forming",
      "active",
      "inactive",
      "completed",
      "dissolved",
    ),
  }).min(1),
};

export const listGroupSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string(),
    status: Joi.string().valid("forming", "active", "inactive", "completed", "dissolved"),
    class_id: Joi.number().integer().positive(),
    lecturerScope: Joi.string().valid("mine").description("Filter groups by current lecturer's classes"),
  }),
};

export const groupParamsSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};
