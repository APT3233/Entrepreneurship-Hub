import React, { useEffect } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { authApi } from "@/api/auth";
import { setError, setLoading, setUser } from "@/store/slices/authSlice";

const RootLayout = () => {
  const dispatch = useDispatch();
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

  return <Outlet />;
};

export default RootLayout;
