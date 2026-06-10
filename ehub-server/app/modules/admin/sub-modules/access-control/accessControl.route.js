import { Router } from "express";
import { permissionGuard } from "app/core/middlewares/permissionGuard.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import {
  adminAccessControlIdParamSchema,
  assignRolePermissionsSchema,
  assignUserRolesSchema,
  createRoleSchema,
  createUserSchema,
  listPermissionsSchema,
  listSettingsSchema,
  listUsersSchema,
  updateRoleSchema,
  updateSettingSchema,
  updateUserSchema,
  updateUserStatusSchema,
} from "./accessControl.validation.js";

export const createAdminAccessControlRouter = (container) => {
  const { adminAccessControlController } = container.cradle;
  const router = Router();
  const adminOnly = roleGuard("admin");
  const can = (...permissions) => permissionGuard(container, ...permissions);

  router.get("/users", can("core.student.read", "core.lecturer.read", "mentor.profile.read"), validateRequest(listUsersSchema), adminAccessControlController.listUsers);
  router.post("/users", can("core.student.create", "core.lecturer.create", "mentor.profile.create"), validateRequest(createUserSchema), adminAccessControlController.createUser);
  router.get("/users/:id", can("core.student.read", "core.lecturer.read", "mentor.profile.read"), validateRequest(adminAccessControlIdParamSchema), adminAccessControlController.getUser);
  router.put("/users/:id", can("core.student.update", "core.lecturer.update", "mentor.profile.update"), validateRequest(updateUserSchema), adminAccessControlController.updateUser);
  router.patch("/users/:id/status", can("core.student.update", "core.lecturer.update", "mentor.profile.update"), validateRequest(updateUserStatusSchema), adminAccessControlController.updateUserStatus);
  router.put("/users/:id/roles", adminOnly, can("core.student.update", "core.lecturer.update", "mentor.profile.update"), validateRequest(assignUserRolesSchema), adminAccessControlController.assignUserRoles);

  router.get("/roles", adminOnly, adminAccessControlController.listRoles);
  router.post("/roles", adminOnly, validateRequest(createRoleSchema), adminAccessControlController.createRole);
  router.get("/roles/:id", adminOnly, validateRequest(adminAccessControlIdParamSchema), adminAccessControlController.getRole);
  router.put("/roles/:id", adminOnly, validateRequest(updateRoleSchema), adminAccessControlController.updateRole);
  router.put("/roles/:id/permissions", adminOnly, validateRequest(assignRolePermissionsSchema), adminAccessControlController.assignRolePermissions);

  router.get("/permissions", adminOnly, validateRequest(listPermissionsSchema), adminAccessControlController.listPermissions);
  router.get("/permissions/:id", adminOnly, validateRequest(adminAccessControlIdParamSchema), adminAccessControlController.getPermission);

  router.get("/settings", adminOnly, validateRequest(listSettingsSchema), adminAccessControlController.listSettings);
  router.put("/settings/:id", adminOnly, validateRequest(updateSettingSchema), adminAccessControlController.updateSetting);

  return router;
};
