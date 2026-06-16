import { classService } from "@/api/adminAcademic";
import { useAdminList } from "./useAdminList";

export const useClasses = (query, options) => useAdminList(classService.list, query, options);
