import { studentService } from "@/api/adminStudentGroup";
import { useAdminList } from "./useAdminList";

export const useStudents = (query) => useAdminList(studentService.list, query);
