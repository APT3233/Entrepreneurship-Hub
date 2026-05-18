import Joi from "joi";

/** Hạn nộp phải sau thời điểm hiện tại (không cho chọn quá khứ). */
const deadlineMustBeFuture = (value, helpers) => {
  if (value === undefined || value === null) return value;
  const t = new Date(value).getTime();
  if (Number.isNaN(t) || t <= Date.now()) {
    return helpers.error("any.custom", { message: "Hạn nộp không được là thời điểm đã qua." });
  }
  return value;
};

export const createAssignmentSchema = {
  body: Joi.object({
    class_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
    title: Joi.string().max(200).required(),
    description: Joi.string().allow(null, ""),
    deadline: Joi.date().iso().required().custom(deadlineMustBeFuture),
    max_score: Joi.number().positive().max(1000).default(10),
    status: Joi.string().valid("open", "closed", "archived").default("open"),
    required_file_types: Joi.string().max(200).default("pdf,docx"),
    max_file_size_mb: Joi.number().integer().positive().max(500).default(20),
    max_files: Joi.number().integer().positive().max(20).default(5),
    attachment_url: Joi.string().max(100000).allow(null, ""),
  }),
};

export const updateAssignmentSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    title: Joi.string().max(200),
    description: Joi.string().allow(null, ""),
    deadline: Joi.date().iso().custom(deadlineMustBeFuture),
    max_score: Joi.number().positive().max(1000),
    status: Joi.string().valid("open", "closed", "archived"),
    required_file_types: Joi.string().max(200),
    max_file_size_mb: Joi.number().integer().positive().max(500),
    max_files: Joi.number().integer().positive().max(20),
    attachment_url: Joi.string().max(100000).allow(null, ""),
  }).min(1),
};

export const updateAssignmentStatusSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    status: Joi.string().valid("open", "closed").required(),
  }),
};

export const listAssignmentSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string(),
    status: Joi.string().valid("open", "closed", "archived"),
    class_id: Joi.number().integer().positive(),
    semester_id: Joi.number().integer().positive(),
    year: Joi.number().integer().min(2000).max(3000),
    lecturerScope: Joi.string().valid("mine"),
  }),
};

export const assignmentParamsSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

export const initiateAssignmentUploadSchema = {
  body: Joi.object({
    file: Joi.object({
      name: Joi.string().max(500).required(),
      size: Joi.number().integer().positive().required(),
      type: Joi.string().max(100).required(),
    }).required(),
  }),
};

export const confirmAssignmentUploadSchema = {
  body: Joi.object({
    upload_token: Joi.string().required(),
  }),
};

const fileMetaSchema = Joi.object({
  name: Joi.string().max(500).required(),
  size: Joi.number().integer().positive().required(),
  type: Joi.string().max(100).allow("").default("application/octet-stream"),
});

export const assignmentSubmitInitiateSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    files: Joi.array().items(fileMetaSchema).min(1).max(20).required(),
  }),
};

export const assignmentSubmitConfirmSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    session_id: Joi.string().required(),
  }),
};

/** Chấm điểm bài nộp theo nhóm — max điểm kiểm tra thêm ở service theo bài tập */
export const assignmentGradeSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
    groupId: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    score: Joi.number().min(0).max(1000).required(),
    feedback: Joi.string().max(8000).allow(null, ""),
  }),
};
