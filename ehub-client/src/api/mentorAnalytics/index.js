import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const MentorAnalyticsApi = {
  overview: (query = {}) => instance.get("/admin/mentor-analytics/overview", { params: compactQuery(query) }),
  workload: (query = {}) => instance.get("/admin/mentor-analytics/workload", { params: compactQuery(query) }),
  effectiveness: (query = {}) => instance.get("/admin/mentor-analytics/effectiveness", { params: compactQuery(query) }),
  matching: (query = {}) => instance.get("/admin/mentor-analytics/matching", { params: compactQuery(query) }),
  expertise: (query = {}) => instance.get("/admin/mentor-analytics/expertise-heatmap", { params: compactQuery(query) }),
  groupSupport: (query = {}) => instance.get("/admin/mentor-analytics/group-support", { params: compactQuery(query) }),
  ecosystem: (query = {}) => instance.get("/admin/mentor-analytics/ecosystem", { params: compactQuery(query) }),
  lecturerDashboard: (query = {}) => instance.get("/lecturer/mentor-analytics", { params: compactQuery(query) }),
  mentorDashboard: () => instance.get("/mentor/dashboard"),
};

export default MentorAnalyticsApi;
