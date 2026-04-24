import instance from "./instance";

const SubjectApi = {
  /** Danh sách môn học */
  list: async (params = {}) => {
    const response = await instance.get("/subjects", { params });
    return response;
  },

  /** Chi tiết môn học */
  getById: async (id) => {
    const response = await instance.get(`/subjects/${id}`);
    return response;
  },
};

export default SubjectApi;
