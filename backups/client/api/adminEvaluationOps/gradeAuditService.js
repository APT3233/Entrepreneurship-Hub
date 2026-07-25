import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

export const gradeAuditService = {
  list: (query = {}) => instance.get("/admin/evaluation/grade-audit", { params: compactQuery(query) }),
};

export default gradeAuditService;
