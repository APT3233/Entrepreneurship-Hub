
import React from "react";
import LoginPage from "@/pages/auth/loginPage";

export default function init(routes) {
  const authRoutes = {
    path: "/auth",
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
    ],
  };

  routes.push(authRoutes);
}