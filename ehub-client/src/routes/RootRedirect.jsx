import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/slices/authSlice";
import { getDefaultRouteForUser } from "@/utils/role";

/**
 * Redirect "/" theo trạng thái auth:
 * - Đã login → trang mặc định theo role (student/dashboard, lecture/dashboard...)
 * - Chưa login → /auth/login
 */
const RootRedirect = () => {
  const { user, isAuthenticated, isLoading } = useSelector(selectAuth);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  return <Navigate to="/auth/login" replace />;
};

export default RootRedirect;
