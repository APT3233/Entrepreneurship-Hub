import { fileService } from "@/api/adminProjectSubmission";
import { useAdminList } from "./useAdminList";

export const useSubmissionFiles = (query) => useAdminList(fileService.list, query);
