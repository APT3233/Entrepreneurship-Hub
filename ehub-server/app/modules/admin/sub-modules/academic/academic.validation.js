import Joi from "joi";

const idParam = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

const paginationQuery = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

const deletedQuery = Joi.string().valid("", "all", "only").allow("");

export const listAdminSubjectsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    status: Joi.string().valid("", "active", "inactive").allow(""),
    deleted: deletedQuery,
  }),
};

export const getAdminAcademicByIdSchema = {
  ...idParam,
  query: Joi.object({
    include_deleted: Joi.string().valid("true", "false").allow(""),
  }).unknown(false),
};

export const createAdminSubjectSchema = {
  body: Joi.object({
    subject_code: Joi.string().max(20).required(),
    subject_name: Joi.string().max(200).required(),
    subject_name_en: Joi.string().max(200).allow(null, ""),
    description: Joi.string().allow(null, ""),
    credits: Joi.number().integer().min(0).max(10).default(0),
    status: Joi.string().valid("active", "inactive").default("active"),
  }),
};

export const updateAdminSubjectSchema = {
  ...idParam,
  body: Joi.object({
    subject_code: Joi.string().max(20),
    subject_name: Joi.string().max(200),
    subject_name_en: Joi.string().max(200).allow(null, ""),
    description: Joi.string().allow(null, ""),
    credits: Joi.number().integer().min(0).max(10),
    status: Joi.string().valid("active", "inactive"),
  }).min(1),
};

export const updateAdminSubjectStatusSchema = {
  ...idParam,
  body: Joi.object({
    status: Joi.string().valid("active", "inactive").required(),
  }),
};

export const listAdminSemestersSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    year: Joi.number().integer().min(2020).max(2100).allow(""),
    status: Joi.string().valid("", "upcoming", "ongoing", "completed").allow(""),
    deleted: deletedQuery,
  }),
};

export const createAdminSemesterSchema = {
  body: Joi.object({
    semester_code: Joi.string().max(20).required(),
    semester_name: Joi.string().max(100).required(),
    year: Joi.number().integer().min(2020).max(2100).required(),
    start_date: Joi.date().iso().required(),
    end_date: Joi.date().iso().greater(Joi.ref("start_date")).required(),
    status: Joi.string().valid("upcoming", "ongoing", "completed").default("upcoming"),
  }),
};

export const updateAdminSemesterSchema = {
  ...idParam,
  body: Joi.object({
    semester_code: Joi.string().max(20),
    semester_name: Joi.string().max(100),
    year: Joi.number().integer().min(2020).max(2100),
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso(),
    status: Joi.string().valid("upcoming", "ongoing", "completed"),
  }).min(1),
};

export const updateAdminSemesterStatusSchema = {
  ...idParam,
  body: Joi.object({
    status: Joi.string().valid("upcoming", "ongoing", "completed").required(),
  }),
};

export const listAdminClassesSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    subject_id: Joi.number().integer().positive().allow(""),
    semester_id: Joi.number().integer().positive().allow(""),
    lecturer_id: Joi.number().integer().positive().allow(""),
    status: Joi.string().valid("", "draft", "active", "completed", "archived").allow(""),
    deleted: deletedQuery,
  }),
};

export const createAdminClassSchema = {
  body: Joi.object({
    subject_id: Joi.number().integer().positive().required(),
    semester_id: Joi.number().integer().positive().required(),
    class_code: Joi.string().max(50).required(),
    class_name: Joi.string().max(200).allow(null, ""),
    lecturer_id: Joi.number().integer().positive().allow(null, ""),
    max_students: Joi.number().integer().min(1).max(200).default(40),
    min_group_members: Joi.number().integer().min(1).max(20).default(4),
    max_group_members: Joi.number().integer().min(Joi.ref("min_group_members")).max(20).default(6),
    status: Joi.string().valid("draft", "active", "completed", "archived").default("draft"),
  }),
};

export const updateAdminClassSchema = {
  ...idParam,
  body: Joi.object({
    subject_id: Joi.number().integer().positive(),
    semester_id: Joi.number().integer().positive(),
    class_code: Joi.string().max(50),
    class_name: Joi.string().max(200).allow(null, ""),
    lecturer_id: Joi.number().integer().positive().allow(null, ""),
    max_students: Joi.number().integer().min(1).max(200),
    min_group_members: Joi.number().integer().min(1).max(20),
    max_group_members: Joi.number().integer().min(1).max(20),
    status: Joi.string().valid("draft", "active", "completed", "archived"),
  }).custom((value, helpers) => {
    if (
      value.min_group_members !== undefined &&
      value.max_group_members !== undefined &&
      Number(value.min_group_members) > Number(value.max_group_members)
    ) {
      return helpers.error("any.invalid");
    }
    return value;
  }).min(1),
};

export const updateAdminClassStatusSchema = {
  ...idParam,
  body: Joi.object({
    status: Joi.string().valid("draft", "active", "completed", "archived").required(),
  }),
};

export const adminAcademicIdParamSchema = idParam;
