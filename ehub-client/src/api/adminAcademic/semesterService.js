import instance from "../instance";
import { compactQuery } from "./utils";

const basePath = "/admin/academic/semesters";

export const semesterService = {
  list: (query = {}) => instance.get(basePath, { params: compactQuery(query) }),
  get: (id, query = {}) => instance.get(`${basePath}/${id}`, { params: compactQuery(query) }),
  create: (body) => instance.post(basePath, body),
  update: (id, body) => instance.put(`${basePath}/${id}`, body),
  updateStatus: (id, status) => instance.patch(`${basePath}/${id}/status`, { status }),
  setCurrent: (id) => instance.post(`${basePath}/${id}/set-current`),
};

export default semesterService;
