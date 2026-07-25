import { rubricService } from "@/api/adminEvaluationOps";
import { useAdminList } from "./useAdminList";

export const useRubrics = (query) => useAdminList(rubricService.list, query);
