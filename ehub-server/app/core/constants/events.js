/**
 * Domain events — dùng cho messaging (Redis PubSub)
 */
export const Events = Object.freeze({
  // User
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  USER_LOGIN: "user.login",
  USER_LOGOUT: "user.logout",

  // Subject
  SUBJECT_CREATED: "subject.created",
  SUBJECT_UPDATED: "subject.updated",
  SUBJECT_DELETED: "subject.deleted",

  // Semester
  SEMESTER_CREATED: "semester.created",
  SEMESTER_UPDATED: "semester.updated",
  SEMESTER_DELETED: "semester.deleted",

  // Class
  CLASS_CREATED: "class.created",
  CLASS_UPDATED: "class.updated",
  CLASS_DELETED: "class.deleted",

  // Student
  STUDENT_CREATED: "student.created",
  STUDENT_UPDATED: "student.updated",
  STUDENT_DELETED: "student.deleted",
  STUDENT_IMPORTED: "student.imported",

  // Enrollment
  ENROLLMENT_ADDED: "enrollment.added",
  ENROLLMENT_REMOVED: "enrollment.removed",

  // Group
  GROUP_CREATED: "group.created",
  GROUP_UPDATED: "group.updated",
  GROUP_DELETED: "group.deleted",

  // Group Member
  GROUP_MEMBER_ADDED: "group_member.added",
  GROUP_MEMBER_REMOVED: "group_member.removed",

  // System
  CACHE_INVALIDATED: "cache.invalidated",
  NOTIFICATION_SEND: "notification.send",
  AUDIT_LOG: "audit.log",
});
