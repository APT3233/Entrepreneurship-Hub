import { studentService } from "@/api/adminStudentGroup";
import { useAdminList } from "./useAdminList";

export const useStudents = (query, options) => useAdminList(studentService.list, query, options);
