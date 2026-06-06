import { Forbidden } from "app/core/errors/errorFactory.js";

const normalize = (value) => String(value || "").trim().toLowerCase();

const loadPermissions = async (db, userId) => {
  const [rows] = await db.execute(
    `
      SELECT DISTINCT p.permission_code
      FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = :userId
    `,
    { userId: Number(userId) },
  );
  return rows.map((row) => normalize(row.permission_code)).filter(Boolean);
};

export const permissionGuard = (container, ...requiredPermissions) => async (req, _res, next) => {
  const required = requiredPermissions.map(normalize).filter(Boolean);
  if (!required.length) return next();
  if (!req.user?.id) return next(Forbidden("Access denied"));

  try {
    const permissions = await loadPermissions(container.cradle.db, req.user.id);
    req.user.permissions = permissions;
    const allowed = required.some((permission) => permissions.includes(permission));
    if (!allowed) {
      return next(Forbidden(`Access denied — requires permission: ${requiredPermissions.join(" or ")}`));
    }
    return next();
  } catch (err) {
    return next(err);
  }
};
