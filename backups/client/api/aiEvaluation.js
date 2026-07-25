import instance from "./instance";
import { compactQuery } from "./adminAcademic/utils";

const AI_REQUEST_TIMEOUT_MS = 130000;
const aiRequestConfig = { timeout: AI_REQUEST_TIMEOUT_MS };

const aiEvaluationApi = {
  analyze: (body) => instance.post("/ai/evaluation/analyze", body, aiRequestConfig),
  getJob: (id) => instance.get(`/ai/evaluation/jobs/${id}`),
  getLatestSuggestion: (targetType, targetId) => instance.get(`/ai/evaluation/suggestions/${targetType}/${targetId}`),
  recordAction: (id, body) => instance.post(`/ai/evaluation/suggestions/${id}/actions`, body),
  adminListSuggestions: (query = {}) => instance.get("/admin/ai/evaluation-suggestions", { params: compactQuery(query) }),
  getSettings: () => instance.get("/admin/settings/ai"),
  listModels: (body) => instance.post("/admin/settings/ai/models", body, aiRequestConfig),
  testConnection: (body) => instance.post("/admin/settings/ai/test-connection", body, aiRequestConfig),
  testPrompt: (body) => instance.post("/admin/settings/ai/test-prompt", body, aiRequestConfig),
  testSettings: (body) => instance.post("/admin/settings/ai/test", body, aiRequestConfig),
  updateSettings: (body) => instance.put("/admin/settings/ai", body),
};

export default aiEvaluationApi;
