import React from "react";
import StudentLayout from "@/layouts/student";
import StudentDashboard from "@/pages/student";
import StudentGroupsPage from "@/pages/student/groups";
import StudentAssignmentsPage from "@/pages/student/assignments";
const ProfilePage = React.lazy(() => import("@/pages/common/ProfilePage"));
import { Roles } from "@/constants/roles";

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
        path: "profile",
        element: <ProfilePage />,
      },
    ],
  };
  routes.push(route);
}