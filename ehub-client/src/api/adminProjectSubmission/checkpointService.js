import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const basePath = "/admin/checkpoints";

export const checkpointService = {
  list: (query = {}) => instance.get(basePath, { params: compactQuery(query) }),
  get: (id) => instance.get(`${basePath}/${id}`),
  create: (body) => instance.post(basePath, body),
  update: (id, body) => instance.put(`${basePath}/${id}`, body),
  updateStatus: (id, status) => instance.patch(`${basePath}/${id}/status`, { status }),
  duplicate: (id) => instance.post(`${basePath}/${id}/duplicate`),
};

export default checkpointService;
