import { inviteService } from "@/api/adminStudentGroup";
import { useAdminList } from "./useAdminList";

export const useGroupInvites = (query) => useAdminList(inviteService.list, query);
