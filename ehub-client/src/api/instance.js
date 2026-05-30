import axios from "axios";
import { store } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { API_ERROR_ACCOUNT_LOCKED } from "@/constants/apiErrors";

const rawBaseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:7777/api/v1";
const BASE_URL = rawBaseUrl.endsWith("/") ? rawBaseUrl : `${rawBaseUrl}/`;

const instance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
  // Send & receive httpOnly cookies on every request
  withCredentials: true,
});

// ── Response interceptor: unwrap data + auto refresh token ───────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

instance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";

    // Chỉ không retry khi 401 ở login hoặc chính refresh-token (tránh vòng lặp)
    // auth/me 401 vẫn retry: gọi refresh-token rồi retry auth/me để restore session sau reload
    const isAuthEndpoint =
      requestUrl.includes("auth/login") ||
      requestUrl.includes("auth/refresh-token") ||
      requestUrl.includes("auth/activate");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => instance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Cookie is sent automatically through Vite proxy — no body needed
        await instance.post("/auth/refresh-token");
        processQueue(null);
        return instance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Extract error message + mã lỗi (client phân nhánh UI, vd modal MSSV chưa import)
    const payload = error.response?.data;
    const message =
      payload?.error?.message ||
      payload?.message ||
      error.message ||
      "An unexpected error occurred";

    const apiError = new Error(message);
    if (payload?.error?.code) apiError.code = payload.error.code;
    if (payload?.error?.details) apiError.details = payload.error.details;
    apiError.status = error.response?.status;

    if (apiError.code === API_ERROR_ACCOUNT_LOCKED) {
      store.dispatch(logout());
      const onAuthPage = typeof window !== "undefined" && window.location.pathname.startsWith("/auth/");
      if (!onAuthPage && typeof window !== "undefined") {
        window.location.replace("/auth/login?locked=1");
      }
    }

    return Promise.reject(apiError);
  },
);

export default instance;
