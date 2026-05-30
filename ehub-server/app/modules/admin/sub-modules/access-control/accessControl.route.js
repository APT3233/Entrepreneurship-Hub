import { Router } from "express";
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

  router.get("/users", validateRequest(listUsersSchema), adminAccessControlController.listUsers);
  router.post("/users", validateRequest(createUserSchema), adminAccessControlController.createUser);
  router.get("/users/:id", validateRequest(adminAccessControlIdParamSchema), adminAccessControlController.getUser);
  router.put("/users/:id", validateRequest(updateUserSchema), adminAccessControlController.updateUser);
  router.patch("/users/:id/status", validateRequest(updateUserStatusSchema), adminAccessControlController.updateUserStatus);
  router.put("/users/:id/roles", validateRequest(assignUserRolesSchema), adminAccessControlController.assignUserRoles);

  router.get("/roles", adminAccessControlController.listRoles);
  router.post("/roles", validateRequest(createRoleSchema), adminAccessControlController.createRole);
  router.get("/roles/:id", validateRequest(adminAccessControlIdParamSchema), adminAccessControlController.getRole);
  router.put("/roles/:id", validateRequest(updateRoleSchema), adminAccessControlController.updateRole);
  router.put("/roles/:id/permissions", validateRequest(assignRolePermissionsSchema), adminAccessControlController.assignRolePermissions);

  router.get("/permissions", validateRequest(listPermissionsSchema), adminAccessControlController.listPermissions);
  router.get("/permissions/:id", validateRequest(adminAccessControlIdParamSchema), adminAccessControlController.getPermission);

  router.get("/settings", validateRequest(listSettingsSchema), adminAccessControlController.listSettings);
  router.put("/settings/:id", validateRequest(updateSettingSchema), adminAccessControlController.updateSetting);

  return router;
};
