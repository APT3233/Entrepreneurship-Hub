import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const AdminMentorApi = {
  getMentors: (query = {}) => instance.get("/admin/mentors", { params: compactQuery(query) }),
  createMentor: (body) => instance.post("/admin/mentors", body),
  getMentor: (id) => instance.get(`/admin/mentors/${id}`),
  updateMentor: (id, body) => instance.put(`/admin/mentors/${id}`, body),
  updateMentorStatus: (id, status) => instance.patch(`/admin/mentors/${id}/status`, { status }),
  deleteMentor: (id) => instance.delete(`/admin/mentors/${id}`),

  getExpertiseAreas: (query = {}) => instance.get("/admin/mentor-expertise", { params: compactQuery(query) }),
  createExpertiseArea: (body) => instance.post("/admin/mentor-expertise", body),
  updateExpertiseArea: (id, body) => instance.put(`/admin/mentor-expertise/${id}`, body),
  deleteExpertiseArea: (id) => instance.delete(`/admin/mentor-expertise/${id}`),

  getMentorExpertise: (id) => instance.get(`/admin/mentors/${id}/expertise`),
  replaceMentorExpertise: (id, items) => instance.put(`/admin/mentors/${id}/expertise`, { items }),
  getMentorAvailability: (id) => instance.get(`/admin/mentors/${id}/availability`),
  replaceMentorAvailability: (id, items) => instance.put(`/admin/mentors/${id}/availability`, { items }),

  getMentorDocuments: (id) => instance.get(`/admin/mentors/${id}/documents`),
  getAllDocuments: (query = {}) => instance.get("/admin/mentor-documents", { params: compactQuery(query) }),
  initiateDocumentUpload: (id, body) => instance.post(`/admin/mentors/${id}/documents/initiate-upload`, body),
  confirmDocumentUpload: (id, uploadToken) => instance.post(`/admin/mentors/${id}/documents`, { upload_token: uploadToken }),
  deleteDocument: (id, documentId) => instance.delete(`/admin/mentors/${id}/documents/${documentId}`),
};

export default AdminMentorApi;
