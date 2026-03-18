import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import authRouter from "@/routes/authRouter";
import studentRouter from "@/routes/studentRoute";
import lectureRouter from "@/routes/lectureRoute";
import GuardRoute from "@/routes/guradRoute";
import RootLayout from "@/routes/RootLayout";
import RootRedirect from "@/routes/RootRedirect";
import PageNotFound from "@/components/PageNotFound";

const initRoutes = () => {
  const publicRoutes = [];
  authRouter(publicRoutes);

  const protectedRoutes = [];
  studentRouter(protectedRoutes);
  lectureRouter(protectedRoutes);

  return [
    {
      element: <RootLayout />,
      children: [
        // Public routes
        ...publicRoutes,

        // Root redirect: đã login → trang mặc định theo role; chưa login → /auth/login
        { index: true, element: <RootRedirect /> },
        { path: "/teacher/*", element: <Navigate to="/lecturer/dashboard" replace /> },

        // Protected routes — tự động bọc bằng GuardRoute dựa trên roles property
        ...wrapWithGuard(protectedRoutes),

        // 404
        { path: "*", element: <PageNotFound /> },
      ],
    },
  ];
};

const wrapWithGuard = (routes) => {
  return routes.map((route) => {
    let element = route.element;
    if (route.roles || !route.isPublic) {
      element = <GuardRoute allowedRoles={route.roles}>{element}</GuardRoute>;
    }

    const newRoute = { ...route, element };

    if (route.children) {
      newRoute.children = wrapWithGuard(route.children);
    }

    return newRoute;
  });
};

const router = createBrowserRouter(initRoutes());
export default router;
