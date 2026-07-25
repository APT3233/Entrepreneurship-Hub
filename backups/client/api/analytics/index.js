import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

export const analyticsService = {
  overview: (query = {}) => instance.get("/analytics/overview", { params: compactQuery(query) }),
  academicQuality: (query = {}) => instance.get("/analytics/academic-quality", { params: compactQuery(query) }),
  grading: (query = {}) => instance.get("/analytics/grading", { params: compactQuery(query) }),
  rubric: (query = {}) => instance.get("/analytics/rubric", { params: compactQuery(query) }),
  projects: (query = {}) => instance.get("/analytics/projects", { params: compactQuery(query) }),
  lecturer: (query = {}) => instance.get("/lecturer/analytics", { params: compactQuery(query) }),
  classAnalytics: (classId, query = {}) => instance.get(`/classes/${classId}/analytics`, { params: compactQuery(query) }),
};

export default analyticsService;
