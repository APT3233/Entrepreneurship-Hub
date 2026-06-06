import React from "react";
import { Navigate } from "react-router-dom";
import MentorLayout from "@/layouts/mentor";
import { Roles } from "@/constants/roles";

const MentorProfilePage = React.lazy(() => import("@/pages/mentor/profile"));
const MentorDashboardPage = React.lazy(() => import("@/pages/mentor/dashboard"));
const MentorAvailabilityPage = React.lazy(() => import("@/pages/mentor/availability"));
const MentorDocumentsPage = React.lazy(() => import("@/pages/mentor/documents"));
const MentorAssignmentsPage = React.lazy(() => import("@/pages/mentor/assignments"));
const MentorSessionsPage = React.lazy(() => import("@/pages/mentor/sessions"));
const SessionDetailPage = React.lazy(() => import("@/pages/mentoring/SessionDetailPage"));

export default function init(routes) {
  routes.push({
    path: "/mentor",
    roles: [Roles.MENTOR],
    element: <MentorLayout />,
    children: [
      { index: true, element: <Navigate to="/mentor/dashboard" replace /> },
      { path: "dashboard", element: <MentorDashboardPage /> },
      { path: "profile", element: <MentorProfilePage /> },
      { path: "availability", element: <MentorAvailabilityPage /> },
      { path: "documents", element: <MentorDocumentsPage /> },
      { path: "assignments", element: <MentorAssignmentsPage /> },
      { path: "sessions", element: <MentorSessionsPage /> },
      { path: "sessions/:id", element: <SessionDetailPage /> },
    ],
  });
}
