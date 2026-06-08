export const userRoles = (user) => (user?.roles || []).map((role) => String(role).toLowerCase());

export const hasRole = (user, ...roles) => userRoles(user).some((role) => roles.includes(role));

export const isAdminLike = (user) => hasRole(user, "admin", "department_head");

export const hasPermission = (user, permission) => (user?.permissions || []).includes(permission);
