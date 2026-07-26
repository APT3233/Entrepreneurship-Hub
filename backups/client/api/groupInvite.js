import instance from "./instance";

/** Lời mời nhóm — prefix /groups/invites */
const GroupInviteApi = {
  listPending: async () => {
    return instance.get("/groups/invites/pending");
  },

  preview: async (token) => {
    return instance.get(`/groups/invites/preview/${token}`);
  },

  accept: async (token) => {
    return instance.post(`/groups/invites/${token}/accept`);
  },

  decline: async (token) => {
    return instance.post(`/groups/invites/${token}/decline`);
  },
  report: async (token, payload) => {
    return instance.post(`/groups/invites/${token}/report`, payload);
  },
};

export default GroupInviteApi;
