import Joi from "joi";

const studentItemSchema = Joi.object({
  classCode: Joi.string().max(50).allow(""),
  rollNumber: Joi.string().max(20).allow(""),
  email: Joi.string().email({ allowUnicode: false }).lowercase().required(),
  memberCode: Joi.string().max(50).required(),
  fullname: Joi.string().max(150).required(),
  major: Joi.string().max(100).allow(null, ""),
  status: Joi.string().valid("active", "inactive", "pending", "graduated", "suspended").default("inactive"),
});

export const createClassSchema = {
  body: Joi.object({
    subject_id: Joi.number().integer().positive(),
    semester_id: Joi.number().integer().positive(),
    class_code: Joi.string().max(50),
    class_name: Joi.string().max(200).allow(null, ""),
    lecturer_id: Joi.number().integer().positive().allow(null),
    max_students: Joi.number().integer().min(1).max(200).default(40),
    min_group_members: Joi.number().integer().min(1).max(20).default(4),
    max_group_members: Joi.number().integer().min(Joi.ref("min_group_members")).max(20).default(6),
    status: Joi.string().valid("draft", "active", "completed", "archived").default("draft"),
    subject: Joi.string().max(20),
    classSection: Joi.number().integer().min(1).max(99),
    year: Joi.number().integer().min(2000).max(3000),
    semester: Joi.number().integer().valid(1, 2, 3),
    monHoc: Joi.string().max(20),
    lop: Joi.number().integer().min(1).max(99),
    ky: Joi.number().integer().valid(1, 2, 3),
    students: Joi.object({
      list: Joi.array().items(studentItemSchema).default([]),
      summary: Joi.object().optional(),
    }).optional(),
  }).custom((value, helpers) => {
    const subjectCode = value.subject ?? value.monHoc;
    const section = value.classSection ?? value.lop;
    const sem = value.semester ?? value.ky;
    if (subjectCode != null) {
      if (value.year == null || sem == null || section == null) {
        return helpers.error("object.missing", { message: "subject requires year, semester, classSection" });
      }
    } else if (value.subject_id == null || value.semester_id == null || !value.class_code) {
      return helpers.error("object.missing", { message: "subject_id, semester_id, class_code required" });
    }
    return value;
  }),
};

export const updateClassSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    subject_id: Joi.number().integer().positive(),
    semester_id: Joi.number().integer().positive(),
    class_code: Joi.string().max(50),
    class_name: Joi.string().max(200).allow(null, ""),
    lecturer_id: Joi.number().integer().positive().allow(null),
    max_students: Joi.number().integer().min(1).max(200),
    min_group_members: Joi.number().integer().min(1).max(20),
    max_group_members: Joi.number()
      .integer()
      .min(Joi.ref("min_group_members"))
      .max(20),
    status: Joi.string().valid("draft", "active", "completed", "archived"),
  }).min(1),
};

export const listClassSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string(),
    status: Joi.string().valid("draft", "active", "completed", "archived"),
    subject_id: Joi.number().integer().positive(),
    year: Joi.number().integer().min(2000).max(3000).description("Filter by academic year"),
    semester_id: Joi.number().integer().positive().description("Filter by semester id"),
    semester_code: Joi.string().max(20).description("Filter by semester e.g. SP2026, SU2025, FA2025"),
    lecturerScope: Joi.string().valid("mine").description("Filter classes by current lecturer"),
  }),
};

export const statsClassSchema = {
  query: Joi.object({
    year: Joi.number().integer().min(2000).max(3000).description("Filter stats by academic year"),
    semester_id: Joi.number().integer().positive().allow(null).description("Filter stats by semester id"),
    semester_code: Joi.string().max(20).description("Filter stats by semester code"),
  }),
};

export const classParamsSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};
