import Joi from "joi";

const positiveId = Joi.number().integer().positive();

export const analyticsQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    semester_id: positiveId.allow("", null),
    subject_id: positiveId.allow("", null),
    class_id: positiveId.allow("", null),
    mentor_type: Joi.string().valid("", "business", "technical", "internal_lecturer", "external_expert").allow(""),
    expertise_id: positiveId.allow("", null),
    date_from: Joi.date().iso().allow("", null),
    date_to: Joi.date().iso().allow("", null),
    search: Joi.string().trim().max(500).allow("", null),
  }),
};
