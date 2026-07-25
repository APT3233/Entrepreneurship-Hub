import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

export const logService = {
  listAudit: (query = {}) => instance.get("/admin/logs/audit", { params: compactQuery(query) }),
  listApiAccess: (query = {}) => instance.get("/admin/logs/api-access", { params: compactQuery(query) }),
  listImport: (query = {}) => instance.get("/admin/logs/import", { params: compactQuery(query) }),
};

export default logService;
