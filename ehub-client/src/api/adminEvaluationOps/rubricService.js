import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const basePath = "/admin/evaluation/rubrics";

export const rubricService = {
  list: (query = {}) => instance.get(basePath, { params: compactQuery(query) }),
  get: (id) => instance.get(`${basePath}/${id}`),
  clone: (id, body = {}) => instance.post(`/evaluations/rubrics/${id}/clone`, body),
};

export default rubricService;
