import React, { useEffect } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { authApi } from "@/api/auth";
import { setError, setLoading, setUser, selectAuth } from "@/store/slices/authSlice";
import { API_ERROR_ACCOUNT_LOCKED } from "@/constants/apiErrors";

const ACCOUNT_STATUS_POLL_MS = 20_000;

const RootLayout = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(selectAuth);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Restore session chỉ 1 lần khi mount (tránh chạy lại mỗi lần đổi route → race / cleanup → mất user khi reload)
  useEffect(() => {
    const isLoginWithGoogleCallback =
      location.pathname === "/auth/login" && searchParams.get("google_login") === "success";
    if (isLoginWithGoogleCallback) return;

    let mounted = true;
    const restoreSession = async () => {
      dispatch(setLoading(true));
      try {
        const result = await authApi.me();
        if (!mounted) return;
        dispatch(setUser(result?.data || null));
      } catch (_err) {
        if (!mounted) return;
        dispatch(setUser(null));
        dispatch(setError(null));
      } finally {
        if (mounted) dispatch(setLoading(false));
      }
    };
    restoreSession();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy 1 lần khi mount
  }, [dispatch]);

  // Phát hiện tài khoản bị khóa sau khi admin lock (không cần chờ user bấm nút gọi API khác).
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;

    const verifyAccount = async () => {
      try {
        const result = await authApi.me();
        if (!cancelled) dispatch(setUser(result?.data || null));
      } catch (err) {
        if (cancelled) return;
        if (err?.code === API_ERROR_ACCOUNT_LOCKED) return;
        dispatch(setUser(null));
      }
    };

    const timer = setInterval(verifyAccount, ACCOUNT_STATUS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [dispatch, isAuthenticated]);

  return <Outlet />;
};

export default RootLayout;
