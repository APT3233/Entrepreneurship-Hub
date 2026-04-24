import Joi from "joi";

export const loginSchema = {
  body: Joi.object({
    username: Joi.string().required().messages({
      "any.required": "Username is required",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
  }),
};

export const registerSchema = {
  body: Joi.object({
    fullname: Joi.string().min(2).max(100).required().messages({
      "string.min": "Full name must be at least 2 characters long",
      "any.required": "Full name is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Email must be a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).max(128).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "string.max": "Password must not exceed 128 characters",
      "any.required": "Password is required",
    }),
    role: Joi.string()
      .valid("admin", "department_head", "lecturer", "student")
      .default("student"),
  }),
};

// refreshToken and logout token are now sent via httpOnly cookies, not request body
export const refreshSchema = {};
export const logoutSchema = {};

export const activatePreviewSchema = {
  query: Joi.object({
    token: Joi.string().length(64).hex().required(),
  }),
};

export const activateBodySchema = {
  body: Joi.object({
    token: Joi.string().length(64).hex().required(),
    password: Joi.string().min(6).max(128).required(),
  }),
};

export const updateProfileSchema = {
  body: Joi.object({
    full_name: Joi.string().min(2).max(150),
    avatar_url: Joi.string().max(255).allow(null, ""),
    phone: Joi.string().max(20).allow(null, ""),
    campus: Joi.string().valid("Hà Nội", "Đà Nẵng", "Quy Nhơn", "Cần Thơ", "Hồ Chí Minh").allow(null, ""),
  }).min(1),
};
export const changePasswordSchema = {
  body: Joi.object({
    old_password: Joi.string().required().messages({
      "any.required": "Mật khẩu cũ là bắt buộc",
    }),
    new_password: Joi.string().min(6).max(128).required().messages({
      "string.min": "Mật khẩu mới phải có ít nhất 6 ký tự",
      "any.required": "Mật khẩu mới là bắt buộc",
    }),
  }),
};
