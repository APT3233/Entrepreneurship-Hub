import { checkpointService } from "@/api/adminProjectSubmission";
import { useAdminList } from "./useAdminList";

export const useAdminCheckpoints = (query) => useAdminList(checkpointService.list, query);
