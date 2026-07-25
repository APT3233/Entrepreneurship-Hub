import { reportService } from "@/api/adminStudentGroup";
import { useAdminList } from "./useAdminList";

export const useGroupReports = (query) => useAdminList(reportService.list, query);
