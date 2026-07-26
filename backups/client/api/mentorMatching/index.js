import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const MentorMatchingApi = {
  listRequests: (query = {}) => instance.get("/mentor-matching/requests", { params: compactQuery(query) }),
  createRequest: (body) => instance.post("/mentor-matching/requests", body),
  getRequest: (id) => instance.get(`/mentor-matching/requests/${id}`),
  generate: (id, body = {}) => instance.post(`/mentor-matching/requests/${id}/generate`, body),
  suggestions: (id) => instance.get(`/mentor-matching/requests/${id}/suggestions`),
  recordAction: (id, body) => instance.post(`/mentor-matching/suggestions/${id}/actions`, body),
  convertToAssignment: (id, body) => instance.post(`/mentor-matching/suggestions/${id}/convert-to-assignment`, body),
};

export default MentorMatchingApi;
