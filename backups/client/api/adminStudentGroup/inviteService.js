import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const basePath = "/admin/group-invites";

export const inviteService = {
  list: (query = {}) => instance.get(basePath, { params: compactQuery(query) }),
  updateStatus: (id, status) => instance.patch(`${basePath}/${id}/status`, { status }),
  resend: (id) => instance.post(`${basePath}/${id}/resend`),
  revoke: (id) => instance.post(`${basePath}/${id}/revoke`),
  expire: (id) => instance.post(`${basePath}/${id}/expire`),
};

export default inviteService;
