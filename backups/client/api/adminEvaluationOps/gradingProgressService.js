import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

export const gradingProgressService = {
  list: (query = {}) => instance.get("/admin/evaluation/progress", { params: compactQuery(query) }),
};

export default gradingProgressService;
