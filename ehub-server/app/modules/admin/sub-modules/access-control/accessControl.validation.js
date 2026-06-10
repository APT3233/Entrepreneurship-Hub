import Joi from "joi";

const rolesBodySchema = Joi.array().items(Joi.string().max(30)).custom((value, helpers) => {
  const codes = (value || []).map((item) => String(item).trim().toLowerCase());
  const hasStudent = codes.includes("student");
  const hasStaff = codes.some((code) => code === "lecturer" || code === "admin");
  const hasMentor = codes.includes("mentor");
  if (hasStudent && (hasStaff || hasMentor)) {
    return helpers.error("any.custom", {
      message: "Một người dùng không thể vừa là Sinh viên vừa là Giảng viên, Quản trị viên hoặc Mentor.",
    });
  }
  return value;
});

const idParam = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

const paginationQuery = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

export const listUsersSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    status: Joi.string().valid("active", "inactive", "locked").allow(""),
    role: Joi.string().max(30).allow(""),
  }),
};

export const createUserSchema = {
  body: Joi.object({
    username: Joi.string().max(50).required(),
    email: Joi.string().email().max(150).required(),
    password: Joi.string().min(8).max(128).required(),
    full_name: Joi.string().max(150).required(),
    phone: Joi.string().max(20).allow(null, ""),
    campus: Joi.string().max(50).allow(null, ""),
    avatar_url: Joi.string().max(500).allow(null, ""),
    auth_provider: Joi.string().valid("local", "google").default("local"),
    status: Joi.string().valid("active", "inactive", "locked").default("active"),
    roles: rolesBodySchema.default([]),
  }),
};

export const updateUserSchema = {
  ...idParam,
  body: Joi.object({
    username: Joi.string().max(50),
    email: Joi.string().email().max(150),
    full_name: Joi.string().max(150),
    phone: Joi.string().max(20).allow(null, ""),
    campus: Joi.string().max(50).allow(null, ""),
    avatar_url: Joi.string().max(500).allow(null, ""),
    status: Joi.string().valid("active", "inactive", "locked"),
  }).min(1),
};

export const updateUserStatusSchema = {
  ...idParam,
  body: Joi.object({
    status: Joi.string().valid("active", "inactive", "locked").required(),
  }),
};

export const assignUserRolesSchema = {
  ...idParam,
  body: Joi.object({
    roles: rolesBodySchema.required(),
  }),
};

export const createRoleSchema = {
  body: Joi.object({
    role_code: Joi.string().max(30).pattern(/^[a-z0-9_]+$/).required(),
    role_name: Joi.string().max(100).required(),
    description: Joi.string().allow(null, ""),
  }),
};

export const updateRoleSchema = {
  ...idParam,
  body: Joi.object({
    role_code: Joi.string().max(30).pattern(/^[a-z0-9_]+$/),
    role_name: Joi.string().max(100),
    description: Joi.string().allow(null, ""),
  }).min(1),
};

export const assignRolePermissionsSchema = {
  ...idParam,
  body: Joi.object({
    permissions: Joi.array().items(Joi.string().max(80)).required(),
  }),
};

export const listPermissionsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    module: Joi.string().max(50).allow(""),
  }),
};

export const listSettingsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    module: Joi.string().max(50).allow(""),
  }),
};

export const updateSettingSchema = {
  ...idParam,
  body: Joi.object({
    setting_value: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean(), Joi.object(), Joi.array()).required(),
  }),
};

export const adminAccessControlIdParamSchema = idParam;
