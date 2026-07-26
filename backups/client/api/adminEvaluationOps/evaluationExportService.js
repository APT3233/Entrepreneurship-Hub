import instance from "../instance";

export const evaluationExportService = {
  options: () => instance.get("/admin/evaluation/exports"),
  exportScores: (body) => instance.post("/admin/evaluation/exports", body),
};

export default evaluationExportService;
