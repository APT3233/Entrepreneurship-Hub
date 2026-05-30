import { groupService } from "@/api/adminStudentGroup";
import { useAdminList } from "./useAdminList";

export const useGroups = (query) => useAdminList(groupService.list, query);
