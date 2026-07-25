import { semesterService } from "@/api/adminAcademic";
import { useAdminList } from "./useAdminList";

export const useSemesters = (query) => useAdminList(semesterService.list, query);
