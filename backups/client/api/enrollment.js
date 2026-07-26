import instance from "./instance";

const EnrollmentApi = {
  /** Danh sách sinh viên trong lớp */
  getByClass: async (classId) => {
    const response = await instance.get(`/classes/${classId}/enrollments`);
    return response;
  },

  /** Thêm sinh viên vào lớp (payload: { student_id } hoặc { student_code, full_name, email, major }) */
  enroll: async (classId, payload) => {
    const response = await instance.post(`/classes/${classId}/enrollments`, payload);
    return response;
  },

  /** Xóa sinh viên khỏi lớp */
  unenroll: async (classId, studentId) => {
    const response = await instance.delete(`/classes/${classId}/enrollments/${studentId}`);
    return response;
  },

  /** Cập nhật thông tin sinh viên trong lớp */
  update: async (classId, studentId, payload) => {
    const response = await instance.put(`/classes/${classId}/enrollments/${studentId}`, payload);
    return response;
  },
};

export default EnrollmentApi;
