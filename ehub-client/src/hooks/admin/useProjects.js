import { projectService } from "@/api/adminProjectSubmission";
import { useAdminList } from "./useAdminList";

export const useProjects = (query) => useAdminList(projectService.list, query);
