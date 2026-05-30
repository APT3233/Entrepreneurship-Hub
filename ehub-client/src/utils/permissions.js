import { getUserRoles } from "@/utils/role";
import { Roles } from "@/constants/roles";

export const checkPermission = (user, permissionCode) => {
  if (!permissionCode) return true;
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  if (permissions.includes(permissionCode)) return true;
  const roles = getUserRoles(user);
  return roles.includes(Roles.ADMIN) || roles.includes(Roles.DEPARTMENT_HEAD);
};
