import { checkpointService } from "@/api/adminProjectSubmission";
import { useAdminList } from "./useAdminList";

export const useAdminCheckpoints = (query, options) => useAdminList(checkpointService.list, query, options);
