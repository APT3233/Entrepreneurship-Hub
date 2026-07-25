import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

export const evaluationResultService = {
  list: (query = {}) => instance.get("/admin/evaluation/results", { params: compactQuery(query) }),
};

export default evaluationResultService;
