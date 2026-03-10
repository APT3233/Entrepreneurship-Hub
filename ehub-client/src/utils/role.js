import { RoleDefaultRoute, RoleHierarchy, Roles } from "@/constants/roles";

const normalizeRole = (role) => String(role || "").trim().toLowerCase();
const RoleAlias = Object.freeze({ teacher: Roles.LECTURE, department_head: Roles.LECTURE });

export const getUserRoles = (user) => {
  if (!user) return [];
  const rawRoles = Array.isArray(user.roles) && user.roles.length ? user.roles : user.role ? [user.role] : [];
  return rawRoles.map((role) => RoleAlias[normalizeRole(role)] || normalizeRole(role)).filter(Boolean);
};

export const hasRole = (user, role) => {
  const target = normalizeRole(role);
  return getUserRoles(user).includes(target);
};

export const hasAnyRole = (user, allowedRoles = []) => {
  if (!allowedRoles.length) return true;
  const allowed = allowedRoles.map(normalizeRole);
  return getUserRoles(user).some((role) => allowed.includes(role));
};

export const getHighestRole = (user) => {
  const roles = getUserRoles(user);
  if (!roles.length) return null;
  return roles.reduce((bestRole, currentRole) => (RoleHierarchy[currentRole] || 0) > (RoleHierarchy[bestRole] || 0) ? currentRole : bestRole, roles[0]);
};

export const getDefaultRouteForUser = (user) => {
  const highestRole = getHighestRole(user);
  if (!highestRole) return "/auth/login";
  return RoleDefaultRoute[highestRole] || RoleDefaultRoute[Roles.STUDENT];
};
