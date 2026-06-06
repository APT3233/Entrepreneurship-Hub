import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const basePath = "/evaluations/rubrics";

export const rubricService = {
  list: (query = {}) => instance.get(basePath, { params: compactQuery(query) }),
  get: (id) => instance.get(`${basePath}/${id}`),
  create: (body) => instance.post(basePath, body),
  update: (id, body) => instance.put(`${basePath}/${id}`, body),
  remove: (id) => instance.delete(`${basePath}/${id}`),
  clone: (id, body = {}) => instance.post(`${basePath}/${id}/clone`, body),
  createCriterion: (rubricId, body) => instance.post(`${basePath}/${rubricId}/criteria`, body),
  updateCriterion: (rubricId, criterionId, body) => instance.put(`${basePath}/${rubricId}/criteria/${criterionId}`, body),
  deleteCriterion: (rubricId, criterionId) => instance.delete(`${basePath}/${rubricId}/criteria/${criterionId}`),
  bind: (rubricId, body) => instance.post(`${basePath}/${rubricId}/bindings`, body),
};

export default rubricService;
