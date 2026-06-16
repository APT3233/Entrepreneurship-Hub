import { checkpointSubmissionService } from "@/api/adminProjectSubmission";
import { useAdminList } from "./useAdminList";

export const useCheckpointSubmissions = (query, options) => useAdminList(checkpointSubmissionService.list, query, options);
