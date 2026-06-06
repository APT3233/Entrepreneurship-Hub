export const Roles = Object.freeze({
  ADMIN: "admin",
  DEPARTMENT_HEAD: "department_head",
  LECTURER: "lecturer",
  MENTOR: "mentor",
  STUDENT: "student",
});

export const RoleHierarchy = Object.freeze({
  [Roles.ADMIN]: 100,
  [Roles.DEPARTMENT_HEAD]: 80,
  [Roles.LECTURER]: 60,
  [Roles.MENTOR]: 50,
  [Roles.STUDENT]: 30,
});

export const RoleDefaultRoute = Object.freeze({
  [Roles.ADMIN]: "/admin/dashboard",
  [Roles.DEPARTMENT_HEAD]: "/admin/dashboard",
  [Roles.LECTURER]: "/lecturer/dashboard",
  [Roles.MENTOR]: "/mentor/profile",
  [Roles.STUDENT]: "/student/dashboard",
});
