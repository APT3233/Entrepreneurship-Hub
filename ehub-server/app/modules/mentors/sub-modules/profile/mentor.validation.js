import Joi from "joi";

const optionalText = Joi.string().trim().max(500).allow("", null);
const optionalLongText = Joi.string().trim().max(10000).allow("", null);
const optionalUrl = Joi.string().trim().max(500).allow("", null);
const positiveId = Joi.number().integer().positive();

export const mentorTypes = ["business", "technical", "internal_lecturer", "external_expert"];
export const mentorStatuses = ["pending", "active", "inactive", "rejected", "archived"];
export const mentorVisibilities = ["private", "internal", "public"];
export const expertiseCategories = ["business", "technical", "product", "marketing", "finance", "legal", "ai", "data", "other"];
export const expertiseLevels = ["beginner", "intermediate", "advanced", "expert"];
export const documentTypes = ["cv", "resume", "portfolio", "certificate", "other"];

const paginationQuery = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

const mentorProfileBase = {
  user_id: positiveId.allow(null),
  full_name: Joi.string().trim().max(150).required(),
  email: Joi.string().trim().email().max(150).required(),
  phone: Joi.string().trim().max(20).allow("", null),
  avatar_url: optionalUrl,
  mentor_type: Joi.string().valid(...mentorTypes).required(),
  organization: optionalText,
  position_title: Joi.string().trim().max(150).allow("", null),
  bio: optionalLongText,
  years_of_experience: Joi.number().integer().min(0).max(80).allow(null),
  linkedin_url: optionalUrl,
  portfolio_url: optionalUrl,
  cv_file_url: optionalUrl,
  visibility: Joi.string().valid(...mentorVisibilities).default("internal"),
};

const mentorProfileUpdate = { ...mentorProfileBase };
delete mentorProfileUpdate.full_name;
delete mentorProfileUpdate.email;
delete mentorProfileUpdate.mentor_type;

export const listMentorsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    mentor_type: Joi.string().valid("", ...mentorTypes).allow(""),
    status: Joi.string().valid("", ...mentorStatuses).allow(""),
    visibility: Joi.string().valid("", ...mentorVisibilities).allow(""),
    expertise_id: positiveId.allow("", null),
    min_years: Joi.number().integer().min(0).max(80).allow("", null),
    max_years: Joi.number().integer().min(0).max(80).allow("", null),
  }),
};

export const mentorIdParamSchema = {
  params: Joi.object({ id: positiveId.required() }),
};

export const createMentorSchema = {
  body: Joi.object({
    ...mentorProfileBase,
    status: Joi.string().valid(...mentorStatuses).default("pending"),
    create_account: Joi.boolean().default(true),
    // Bắt buộc khi tạo tài khoản đăng nhập mới — kiểm tra ở service vì phụ thuộc cả user_id.
    password: Joi.string().min(8).max(128),
  }),
};

export const updateMentorSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    ...mentorProfileUpdate,
    full_name: Joi.string().trim().max(150),
    email: Joi.string().trim().email().max(150),
    mentor_type: Joi.string().valid(...mentorTypes),
  }).min(1),
};

export const updateMentorSelfSchema = {
  body: Joi.object({
    full_name: Joi.string().trim().max(150),
    email: Joi.string().trim().email().max(150),
    phone: Joi.string().trim().max(20).allow("", null),
    avatar_url: optionalUrl,
    mentor_type: Joi.string().valid(...mentorTypes),
    organization: optionalText,
    position_title: Joi.string().trim().max(150).allow("", null),
    bio: optionalLongText,
    years_of_experience: Joi.number().integer().min(0).max(80).allow(null),
    linkedin_url: optionalUrl,
    portfolio_url: optionalUrl,
    cv_file_url: optionalUrl,
    visibility: Joi.string().valid(...mentorVisibilities),
  }).min(1),
};

export const updateMentorStatusSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({ status: Joi.string().valid(...mentorStatuses).required() }),
};

export const listExpertiseAreasSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    category: Joi.string().valid("", ...expertiseCategories).allow(""),
    status: Joi.string().valid("", "active", "inactive").allow(""),
  }),
};

export const createExpertiseAreaSchema = {
  body: Joi.object({
    code: Joi.string().trim().lowercase().pattern(/^[a-z0-9_]+$/).max(80).required(),
    name: Joi.string().trim().max(150).required(),
    description: optionalLongText,
    category: Joi.string().valid(...expertiseCategories).default("other"),
    status: Joi.string().valid("active", "inactive").default("active"),
  }),
};

export const updateExpertiseAreaSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    code: Joi.string().trim().lowercase().pattern(/^[a-z0-9_]+$/).max(80),
    name: Joi.string().trim().max(150),
    description: optionalLongText,
    category: Joi.string().valid(...expertiseCategories),
    status: Joi.string().valid("active", "inactive"),
  }).min(1),
};

export const expertiseAreaIdParamSchema = {
  params: Joi.object({ id: positiveId.required() }),
};

const mentorExpertiseItem = Joi.object({
  expertise_id: positiveId.required(),
  level: Joi.string().valid(...expertiseLevels).default("intermediate"),
  years_experience: Joi.number().integer().min(0).max(80).allow(null),
  note: optionalLongText,
});

export const replaceMentorExpertiseSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({ items: Joi.array().items(mentorExpertiseItem).max(50).default([]) }),
};

export const replaceMentorSelfExpertiseSchema = {
  body: Joi.object({ items: Joi.array().items(mentorExpertiseItem).max(50).default([]) }),
};

const timeValue = Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).allow("", null);
const availabilityItem = Joi.object({
  day_of_week: Joi.number().integer().min(1).max(7).allow(null),
  start_time: timeValue,
  end_time: timeValue,
  timezone: Joi.string().trim().max(50).default("Asia/Ho_Chi_Minh"),
  available_from: Joi.date().iso().allow(null),
  available_to: Joi.date().iso().allow(null),
  max_sessions_per_week: Joi.number().integer().min(0).max(100).allow(null),
  note: optionalLongText,
  status: Joi.string().valid("active", "inactive").default("active"),
});

export const replaceMentorAvailabilitySchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({ items: Joi.array().items(availabilityItem).max(50).default([]) }),
};

export const replaceMentorSelfAvailabilitySchema = {
  body: Joi.object({ items: Joi.array().items(availabilityItem).max(50).default([]) }),
};

const uploadFileSchema = Joi.object({
  name: Joi.string().trim().max(255).required(),
  size: Joi.number().integer().min(1).required(),
  type: Joi.string().trim().max(100).allow("").default("application/octet-stream"),
});

export const initiateMentorDocumentUploadSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({
    document_type: Joi.string().valid(...documentTypes).default("other"),
    file: uploadFileSchema.required(),
  }),
};

export const initiateMentorSelfDocumentUploadSchema = {
  body: Joi.object({
    document_type: Joi.string().valid(...documentTypes).default("other"),
    file: uploadFileSchema.required(),
  }),
};

export const confirmMentorDocumentUploadSchema = {
  params: Joi.object({ id: positiveId.required() }),
  body: Joi.object({ upload_token: Joi.string().required() }),
};

export const confirmMentorSelfDocumentUploadSchema = {
  body: Joi.object({ upload_token: Joi.string().required() }),
};

export const deleteMentorDocumentSchema = {
  params: Joi.object({ id: positiveId.required(), documentId: positiveId.required() }),
};

export const deleteMentorSelfDocumentSchema = {
  params: Joi.object({ documentId: positiveId.required() }),
};

export const listMentorDocumentsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: optionalText,
    mentor_id: positiveId.allow("", null),
    document_type: Joi.string().valid("", ...documentTypes).allow(""),
  }),
};
