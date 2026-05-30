import { assignmentService } from "@/api/adminProjectSubmission";
import { useAdminList } from "./useAdminList";

export const useAdminAssignments = (query) => useAdminList(assignmentService.list, query);
