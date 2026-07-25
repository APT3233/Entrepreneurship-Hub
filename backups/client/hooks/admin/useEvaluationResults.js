import { evaluationResultService } from "@/api/adminEvaluationOps";
import { useAdminList } from "./useAdminList";

export const useEvaluationResults = (query) => useAdminList(evaluationResultService.list, query);
