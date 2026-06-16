import { enrollmentService } from "@/api/adminStudentGroup";
import { useAdminList } from "./useAdminList";

export const useEnrollments = (query, options) => useAdminList(enrollmentService.list, query, options);
