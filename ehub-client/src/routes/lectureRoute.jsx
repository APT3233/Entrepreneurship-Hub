import React from "react";
import LectureLayout from "@/layouts/lecture";
import { Roles } from "@/constants/roles";

const LectureDashboard = React.lazy(() => import("@/pages/lecture/dashboard"));
const ClassesPage = React.lazy(() => import("@/pages/lecture/classes"));
const ClassDetailPage = React.lazy(() => import("@/pages/lecture/classes/ClassDetailPage"));
const GroupsPage = React.lazy(() => import("@/pages/lecture/groups"));
const GroupDetailPage = React.lazy(() => import("@/pages/lecture/groups/GroupDetailPage"));
const AssignmentsPage = React.lazy(() => import("@/pages/lecture/assignments"));
const GradingPage = React.lazy(() => import("@/pages/lecture/grading"));
const SchedulePage = React.lazy(() => import("@/pages/lecture/schedule"));
const ProfilePage = React.lazy(() => import("@/pages/common/ProfilePage"));

export default function init(routes) {
  const route = {
    path: "/lecturer",
    roles: [Roles.LECTURER, Roles.ADMIN],
    element: <LectureLayout />,
    children: [
      { path: "dashboard", element: <LectureDashboard /> },
      { path: "classes", element: <ClassesPage /> },
      { path: "classes/:id", element: <ClassDetailPage /> },
      { path: "groups", element: <GroupsPage /> },
      { path: "groups/:id", element: <GroupDetailPage /> },
      { path: "assignments", element: <AssignmentsPage /> },
      { path: "grading", element: <GradingPage /> },
      { path: "schedule", element: <SchedulePage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  };
  routes.push(route);
}