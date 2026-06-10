import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const basePath = "/admin/groups";

export const groupService = {
  list: (query = {}) => instance.get(basePath, { params: compactQuery(query) }),
  get: (id) => instance.get(`${basePath}/${id}`),
  create: (body) => instance.post(basePath, body),
  update: (id, body) => instance.put(`${basePath}/${id}`, body),
  remove: (id, query = {}) => instance.delete(`${basePath}/${id}`, { params: compactQuery(query) }),
  permanentRemove: (id) => instance.delete(`${basePath}/${id}`, { params: { permanent: true } }),
};

export default groupService;
