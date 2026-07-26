import { projectService } from "@/api/adminProjectSubmission";
import { useAdminList } from "./useAdminList";

export const useProjects = (query, options) => useAdminList(projectService.list, query, options);
