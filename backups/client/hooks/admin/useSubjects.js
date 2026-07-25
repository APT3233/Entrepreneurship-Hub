import { subjectService } from "@/api/adminAcademic";
import { useAdminList } from "./useAdminList";

export const useSubjects = (query) => useAdminList(subjectService.list, query);
