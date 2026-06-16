import { groupService } from "@/api/adminStudentGroup";
import { useAdminList } from "./useAdminList";

export const useGroups = (query, options) => useAdminList(groupService.list, query, options);
