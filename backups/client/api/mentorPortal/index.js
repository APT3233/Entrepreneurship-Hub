import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const MentorPortalApi = {
  getProfile: () => instance.get("/mentors/me"),
  updateProfile: (body) => instance.put("/mentors/me", body),
  getExpertiseAreas: (query = {}) => instance.get("/mentors/expertise-areas", { params: compactQuery(query) }),
  getExpertise: () => instance.get("/mentors/me/expertise"),
  replaceExpertise: (items) => instance.put("/mentors/me/expertise", { items }),
  getAvailability: () => instance.get("/mentors/me/availability"),
  replaceAvailability: (items) => instance.put("/mentors/me/availability", { items }),
  getDocuments: () => instance.get("/mentors/me/documents"),
  initiateDocumentUpload: (body) => instance.post("/mentors/me/documents/initiate-upload", body),
  confirmDocumentUpload: (uploadToken) => instance.post("/mentors/me/documents", { upload_token: uploadToken }),
  deleteDocument: (documentId) => instance.delete(`/mentors/me/documents/${documentId}`),
};

export default MentorPortalApi;
