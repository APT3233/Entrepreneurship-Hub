import instance from "./instance";

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
};

export default AssignmentApi;
