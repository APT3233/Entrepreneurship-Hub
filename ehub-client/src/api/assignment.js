import instance from "./instance";
import axios from "axios";

const AssignmentApi = {
  getList: async (query = {}) => {
    const response = await instance.get("/assignments", { params: query });
    return response;
  },
  getById: async (id) => {
    const response = await instance.get(`/assignments/${id}`);
    return response;
  },
  createBulk: async (body) => {
    const response = await instance.post("/assignments", body);
    return response;
  },
  update: async (id, body) => {
    const response = await instance.put(`/assignments/${id}`, body);
    return response;
  },
  updateStatus: async (id, status) => {
    const response = await instance.patch(`/assignments/${id}/status`, { status });
    return response;
  },
  remove: async (id) => {
    const response = await instance.delete(`/assignments/${id}`);
    return response;
  },
  initiateAttachmentUpload: async (file) => {
    const response = await instance.post("/assignments/initiate-upload", {
      file: { name: file.name, size: file.size, type: file.type },
    });
    return response;
  },
  uploadFileToPresignedUrl: async (uploadUrl, file, onProgress) => {
    return axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type || "application/octet-stream" },
      onUploadProgress: onProgress,
    });
  },
  confirmAttachmentUpload: async (uploadToken) => {
    const response = await instance.post("/assignments/confirm-upload", { upload_token: uploadToken });
    return response;
  },
  /** Nộp bài theo assignment (sinh viên) — presigned trực tiếp, ghi DB theo nhóm */
  initiateStudentSubmit: async (assignmentId, files) => {
    return instance.post(`/assignments/${assignmentId}/submit/initiate`, {
      files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    });
  },
  confirmStudentSubmit: async (assignmentId, sessionId) => {
    return instance.post(`/assignments/${assignmentId}/submit/confirm`, { session_id: sessionId });
  },
  getSubmissions: async (assignmentId) => {
    return instance.get(`/assignments/${assignmentId}/submissions`);
  },
  /** Chấm điểm + nhận xét theo nhóm (giảng viên) */
  gradeGroupSubmission: async (assignmentId, groupId, body) => {
    return instance.post(`/assignments/${assignmentId}/submissions/${groupId}/grade`, {
      score: body.score,
      feedback: body.feedback ?? "",
    });
  },
  initiateUpload: async (assignmentIdOrFile, maybeFiles) => {
    if (typeof assignmentIdOrFile === "number" && Array.isArray(maybeFiles)) {
      return AssignmentApi.initiateStudentSubmit(assignmentIdOrFile, maybeFiles);
    }
    return AssignmentApi.initiateAttachmentUpload(assignmentIdOrFile);
  },
  confirmUpload: async (assignmentIdOrUploadToken, maybeSessionId) => {
    if (typeof assignmentIdOrUploadToken === "number" && typeof maybeSessionId === "string") {
      return AssignmentApi.confirmStudentSubmit(assignmentIdOrUploadToken, maybeSessionId);
    }
    return AssignmentApi.confirmAttachmentUpload(assignmentIdOrUploadToken);
  },
  uploadAttachmentDirect: async (file, onProgress) => {
    const initRes = await AssignmentApi.initiateAttachmentUpload(file);
    const { uploadUrl, uploadToken } = initRes?.data || {};
    if (!uploadUrl || !uploadToken) {
      throw new Error("Không thể khởi tạo phiên upload");
    }

    await AssignmentApi.uploadFileToPresignedUrl(uploadUrl, file, onProgress);
    const confirmRes = await AssignmentApi.confirmAttachmentUpload(uploadToken);
    return confirmRes;
  },
};

export default AssignmentApi;
