import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

export const adminEvaluationService = {
  overview: (query = {}) => instance.get("/admin/evaluation", { params: compactQuery(query) }),
  sessions: (query = {}) => instance.get("/admin/evaluation/sessions", { params: compactQuery(query) }),
  sessionDetail: (id) => instance.get(`/admin/evaluation/sessions/${id}`),
  confirmSession: (id, body = {}) => instance.post(`/admin/evaluation/sessions/${id}/confirm`, body),
  reopenSession: (id, body = {}) => instance.post(`/admin/evaluation/sessions/${id}/reopen`, body),
};

export default adminEvaluationService;
