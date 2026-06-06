import bcrypt from "bcryptjs";
import { AlreadyExists, BadRequest, NotFound } from "app/core/errors/errorFactory.js";
import { parsePagination } from "app/core/utils/pagination.js";

const normalizeCode = (value) => String(value || "").trim().toLowerCase();

const STUDENT_ROLE = "student";
const STAFF_ROLES = new Set(["lecturer", "admin"]);

const assertRoleAssignmentAllowed = (roleCodes, user = null) => {
  const codes = (roleCodes || []).map(normalizeCode).filter(Boolean);
  const hasStudent = codes.includes(STUDENT_ROLE);
  const hasStaff = codes.some((code) => STAFF_ROLES.has(code));

  if (hasStudent && hasStaff) {
    throw BadRequest("Một người dùng không thể vừa là Sinh viên vừa là Giảng viên hoặc Quản trị viên.");
  }

  if (user) {
    const userRoles = Array.isArray(user.roles) ? user.roles.map(normalizeCode) : [];
    const isStudentAccount =
      user.is_student_goc === true || userRoles.includes(STUDENT_ROLE);
    const isStaffAccount =
      user.is_lecturer_goc === true ||
      userRoles.some((code) => STAFF_ROLES.has(code));

    if (isStudentAccount && hasStaff) {
      throw BadRequest("Tài khoản Sinh viên không thể được gán vai trò Giảng viên hoặc Quản trị viên.");
    }
    if (isStaffAccount && hasStudent) {
      throw BadRequest("Tài khoản Giảng viên hoặc Quản trị viên không thể được gán vai trò Sinh viên.");
    }
  }
};

export const createAdminAccessControlService = ({ adminAccessControlRepository, transaction, auditService, tokenService }) => {
  const pageArgs = (query) => parsePagination({
    page: query.page,
    limit: query.limit,
  });

  const listUsers = async (query) => {
    const pagination = pageArgs(query);
    const result = await adminAccessControlRepository.listUsers({
      search: query.search?.trim() || null,
      status: query.status || null,
      role: query.role || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getUser = async (id) => {
    const user = await adminAccessControlRepository.findUserById(id);
    if (!user) throw NotFound("User");
    return user;
  };

  const createUser = async (data, actor) => {
    if (await adminAccessControlRepository.findUserByEmail(data.email)) throw AlreadyExists("Email đã tồn tại");
    if (await adminAccessControlRepository.findUserByUsername(data.username)) throw AlreadyExists("Username đã tồn tại");
    const password = await bcrypt.hash(data.password, 12);
    const roleCodes = (data.roles || []).map(normalizeCode).filter(Boolean);
    assertRoleAssignmentAllowed(roleCodes);

    const id = await transaction.run(async (conn) => {
      const userId = await adminAccessControlRepository.createUser({
        username: data.username.trim(),
        email: data.email.trim(),
        password,
        full_name: data.full_name.trim(),
        phone: data.phone || null,
        campus: data.campus || null,
        avatar_url: data.avatar_url || null,
        auth_provider: "local",
        status: data.status || "active",
      }, conn);
      await adminAccessControlRepository.replaceUserRoles(userId, roleCodes, actor?.id, conn);
      return userId;
    });

    await auditService.log({
      userId: actor?.id || null,
      action: "admin_create_user",
      tableName: "users",
      recordId: id,
      title: data.username,
      newValues: { email: data.email, roles: roleCodes },
    });
    return getUser(id);
  };

  const updateUser = async (id, data, actor) => {
    await getUser(id);
    if (data.email && await adminAccessControlRepository.findUserByEmail(data.email, id)) {
      throw AlreadyExists("Email đã tồn tại");
    }
    if (data.username && await adminAccessControlRepository.findUserByUsername(data.username, id)) {
      throw AlreadyExists("Username đã tồn tại");
    }
    const allowed = ["username", "email", "full_name", "phone", "campus", "avatar_url", "status"];
    const updates = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updates[key] = data[key] === "" ? null : data[key];
    }
    if (updates.username) updates.username = String(updates.username).trim();
    if (updates.email) updates.email = String(updates.email).trim();
    if (updates.full_name) updates.full_name = String(updates.full_name).trim();
    await adminAccessControlRepository.updateUser(id, updates);
    if (updates.status === "locked" || updates.status === "inactive") {
      await tokenService.revokeAllTokens(id);
    }
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_user",
      tableName: "users",
      recordId: id,
      newValues: updates,
    });
    return getUser(id);
  };

  const updateUserStatus = async (id, status, actor) => {
    await getUser(id);
    await adminAccessControlRepository.updateUser(id, { status });
    if (status === "locked" || status === "inactive") {
      await tokenService.revokeAllTokens(id);
    }
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_user_status",
      tableName: "users",
      recordId: id,
      newValues: { status },
    });
    return getUser(id);
  };

  const assignUserRoles = async (id, roles, actor) => {
    const user = await getUser(id);
    const roleCodes = (roles || []).map(normalizeCode).filter(Boolean);
    assertRoleAssignmentAllowed(roleCodes, user);
    await adminAccessControlRepository.replaceUserRoles(id, roleCodes, actor?.id);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_assign_user_roles",
      tableName: "user_roles",
      recordId: id,
      newValues: { roles: roleCodes },
    });
    return getUser(id);
  };

  const listRoles = () => adminAccessControlRepository.listRoles();

  const getRole = async (id) => {
    const role = await adminAccessControlRepository.findRoleById(id);
    if (!role) throw NotFound("Role");
    return role;
  };

  const createRole = async (data, actor) => {
    const roleCode = normalizeCode(data.role_code);
    if (await adminAccessControlRepository.findRoleByCode(roleCode)) throw AlreadyExists("Role code đã tồn tại");
    const id = await adminAccessControlRepository.createRole({
      role_code: roleCode,
      role_name: data.role_name.trim(),
      description: data.description || null,
      is_system: 0,
    });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_create_role",
      tableName: "roles",
      recordId: id,
      title: roleCode,
      newValues: { role_code: roleCode },
    });
    return getRole(id);
  };

  const updateRole = async (id, data, actor) => {
    const role = await getRole(id);
    const updates = {};
    if (data.role_name !== undefined) updates.role_name = data.role_name.trim();
    if (data.description !== undefined) updates.description = data.description || null;
    if (data.role_code !== undefined) {
      if (role.is_system) throw BadRequest("Không được đổi mã role hệ thống");
      const roleCode = normalizeCode(data.role_code);
      if (await adminAccessControlRepository.findRoleByCode(roleCode, id)) throw AlreadyExists("Role code đã tồn tại");
      updates.role_code = roleCode;
    }
    await adminAccessControlRepository.updateRole(id, updates);
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_role",
      tableName: "roles",
      recordId: id,
      title: role.role_code,
      newValues: updates,
    });
    return getRole(id);
  };

  const assignRolePermissions = async (id, permissions, actor) => {
    const role = await getRole(id);
    await adminAccessControlRepository.replaceRolePermissions(id, (permissions || []).filter(Boolean));
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_assign_role_permissions",
      tableName: "role_permissions",
      recordId: id,
      title: role.role_code,
      newValues: { permissions },
    });
    return getRole(id);
  };

  const listPermissions = async (query) => {
    const pagination = pageArgs(query);
    const [result, modules] = await Promise.all([
      adminAccessControlRepository.listPermissions({
        search: query.search?.trim() || null,
        module: query.module || null,
        limit: pagination.limit,
        offset: pagination.offset,
      }),
      adminAccessControlRepository.listPermissionModules(),
    ]);
    return { data: result.rows, modules, ...pagination, total: result.total };
  };

  const getPermission = async (id) => {
    const permission = await adminAccessControlRepository.findPermissionById(id);
    if (!permission) throw NotFound("Permission");
    return permission;
  };

  const listSettings = async (query) => {
    const pagination = pageArgs(query);
    const [result, modules] = await Promise.all([
      adminAccessControlRepository.listSettings({
        search: query.search?.trim() || null,
        module: query.module || null,
        limit: pagination.limit,
        offset: pagination.offset,
      }),
      adminAccessControlRepository.listSettingModules(),
    ]);
    return { data: result.rows, modules, ...pagination, total: result.total };
  };

  const normalizeSettingValue = (value, dataType) => {
    const raw = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "");
    if (dataType === "integer") {
      if (!/^-?\d+$/.test(raw.trim())) throw BadRequest("Giá trị phải là số nguyên");
      return String(Number(raw));
    }
    if (dataType === "boolean") {
      const v = raw.trim().toLowerCase();
      if (!["true", "false", "1", "0"].includes(v)) throw BadRequest("Giá trị boolean phải là true/false");
      return v === "true" || v === "1" ? "true" : "false";
    }
    if (dataType === "json") {
      try {
        return JSON.stringify(JSON.parse(raw));
      } catch {
        throw BadRequest("Giá trị JSON không hợp lệ");
      }
    }
    return raw;
  };

  const updateSetting = async (id, data, actor) => {
    const setting = await adminAccessControlRepository.findSettingById(id);
    if (!setting) throw NotFound("Setting");
    const settingValue = normalizeSettingValue(data.setting_value, setting.data_type);
    await adminAccessControlRepository.updateSetting(id, {
      setting_value: settingValue,
      updated_by: actor?.id || null,
    });
    await auditService.log({
      userId: actor?.id || null,
      action: "admin_update_setting",
      tableName: "system_settings",
      recordId: id,
      title: setting.setting_key,
      newValues: { setting_value: settingValue },
    });
    return adminAccessControlRepository.findSettingById(id);
  };

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
