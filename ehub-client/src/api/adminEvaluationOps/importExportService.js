import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

export const importExportService = {
  listImportLogs: (query = {}) => instance.get("/admin/import-export/import-logs", { params: compactQuery(query) }),
  upload: () => instance.post("/admin/import-export/upload"),
  downloadTemplate: () => instance.post("/admin/import-export/template"),
  exportData: () => instance.post("/admin/import-export/export"),
};

export default importExportService;
