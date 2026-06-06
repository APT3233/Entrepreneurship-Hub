import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const MentorWorkflowApi = {
  adminAssignments: (query = {}) => instance.get("/admin/mentor-assignments", { params: compactQuery(query) }),
  adminCreateAssignment: (body) => instance.post("/admin/mentor-assignments", body),
  adminGetAssignment: (id) => instance.get(`/admin/mentor-assignments/${id}`),
  adminUpdateAssignment: (id, body) => instance.put(`/admin/mentor-assignments/${id}`, body),
  adminUpdateAssignmentStatus: (id, body) => instance.patch(`/admin/mentor-assignments/${id}/status`, body),
  adminDeleteAssignment: (id) => instance.delete(`/admin/mentor-assignments/${id}`),
  adminGroupAssignments: (groupId) => instance.get(`/admin/groups/${groupId}/mentor-assignments`),
  adminCreateGroupAssignment: (groupId, body) => instance.post(`/admin/groups/${groupId}/mentor-assignments`, body),
  adminSessions: (query = {}) => instance.get("/admin/mentoring/sessions", { params: compactQuery(query) }),
  adminFeedbacks: (query = {}) => instance.get("/admin/mentoring/feedbacks", { params: compactQuery(query) }),
  adminActionItems: (query = {}) => instance.get("/admin/mentoring/action-items", { params: compactQuery({ ...query, item_status: query.status, status: undefined }) }),

  lecturerClassAssignments: (classId, query = {}) => instance.get(`/lecturer/classes/${classId}/mentor-assignments`, { params: compactQuery(query) }),
  lecturerSessions: (query = {}) => instance.get("/lecturer/mentoring/sessions", { params: compactQuery(query) }),
  lecturerClassSessions: (classId, query = {}) => instance.get(`/lecturer/classes/${classId}/mentoring-sessions`, { params: compactQuery(query) }),
  lecturerRequestMentor: (groupId, body) => instance.post(`/lecturer/groups/${groupId}/mentor-assignment-requests`, body),

  mentorAssignments: (query = {}) => instance.get("/mentor/assignments", { params: compactQuery(query) }),
  mentorRespondAssignment: (id, body) => instance.patch(`/mentor/assignments/${id}/respond`, body),
  mentorSessions: (query = {}) => instance.get("/mentor/sessions", { params: compactQuery(query) }),
  mentorCreateSession: (body) => instance.post("/mentor/sessions", body),
  mentorGetSession: (id) => instance.get(`/mentor/sessions/${id}`),
  mentorUpdateSession: (id, body) => instance.put(`/mentor/sessions/${id}`, body),
  mentorUpdateSessionStatus: (id, body) => instance.patch(`/mentor/sessions/${id}/status`, body),

  groupSessions: (groupId, query = {}) => instance.get(`/groups/${groupId}/mentoring-sessions`, { params: compactQuery(query) }),
  getSession: (id) => instance.get(`/mentoring-sessions/${id}`),
  addNote: (id, body) => instance.post(`/mentoring-sessions/${id}/notes`, body),
  getNotes: (id) => instance.get(`/mentoring-sessions/${id}/notes`),
  addFeedback: (id, body) => instance.post(`/mentoring-sessions/${id}/feedback`, body),
  getFeedback: (id) => instance.get(`/mentoring-sessions/${id}/feedback`),
  addActionItem: (id, body) => instance.post(`/mentoring-sessions/${id}/action-items`, body),
  updateActionItemStatus: (id, status) => instance.patch(`/mentoring-action-items/${id}/status`, { status }),
};

export default MentorWorkflowApi;
