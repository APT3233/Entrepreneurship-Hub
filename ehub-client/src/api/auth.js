import instance from "@/api/instance";

const getBaseUrl = () => {
  const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:4444/api/v1";
  return base.endsWith("/") ? base.slice(0, -1) : base;
};

export const authApi = {
  login: (payload) => instance.post("auth/login", payload),
  me: () => instance.get("auth/me"),
  logout: () => instance.post("auth/logout"),
  getGoogleLoginUrl: () => `${getBaseUrl()}/auth/google`,
};
