import { sendCreated, sendPaginated, sendSuccess } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createAdminAccessControlController = ({ adminAccessControlService }) => {
  const listUsers = catchAsync(async (req, res) => {
    const result = await adminAccessControlService.listUsers(req.query);
    return sendPaginated(res, { ...result, message: "Users retrieved successfully" });
  });

  const getUser = catchAsync(async (req, res) => {
    const data = await adminAccessControlService.getUser(req.params.id);
    return sendSuccess(res, { data, message: "User retrieved successfully" });
  });

  const createUser = catchAsync(async (req, res) => {
    const data = await adminAccessControlService.createUser(req.body, req.user);
    return sendCreated(res, { data, message: "User created successfully" });
  });

  const updateUser = catchAsync(async (req, res) => {
    const data = await adminAccessControlService.updateUser(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "User updated successfully" });
  });

  const updateUserStatus = catchAsync(async (req, res) => {
    const data = await adminAccessControlService.updateUserStatus(req.params.id, req.body.status, req.user);
    return sendSuccess(res, { data, message: "User status updated successfully" });
  });

  const assignUserRoles = catchAsync(async (req, res) => {
    const data = await adminAccessControlService.assignUserRoles(req.params.id, req.body.roles, req.user);
    return sendSuccess(res, { data, message: "User roles updated successfully" });
  });

  const listRoles = catchAsync(async (_req, res) => {
    const data = await adminAccessControlService.listRoles();
    return sendSuccess(res, { data, message: "Roles retrieved successfully" });
  });

  const getRole = catchAsync(async (req, res) => {
    const data = await adminAccessControlService.getRole(req.params.id);
    return sendSuccess(res, { data, message: "Role retrieved successfully" });
  });

  const createRole = catchAsync(async (req, res) => {
    const data = await adminAccessControlService.createRole(req.body, req.user);
    return sendCreated(res, { data, message: "Role created successfully" });
  });

  const updateRole = catchAsync(async (req, res) => {
    const data = await adminAccessControlService.updateRole(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Role updated successfully" });
  });

  const assignRolePermissions = catchAsync(async (req, res) => {
    const data = await adminAccessControlService.assignRolePermissions(req.params.id, req.body.permissions, req.user);
    return sendSuccess(res, { data, message: "Role permissions updated successfully" });
  });

  const listPermissions = catchAsync(async (req, res) => {
    const result = await adminAccessControlService.listPermissions(req.query);
    return sendPaginated(res, {
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      message: "Permissions retrieved successfully",
    });
  });

  const getPermission = catchAsync(async (req, res) => {
    const data = await adminAccessControlService.getPermission(req.params.id);
    return sendSuccess(res, { data, message: "Permission retrieved successfully" });
  });

  const listSettings = catchAsync(async (req, res) => {
    const result = await adminAccessControlService.listSettings(req.query);
    return sendPaginated(res, {
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      message: "Settings retrieved successfully",
    });
  });

  const updateSetting = catchAsync(async (req, res) => {
    const data = await adminAccessControlService.updateSetting(req.params.id, req.body, req.user);
    return sendSuccess(res, { data, message: "Setting updated successfully" });
  });

  return {
    listUsers,
    getUser,
    createUser,
    updateUser,
    updateUserStatus,
    assignUserRoles,
    listRoles,
    getRole,
    createRole,
    updateRole,
    assignRolePermissions,
    listPermissions,
    getPermission,
    listSettings,
    updateSetting,
  };
};
