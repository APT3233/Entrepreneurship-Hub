import instance from "../instance";
import { compactQuery } from "../adminAcademic/utils";

const AdminLecturerApi = {
  getLecturers: (query = {}) => instance.get("/admin/lecturers", { params: compactQuery(query) }),
  getLecturer: (id) => instance.get(`/admin/lecturers/${id}`),
  createLecturer: (body) => instance.post("/admin/lecturers", body),
  updateLecturer: (id, body) => instance.put(`/admin/lecturers/${id}`, body),
  updateLecturerStatus: (id, status) => instance.patch(`/admin/lecturers/${id}/status`, { status }),
  updatePassword: (id, body) => instance.put(`/admin/lecturers/${id}/password`, body),
  deleteLecturer: (id) => instance.delete(`/admin/lecturers/${id}`),

  getOverview: (id) => instance.get(`/admin/lecturers/${id}/overview`),
  getProfile: (id) => instance.get(`/admin/lecturers/${id}/profile`),
  updateProfile: (id, body) => instance.put(`/admin/lecturers/${id}/profile`, body),
  getClasses: (id, query = {}) => instance.get(`/admin/lecturers/${id}/classes`, { params: compactQuery(query) }),
  assignClass: (id, body) => instance.post(`/admin/lecturers/${id}/classes/assign`, body),
  updateClassLecturer: (classId, body) => instance.patch(`/admin/classes/${classId}/lecturer`, body),

  getGrading: (id, query = {}) => instance.get(`/admin/lecturers/${id}/grading`, { params: compactQuery(query) }),
  getCreatedContent: (id) => instance.get(`/admin/lecturers/${id}/created-content`),
  getActivity: (id, query = {}) => instance.get(`/admin/lecturers/${id}/activity`, { params: compactQuery(query) }),
  getPermissions: (id) => instance.get(`/admin/lecturers/${id}/permissions`),

  getWorkload: (query = {}) => instance.get("/admin/lecturers/workload", { params: compactQuery(query) }),
  getAvailableClasses: (query = {}) => instance.get("/admin/lecturers/available-classes", { params: compactQuery(query) }),
  getLookups: () => instance.get("/admin/lecturers/lookups"),
};

export default AdminLecturerApi;
