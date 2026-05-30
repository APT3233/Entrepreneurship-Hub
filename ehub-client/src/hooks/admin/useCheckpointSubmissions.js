import { checkpointSubmissionService } from "@/api/adminProjectSubmission";
import { useAdminList } from "./useAdminList";

export const useCheckpointSubmissions = (query) => useAdminList(checkpointSubmissionService.list, query);
