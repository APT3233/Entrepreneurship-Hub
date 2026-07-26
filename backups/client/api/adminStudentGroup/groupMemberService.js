import instance from "../instance";

export const groupMemberService = {
  add: (groupId, body) => instance.post(`/admin/groups/${groupId}/members`, body),
  update: (groupId, studentId, body) => instance.patch(`/admin/groups/${groupId}/members/${studentId}`, body),
  remove: (groupId, studentId) => instance.delete(`/admin/groups/${groupId}/members/${studentId}`),
};

export default groupMemberService;
