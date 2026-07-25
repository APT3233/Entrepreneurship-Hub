import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const AdminAccessControlApi = {
  getUsers: (query = {}) => instance.get("/admin/users", { params: compactQuery(query) }),
  getUser: (id) => instance.get(`/admin/users/${id}`),
  createUser: (body) => instance.post("/admin/users", body),
  updateUser: (id, body) => instance.put(`/admin/users/${id}`, body),
  updateUserStatus: (id, status) => instance.patch(`/admin/users/${id}/status`, { status }),
  assignUserRoles: (id, roles) => instance.put(`/admin/users/${id}/roles`, { roles }),

  getRoles: () => instance.get("/admin/roles"),
  getRole: (id) => instance.get(`/admin/roles/${id}`),
  createRole: (body) => instance.post("/admin/roles", body),
  updateRole: (id, body) => instance.put(`/admin/roles/${id}`, body),
  assignRolePermissions: (id, permissions) => instance.put(`/admin/roles/${id}/permissions`, { permissions }),

  getPermissions: (query = {}) => instance.get("/admin/permissions", { params: compactQuery(query) }),
  getPermission: (id) => instance.get(`/admin/permissions/${id}`),

  getSettings: (query = {}) => instance.get("/admin/settings", { params: compactQuery(query) }),
  updateSetting: (id, settingValue) => instance.put(`/admin/settings/${id}`, { setting_value: settingValue }),
};

export default AdminAccessControlApi;
