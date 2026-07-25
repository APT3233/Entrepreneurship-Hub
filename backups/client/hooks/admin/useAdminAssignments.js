import { assignmentService } from "@/api/adminProjectSubmission";
import { useAdminList } from "./useAdminList";

export const useAdminAssignments = (query, options) => useAdminList(assignmentService.list, query, options);
