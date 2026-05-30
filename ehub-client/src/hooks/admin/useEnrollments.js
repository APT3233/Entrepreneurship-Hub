import { enrollmentService } from "@/api/adminStudentGroup";
import { useAdminList } from "./useAdminList";

export const useEnrollments = (query) => useAdminList(enrollmentService.list, query);
