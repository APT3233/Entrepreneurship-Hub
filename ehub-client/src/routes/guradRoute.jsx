import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/slices/authSlice";
import { hasAnyRole } from "@/utils/role";
import PageForbidden from "@/components/PageForbidden";

const GuardRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useSelector(selectAuth);
  const location = useLocation();

  // Đang restore session (ví dụ: đang gọi /auth/me) → hiển thị spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check roles if specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasAnyRole(user, allowedRoles)) return <PageForbidden />;
  }

  return <>{children}</>;
};

export default GuardRoute;
