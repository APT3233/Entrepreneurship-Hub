import Joi from "joi";

const idParam = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

const classIdParam = {
  params: Joi.object({
    classId: Joi.number().integer().positive().required(),
  }),
};

const paginationQuery = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

const profileFields = {
  display_name: Joi.string().max(150).allow(null, ""),
  bio: Joi.string().allow(null, ""),
  department: Joi.string().max(150).allow(null, ""),
  academic_title: Joi.string().max(100).allow(null, ""),
  specialization: Joi.string().max(255).allow(null, ""),
  office_location: Joi.string().max(255).allow(null, ""),
  contact_note: Joi.string().allow(null, ""),
  timezone: Joi.string().max(50).allow(null, ""),
  locale: Joi.string().max(10).allow(null, ""),
};

export const listAdminLecturersSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    status: Joi.string().valid("active", "inactive", "locked").allow(""),
    auth_provider: Joi.string().valid("local", "google").allow(""),
    semester_id: Joi.number().integer().positive().allow(""),
    subject_id: Joi.number().integer().positive().allow(""),
    has_active_class: Joi.string().valid("yes", "no").allow(""),
    has_pending_grading: Joi.string().valid("yes", "no").allow(""),
  }),
};

export const listAdminLecturerWorkloadSchema = {
  query: Joi.object({
    ...paginationQuery,
    semester_id: Joi.number().integer().positive().allow(""),
    subject_id: Joi.number().integer().positive().allow(""),
    status: Joi.string().valid("active", "inactive", "locked").allow(""),
    has_pending_grading: Joi.string().valid("yes", "no").allow(""),
  }),
};

export const createAdminLecturerSchema = {
  body: Joi.object({
    full_name: Joi.string().max(150).required(),
    email: Joi.string().email().max(150).required(),
    username: Joi.string().max(50).required(),
    phone: Joi.string().max(20).allow(null, ""),
    avatar_url: Joi.string().max(500).allow(null, ""),
    auth_provider: Joi.string().valid("local", "google").default("local"),
    password: Joi.when("auth_provider", {
      is: "local",
      then: Joi.string().min(8).max(128).required(),
      otherwise: Joi.string().allow(null, ""),
    }),
    status: Joi.string().valid("active", "inactive", "locked").default("active"),
    profile: Joi.object(profileFields).default({}),
  }),
};

export const updateAdminLecturerSchema = {
  ...idParam,
  body: Joi.object({
    full_name: Joi.string().max(150),
    email: Joi.string().email().max(150),
    username: Joi.string().max(50),
    phone: Joi.string().max(20).allow(null, ""),
    avatar_url: Joi.string().max(500).allow(null, ""),
    auth_provider: Joi.string().valid("local", "google"),
    status: Joi.string().valid("active", "inactive", "locked"),
  }).min(1),
};

export const updateAdminLecturerStatusSchema = {
  ...idParam,
  body: Joi.object({
    status: Joi.string().valid("active", "inactive", "locked").required(),
  }),
};

export const updateAdminLecturerPasswordSchema = {
  ...idParam,
  body: Joi.object({
    new_password: Joi.string().min(8).max(128).required(),
    confirm_password: Joi.string().valid(Joi.ref("new_password")).required(),
    force_logout: Joi.boolean().default(true),
  }),
};

export const updateAdminLecturerProfileSchema = {
  ...idParam,
  body: Joi.object({
    full_name: Joi.string().max(150),
    email: Joi.string().email().max(150),
    phone: Joi.string().max(20).allow(null, ""),
    avatar_url: Joi.string().max(500).allow(null, ""),
    status: Joi.string().valid("active", "inactive", "locked"),
    ...profileFields,
  }).min(1),
};

export const listAdminLecturerClassesSchema = {
  ...idParam,
  query: Joi.object({
    ...paginationQuery,
    semester_id: Joi.number().integer().positive().allow(""),
    subject_id: Joi.number().integer().positive().allow(""),
    status: Joi.string().valid("draft", "active", "completed", "archived").allow(""),
  }),
};

export const assignAdminLecturerClassSchema = {
  ...idParam,
  body: Joi.object({
    class_id: Joi.number().integer().positive().required(),
    force: Joi.boolean().default(false),
  }),
};

export const patchAdminClassLecturerSchema = {
  ...classIdParam,
  body: Joi.object({
    lecturer_id: Joi.number().integer().positive().allow(null).required(),
    force: Joi.boolean().default(false),
  }),
};

export const listAvailableLecturerClassesSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    semester_id: Joi.number().integer().positive().allow(""),
    subject_id: Joi.number().integer().positive().allow(""),
    status: Joi.string().valid("draft", "active", "completed", "archived").allow(""),
    lecturer_id: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().valid("unassigned")).allow(""),
  }),
};

export const getAdminLecturerGradingSchema = {
  ...idParam,
  query: Joi.object({
    semester_id: Joi.number().integer().positive().allow(""),
    class_id: Joi.number().integer().positive().allow(""),
    target_type: Joi.string().valid("checkpoint", "assignment").allow(""),
    status: Joi.string().max(30).allow(""),
    from_date: Joi.date().iso().allow(""),
    to_date: Joi.date().iso().allow(""),
  }),
};

export const getAdminLecturerActivitySchema = {
  ...idParam,
  query: Joi.object({
    ...paginationQuery,
    action: Joi.string().max(64).allow(""),
    table_name: Joi.string().max(64).allow(""),
    status_code: Joi.number().integer().min(100).max(599).allow(""),
    from_date: Joi.date().iso().allow(""),
    to_date: Joi.date().iso().allow(""),
  }),
};

export const adminLecturerIdParamSchema = idParam;
