export const Roles = Object.freeze({
  ADMIN: "admin",
  DEPARTMENT_HEAD: "department_head",
  TEACHER: "teacher",
  STUDENT: "student",
  GUEST: "guest",
});

export const RoleHierarchy = Object.freeze({
  [Roles.ADMIN]: 100,
  [Roles.DEPARTMENT_HEAD]: 80,
  [Roles.TEACHER]: 60,
  [Roles.STUDENT]: 30,
  [Roles.GUEST]: 10,
});

export const hasMinRole = (userRole, requiredRole) =>
  (RoleHierarchy[userRole] ?? 0) >= (RoleHierarchy[requiredRole] ?? Infinity);
