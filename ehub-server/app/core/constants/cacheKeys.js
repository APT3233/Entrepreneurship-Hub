/**
 * Cache key patterns — prefix cho Redis
 */
export const CacheKeys = Object.freeze({
  USER: (id) => `user:${id}`,
  USER_BY_EMAIL: (email) => `user:email:${email}`,
  USER_LIST: (hash) => `users:list:${hash}`,

  SUBJECT: (id) => `subject:${id}`,
  SUBJECT_LIST: (hash) => `subjects:list:${hash}`,

  SEMESTER: (id) => `semester:${id}`,
  SEMESTER_LIST: (hash) => `semesters:list:${hash}`,

  CLASS: (id) => `class:${id}`,
  CLASS_LIST: (hash) => `classes:list:${hash}`,

  STUDENT: (id) => `student:${id}`,
  STUDENT_LIST: (hash) => `students:list:${hash}`,

  GROUP: (id) => `group:${id}`,
  GROUP_LIST: (hash) => `groups:list:${hash}`,

  SESSION: (userId) => `session:${userId}`,
  RATE_LIMIT: (ip) => `rate:${ip}`,
  FEATURE_FLAG: (flag) => `feature:${flag}`,
});
