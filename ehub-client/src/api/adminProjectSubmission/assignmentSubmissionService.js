import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const basePath = "/admin/assignment-submissions";

export const assignmentSubmissionService = {
  list: (query = {}) => instance.get(basePath, { params: compactQuery(query) }),
  get: (id) => instance.get(`${basePath}/${id}`),
  grade: (id, body) => instance.post(`${basePath}/${id}/grade`, body),
};

export default assignmentSubmissionService;
