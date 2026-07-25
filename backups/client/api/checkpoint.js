import instance from "./instance";
import axios from "axios";

const CheckpointApi = {
  getList: async (query = {}) => {
    const response = await instance.get("/checkpoints", { params: query });
    return response;
  },
  getById: async (id) => {
    const response = await instance.get(`/checkpoints/${id}`);
    return response;
  },
  create: async (body) => {
    const response = await instance.post("/checkpoints", body);
    return response;
  },
  createBulk: async (body) => {
    const response = await instance.post("/checkpoints/bulk", body);
    return response;
  },
  update: async (id, body) => {
    const response = await instance.put(`/checkpoints/${id}`, body);
    return response;
  },
   remove: async (id) => {
    const response = await instance.delete(`/checkpoints/${id}`);
    return response;
  },
  getSubmissions: async (id) => {
    const response = await instance.get(`/checkpoints/${id}/submissions`);
    return response;
  },
  getSubmissionDetail: async (id, groupId) => {
    const response = await instance.get(`/checkpoints/${id}/submissions/${groupId}`);
    return response;
  },
  updateGrade: async (id, groupId, body) => {
    const response = await instance.post(`/checkpoints/${id}/submissions/${groupId}/grade`, body);
    return response;
  },
  getByGroup: async (groupId) => {
    const response = await instance.get(`/checkpoints/group/${groupId}`);
    return response;
  },
  getMyAssignments: async (query = {}) => {
    const response = await instance.get("/checkpoints/mine", { params: query });
    return response;
  },
  /** Presigned URL upload: Step 1 — get presigned PUT URLs */
  initiateUpload: async (checkpointId, filesMeta) => {
    const response = await instance.post(`/checkpoints/${checkpointId}/upload`, {
      files: filesMeta.map(f => ({ name: f.name, size: f.size, type: f.type })),
    });
    return response;
  },
  /** Presigned URL upload: Step 2 — PUT file directly to MinIO */
  uploadFileToPresignedUrl: async (presignedUrl, file, onProgress) => {
    return axios.put(presignedUrl, file, {
      headers: { "Content-Type": file.type || "application/octet-stream" },
      onUploadProgress: onProgress,
    });
  },
  /** Presigned URL upload: Step 3 — confirm all files uploaded */
  confirmUpload: async (checkpointId, sessionId, note = "") => {
    const response = await instance.post(`/checkpoints/${checkpointId}/confirm-upload`, {
      session_id: sessionId,
      note,
    });
    return response;
  },
};

export default CheckpointApi;
