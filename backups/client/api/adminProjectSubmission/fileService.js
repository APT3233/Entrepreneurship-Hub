import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const basePath = "/admin/submission-files";

export const fileService = {
  list: (query = {}) => instance.get(basePath, { params: compactQuery(query) }),
  remove: (source, id) => instance.patch(`${basePath}/${source}/${id}/delete`),
  restore: (source, id) => instance.patch(`${basePath}/${source}/${id}/restore`),
};

export default fileService;
