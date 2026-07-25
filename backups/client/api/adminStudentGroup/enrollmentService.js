import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const basePath = "/admin/enrollments";

export const enrollmentService = {
  list: (query = {}) => instance.get(basePath, { params: compactQuery(query) }),
  create: (body) => instance.post(basePath, body),
  bulkCreate: (body) => instance.post(`${basePath}/bulk`, body),
  updateStatus: (id, status, force = false) => instance.patch(`${basePath}/${id}/status`, { status, force }),
  sendInvite: (id) => instance.post(`${basePath}/${id}/send-invite`),
  listStudentsWithoutGroup: (classId) => instance.get(`/admin/classes/${classId}/students-without-group`),
};

export default enrollmentService;
