import StudentLayout from "@/layouts/student";
import StudentDashboard from "@/pages/student";
import StudentGroupsPage from "@/pages/student/groups";
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
    ],
  };
  routes.push(route);
}