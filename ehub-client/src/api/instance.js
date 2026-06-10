import axios from "axios";
import { store } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { API_ERROR_ACCOUNT_LOCKED, API_ERROR_RATE_LIMIT } from "@/constants/apiErrors";

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

const getRetryAfterSeconds = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && numericValue > 0) return Math.ceil(numericValue);

  const retryAt = Date.parse(value);
  if (!Number.isNaN(retryAt)) {
    const seconds = Math.ceil((retryAt - Date.now()) / 1000);
    return seconds > 0 ? seconds : null;
  }

  return null;
};

const getHeaderValue = (headers, name) =>
  headers?.[name] || headers?.[name.toLowerCase()] || headers?.get?.(name);

const formatRetryAfter = (seconds) => {
  if (!seconds) return "ít phút";
  if (seconds < 60) return `${seconds} giây`;
  return `${Math.ceil(seconds / 60)} phút`;
};

const parseRetryAt = (retryAt, retryAfter) => {
  const parsedRetryAt = Date.parse(retryAt);
  if (!Number.isNaN(parsedRetryAt)) return new Date(parsedRetryAt);
  if (retryAfter) return new Date(Date.now() + retryAfter * 1000);
  return null;
};

const formatRetryAt = (retryAt) =>
  retryAt?.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const buildRateLimitMessage = (payload, headers = {}) => {
  const retryAfter = getRetryAfterSeconds(
    payload?.error?.details?.retryAfter ?? getHeaderValue(headers, "retry-after"),
  );
  const retryAt = parseRetryAt(
    payload?.error?.details?.retryAt ?? getHeaderValue(headers, "x-ratelimit-reset"),
    retryAfter,
  );
  const retryAtText = formatRetryAt(retryAt);
  const message = retryAtText
    ? `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${formatRetryAfter(retryAfter)} (lúc ${retryAtText}).`
    : `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${formatRetryAfter(retryAfter)}.`;

  return {
    message,
    retryAfter,
    retryAt: retryAt?.toISOString(),
  };
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
    const status = error.response?.status;
    const code = payload?.error?.code || (status === 429 ? API_ERROR_RATE_LIMIT : undefined);
    const isRateLimited = status === 429 || code === API_ERROR_RATE_LIMIT;
    const rateLimitInfo = isRateLimited
      ? buildRateLimitMessage(payload, error.response?.headers)
      : null;
    const message =
      rateLimitInfo?.message ||
      payload?.error?.message ||
      payload?.message ||
      error.message ||
      "An unexpected error occurred";

    const apiError = new Error(message);
    if (code) apiError.code = code;
    if (payload?.error?.details) apiError.details = payload.error.details;
    if (rateLimitInfo?.retryAfter) apiError.retryAfter = rateLimitInfo.retryAfter;
    if (rateLimitInfo?.retryAt) apiError.retryAt = rateLimitInfo.retryAt;
    apiError.isRateLimited = isRateLimited;
    apiError.status = status;

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
