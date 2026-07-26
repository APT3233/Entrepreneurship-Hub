import instance from "./instance";

const SemesterApi = {
  getList: async () => {
    const response = await instance.get("/semesters");
    return response.data;
  },
};


export default SemesterApi;