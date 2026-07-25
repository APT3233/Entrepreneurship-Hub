import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const basePath = "/admin/group-reports";

export const reportService = {
  list: (query = {}) => instance.get(basePath, { params: compactQuery(query) }),
  get: (id) => instance.get(`${basePath}/${id}`),
};

export default reportService;
