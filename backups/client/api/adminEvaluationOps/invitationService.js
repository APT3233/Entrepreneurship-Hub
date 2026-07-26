import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const basePath = "/admin/invitations";

export const invitationService = {
  list: (query = {}) => instance.get(basePath, { params: compactQuery(query) }),
  resend: (type, id) => instance.post(`${basePath}/${type}/${id}/resend`),
  revoke: (type, id) => instance.post(`${basePath}/${type}/${id}/revoke`),
  retryEmailEvent: (id) => instance.post(`${basePath}/email-event/${id}/retry`),
};

export default invitationService;
