import instance from "./instance";

const GroupApi = {
  /** Danh sách nhóm (query: page, limit, sort, lecturerScope: 'mine', status, class_id) */
  getList: async (query = {}) => {
    const response = await instance.get("/groups", { params: query });
    return response;
  },

  /** Chi tiết nhóm theo id */
  getById: async (id) => {
    const response = await instance.get(`/groups/${id}`);
    return response;
  },

  /** Tạo nhóm (body: class_id, group_code, group_name, description?, max_members?, status?) */
  create: async (body) => {
    const response = await instance.post("/groups", body);
    return response;
  },

  /** Thêm thành viên vào nhóm (body: student_id, role?: 'leader'|'member') */
  addMember: async (groupId, body) => {
    const response = await instance.post(`/groups/${groupId}/members`, body);
    return response;
  },

  /** Cập nhật thành viên (body: role?, status?) */
  updateMember: async (groupId, studentId, body) => {
    const response = await instance.patch(`/groups/${groupId}/members/${studentId}`, body);
    return response;
  },

  /** Xóa thành viên khỏi nhóm */
  removeMember: async (groupId, studentId) => {
    const response = await instance.delete(`/groups/${groupId}/members/${studentId}`);
    return response;
  },

  /** Lấy danh sách thành viên của nhóm */
  getMembers: async (groupId) => {
    const response = await instance.get(`/groups/${groupId}/members`);
    return response;
  },

  /** Cập nhật thông tin nhóm (body: group_name, category, topic, topic_desc, etc.) */
  update: async (id, body) => {
    const response = await instance.put(`/groups/${id}`, body);
    return response;
  },
};

export default GroupApi;
