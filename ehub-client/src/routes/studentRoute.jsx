import React from "react";
import StudentLayout from "@/layouts/student";
import StudentDashboard from "@/pages/student";
import StudentGroupsPage from "@/pages/student/groups";
import StudentAssignmentsPage from "@/pages/student/assignments";
import StudentMentoringPage from "@/pages/student/mentoring";
import { Roles } from "@/constants/roles";
const ProfilePage = React.lazy(() => import("@/pages/common/ProfilePage"));
const SessionDetailPage = React.lazy(() => import("@/pages/mentoring/SessionDetailPage"));

export default function init(routes) {
  const route = {
    path: "/student",
    roles: [Roles.STUDENT],
    element: <StudentLayout />,
    children: [
      {
        path: "dashboard",
        element: <StudentDashboard />,
      },
      {
        path: "groups",
        element: <StudentGroupsPage />,
      },
      {
        path: "assignments",
        element: <StudentAssignmentsPage />,
      },
      {
        path: "mentoring",
        element: <StudentMentoringPage />,
      },
      {
        path: "mentoring/sessions/:id",
        element: <SessionDetailPage />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
    ],
  };
  routes.push(route);
}
