import { classService } from "@/api/adminAcademic";
import { useAdminList } from "./useAdminList";

export const useClasses = (query) => useAdminList(classService.list, query);
