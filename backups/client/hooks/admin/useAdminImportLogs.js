import { importExportService, logService } from "@/api/adminEvaluationOps";
import { useAdminList } from "./useAdminList";

export const useAdminImportLogs = (query) => useAdminList(importExportService.listImportLogs, query);
export const useAdminImportLogView = (query) => useAdminList(logService.listImport, query);
