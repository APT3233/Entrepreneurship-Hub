export const Roles = Object.freeze({
  ADMIN: "admin",
  LECTURER: "lecturer",
  STUDENT: "student",
});

export const RoleHierarchy = Object.freeze({
  [Roles.ADMIN]: 100,
  [Roles.LECTURER]: 60,
  [Roles.STUDENT]: 30,
});

export const RoleDefaultRoute = Object.freeze({
  [Roles.ADMIN]: "/lecturer/dashboard",
  [Roles.LECTURER]: "/lecturer/dashboard",
  [Roles.STUDENT]: "/student/dashboard",
});
