import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const basePath = "/admin/projects";

export const projectService = {
  list: (query = {}) => instance.get(basePath, { params: compactQuery(query) }),
  get: (id) => instance.get(`${basePath}/${id}`),
  update: (id, body) => instance.put(`${basePath}/${id}`, body),
};

export default projectService;
