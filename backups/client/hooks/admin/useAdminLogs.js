import { logService } from "@/api/adminEvaluationOps";
import { useAdminList } from "./useAdminList";

export const useAdminAuditLogs = (query) => useAdminList(logService.listAudit, query);
export const useAdminApiAccessLogs = (query) => useAdminList(logService.listApiAccess, query);
