export const Roles = Object.freeze({
  ADMIN: "admin",
  LECTURE: "lecture",
  STUDENT: "student",
});

export const RoleHierarchy = Object.freeze({
  [Roles.ADMIN]: 100,
  [Roles.LECTURE]: 60,
  [Roles.STUDENT]: 30,
});

export const RoleDefaultRoute = Object.freeze({
  [Roles.ADMIN]: "/lecture/dashboard",
  [Roles.LECTURE]: "/lecture/dashboard",
  [Roles.STUDENT]: "/student/dashboard",
});
