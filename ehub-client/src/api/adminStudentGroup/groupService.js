import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const basePath = "/admin/groups";

export const groupService = {
  list: (query = {}) => instance.get(basePath, { params: compactQuery(query) }),
  get: (id) => instance.get(`${basePath}/${id}`),
  create: (body) => instance.post(basePath, body),
  update: (id, body) => instance.put(`${basePath}/${id}`, body),
  remove: (id) => instance.delete(`${basePath}/${id}`),
};

export default groupService;
