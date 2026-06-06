import Joi from "joi";

const optionalId = Joi.number().integer().positive().empty("");
const targetType = Joi.string().valid("all", "checkpoint", "assignment").empty("");
const dateFilter = Joi.date().iso().empty("");

export const analyticsQuerySchema = {
  query: Joi.object({
    semester_id: optionalId,
    subject_id: optionalId,
    class_id: optionalId,
    lecturer_id: optionalId,
    target_type: targetType,
    rubric_id: optionalId,
    criterion_id: optionalId,
    date_from: dateFilter,
    date_to: dateFilter,
  }),
};

export const classAnalyticsSchema = {
  params: Joi.object({
    classId: Joi.number().integer().positive().required(),
  }),
  query: analyticsQuerySchema.query,
};
