import React from "react";
import LoginPage from "@/pages/auth/loginPage";
import ActivatePage from "@/pages/auth/ActivatePage";

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
  routes.push({ path: "/activate", element: <ActivatePage /> });
}