import { invitationService } from "@/api/adminEvaluationOps";
import { useAdminList } from "./useAdminList";

export const useAdminInvitations = (query) => useAdminList(invitationService.list, query);
