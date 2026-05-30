import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

export const rubricUsageService = {
  list: (query = {}) => instance.get("/admin/evaluation/rubric-usage", { params: compactQuery(query) }),
};

export default rubricUsageService;
