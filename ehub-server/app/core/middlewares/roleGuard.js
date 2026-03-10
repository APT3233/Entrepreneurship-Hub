import { Forbidden } from "../errors/errorFactory.js";

/**
 * Role Guard middleware — kiểm tra quyền truy cập theo role
 *
 * Sử dụng SAU authenticate middleware:
 *   router.post('/subjects', authenticate, roleGuard('teacher', 'department_head', 'admin'), controller.create)
 *
 * @param  {...string} allowedRoles — danh sách role được phép
 */
export const roleGuard =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!req.user || !req.user.roles || req.user.roles.length === 0) {
      return next(Forbidden("Access denied — no role assigned"));
    }

    const userRoles = req.user.roles.map((r) => r.toLowerCase());
    const allowed = allowedRoles.map((r) => r.toLowerCase());

    const hasPermission = userRoles.some((role) => allowed.includes(role));
    if (!hasPermission) {
      return next(
        Forbidden(
          `Access denied — requires one of: ${allowedRoles.join(", ")}`,
        ),
      );
    }

    next();
  };
