import React from "react";
import LoginPage from "@/pages/auth/loginPage";
import ActivatePage from "@/pages/auth/ActivatePage";
import SetupPasswordPage from "@/pages/auth/SetupPasswordPage";

export default function init(routes) {
  const authRoutes = {
    path: "/auth",
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "setup-password",
        element: <SetupPasswordPage />,
      },
    ],
  };

  routes.push(authRoutes);
  routes.push({ path: "/activate", element: <ActivatePage /> });
}