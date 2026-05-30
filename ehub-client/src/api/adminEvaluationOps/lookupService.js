import instance from "../instance";

export const evaluationLookupService = {
  getAll: () => instance.get("/admin/evaluation/lookups"),
};

export default evaluationLookupService;
