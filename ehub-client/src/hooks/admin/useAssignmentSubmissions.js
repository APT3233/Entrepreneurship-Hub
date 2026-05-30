import { assignmentSubmissionService } from "@/api/adminProjectSubmission";
import { useAdminList } from "./useAdminList";

export const useAssignmentSubmissions = (query) => useAdminList(assignmentSubmissionService.list, query);
