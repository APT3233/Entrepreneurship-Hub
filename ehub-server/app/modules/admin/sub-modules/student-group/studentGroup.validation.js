import Joi from "joi";

const idParam = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

const groupMemberParam = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
    studentId: Joi.number().integer().positive().required(),
  }),
};

const classParam = {
  params: Joi.object({
    classId: Joi.number().integer().positive().required(),
  }),
};

const paginationQuery = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

const nullableId = Joi.number().integer().positive().allow(null, "");
const studentStatus = Joi.string().valid("active", "inactive", "graduated", "suspended", "pending");
const enrollmentStatus = Joi.string().valid("enrolled", "dropped", "completed");
const groupStatus = Joi.string().valid("forming", "active", "inactive", "completed", "dissolved");
const inviteStatus = Joi.string().valid("pending", "accepted", "declined", "expired", "revoked");
const memberRole = Joi.string().valid("leader", "member");
const memberStatus = Joi.string().valid("active", "left", "removed");

export const adminStudentGroupIdParamSchema = idParam;
export const adminGroupMemberParamSchema = groupMemberParam;

export const listAdminStudentsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    status: studentStatus.valid("", "active", "inactive", "graduated", "suspended", "pending").allow(""),
    major: Joi.string().max(100).allow(""),
    campus: Joi.string().max(50).allow(""),
    semester_id: Joi.number().integer().positive().allow(""),
    class_id: Joi.number().integer().positive().allow(""),
  }),
};

export const createAdminStudentSchema = {
  body: Joi.object({
    user_id: nullableId,
    student_code: Joi.string().max(20).required(),
    full_name: Joi.string().max(150).required(),
    email: Joi.string().email().max(150).required(),
    phone: Joi.string().max(20).allow(null, ""),
    major: Joi.string().max(100).allow(null, ""),
    campus: Joi.string().max(50).allow(null, ""),
    status: studentStatus.default("active"),
  }),
};

export const updateAdminStudentSchema = {
  ...idParam,
  body: Joi.object({
    user_id: nullableId,
    student_code: Joi.string().max(20),
    full_name: Joi.string().max(150),
    email: Joi.string().email().max(150),
    phone: Joi.string().max(20).allow(null, ""),
    major: Joi.string().max(100).allow(null, ""),
    campus: Joi.string().max(50).allow(null, ""),
    status: studentStatus,
  }).min(1),
};

export const listAdminEnrollmentsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    class_id: Joi.number().integer().positive().allow(""),
    semester_id: Joi.number().integer().positive().allow(""),
    subject_id: Joi.number().integer().positive().allow(""),
    status: enrollmentStatus.valid("", "enrolled", "dropped", "completed").allow(""),
  }),
};

export const createAdminEnrollmentSchema = {
  body: Joi.object({
    class_id: Joi.number().integer().positive().required(),
    student_id: Joi.number().integer().positive().required(),
    status: enrollmentStatus.default("enrolled"),
  }),
};

export const bulkCreateAdminEnrollmentSchema = {
  body: Joi.object({
    class_id: Joi.number().integer().positive().required(),
    student_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
  }),
};

export const bulkDeleteAdminStudentsSchema = {
  body: Joi.object({
    ids: Joi.array().items(Joi.number().integer().positive()).min(1).max(100).required(),
  }),
};

export const updateAdminEnrollmentStatusSchema = {
  ...idParam,
  body: Joi.object({
    status: enrollmentStatus.required(),
    force: Joi.boolean().default(false),
  }),
};

export const sendAdminEnrollmentInviteSchema = idParam;

export const listStudentsWithoutGroupSchema = classParam;

export const listAdminGroupsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    class_id: Joi.number().integer().positive().allow(""),
    semester_id: Joi.number().integer().positive().allow(""),
    category: Joi.string().max(100).allow(""),
    status: groupStatus.valid("", "forming", "active", "inactive", "completed", "dissolved").allow(""),
  }),
};

export const createAdminGroupSchema = {
  body: Joi.object({
    class_id: Joi.number().integer().positive().required(),
    group_code: Joi.string().max(50).required(),
    group_name: Joi.string().max(200).required(),
    description: Joi.string().allow(null, ""),
    category: Joi.string().max(100).allow(null, ""),
    topic: Joi.string().max(500).allow(null, ""),
    topic_desc: Joi.string().allow(null, ""),
    zalo_link: Joi.string().max(500).allow(null, ""),
    mentor_name: Joi.string().max(200).allow(null, ""),
    mentor_dept: Joi.string().max(200).allow(null, ""),
    max_members: Joi.number().integer().min(1).max(20),
    status: groupStatus.default("forming"),
  }),
};

export const deleteAdminGroupSchema = {
  ...idParam,
  query: Joi.object({
    permanent: Joi.boolean().truthy("true", "1").falsy("false", "0", "").default(false),
  }),
};

export const updateAdminGroupSchema = {
  ...idParam,
  body: Joi.object({
    class_id: Joi.number().integer().positive(),
    group_code: Joi.string().max(50),
    group_name: Joi.string().max(200),
    description: Joi.string().allow(null, ""),
    category: Joi.string().max(100).allow(null, ""),
    topic: Joi.string().max(500).allow(null, ""),
    topic_desc: Joi.string().allow(null, ""),
    zalo_link: Joi.string().max(500).allow(null, ""),
    mentor_name: Joi.string().max(200).allow(null, ""),
    mentor_dept: Joi.string().max(200).allow(null, ""),
    max_members: Joi.number().integer().min(1).max(20),
    status: groupStatus,
  }).min(1),
};

export const createAdminGroupMemberSchema = {
  ...idParam,
  body: Joi.object({
    student_id: Joi.number().integer().positive().required(),
    role: memberRole.default("member"),
  }),
};

export const updateAdminGroupMemberSchema = {
  ...groupMemberParam,
  body: Joi.object({
    role: memberRole,
    status: memberStatus,
  }).min(1),
};

export const listAdminGroupInvitesSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    group_id: Joi.number().integer().positive().allow(""),
    status: inviteStatus.valid("", "pending", "accepted", "declined", "expired", "revoked").allow(""),
  }),
};

export const updateAdminGroupInviteStatusSchema = {
  ...idParam,
  body: Joi.object({
    status: inviteStatus.required(),
  }),
};

export const listAdminGroupReportsSchema = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100).allow(""),
    group_id: Joi.number().integer().positive().allow(""),
    issue_type: Joi.string().valid("", "group_name", "category", "topic", "member", "other").allow(""),
  }),
};
