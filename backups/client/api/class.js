import instance from "./instance";

const ClassApi = {
  /** Danh sách lớp (query: page, limit, sort, lecturerScope: 'mine', year, semester_code, ...) */
  getList: async (query = {}) => {
    const response = await instance.get("/classes", { params: query });
    return response;
  },

  /** Thống kê dashboard lecturer: { classCount, groupCount, assignmentCount, needGradingCount }. query.year/semester_code tùy chọn */
  getStats: async (query = {}) => {
    const response = await instance.get("/classes/stats", { params: query });
    return response;
  },
  
  /** Thống kê dashboard student: { checkpointStats, group } */
  getStudentStats: async () => {
    const response = await instance.get("/classes/student-stats");
    return response;
  },

  /** Chi tiết lớp cho trang ClassDetail: thông tin lớp + stats + groups + students */
  getOverview: async (id) => {
    const response = await instance.get(`/classes/${id}/overview`);
    return response;
  },

  /** Tạo lớp mới (có thể kèm danh sách sinh viên bulk). Body: subject, classSection, year, semester, students: { list } hoặc subject_id, semester_id, class_code */
  create: async (body) => {
    const response = await instance.post("/classes", body);
    return response;
  },

  /** Cập nhật thông tin lớp học */
  update: async (id, body) => {
    const response = await instance.put(`/classes/${id}`, body);
    return response;
  },

  /** Xóa lớp học (chỉ cho phép nếu học kỳ sắp diễn ra) */
  remove: async (id) => {
    const response = await instance.delete(`/classes/${id}`);
    return response;
  },
};

export default ClassApi;
