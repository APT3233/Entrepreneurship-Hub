import { assignmentSubmissionService } from "@/api/adminProjectSubmission";
import { useAdminList } from "./useAdminList";

export const useAssignmentSubmissions = (query, options) => useAdminList(assignmentSubmissionService.list, query, options);
