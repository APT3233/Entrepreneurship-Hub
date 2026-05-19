import instance from "@/api/instance";

const getBaseUrl = () => {
  const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:7777/api/v1";
  return base.endsWith("/") ? base.slice(0, -1) : base;
};

export const authApi = {
  login: (payload) => instance.post("auth/login", payload),
  me: () => instance.get("auth/me"),
  logout: () => instance.post("auth/logout"),
  getGoogleLoginUrl: () => `${getBaseUrl()}/auth/google`,
  googleSetupPreview: (token) => instance.get("auth/google/setup-preview", { params: { token } }),
  completeGoogleSetup: (data) => instance.post("auth/google/complete-setup", data),
  activatePreview: (token) => instance.get("auth/activate", { params: { token } }),
  activate: (payload) => instance.post("auth/activate", payload),
  updateProfile: (payload) => instance.put("auth/me", payload),
  changePassword: (payload) => instance.put("auth/change-password", payload),
  getActivities: (params) => instance.get("audit/me", { params }),
};
