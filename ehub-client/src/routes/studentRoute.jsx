import StudentLayout from "@/layouts/student";
import StudentDashboard from "@/pages/student";
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
    ],
  };
  routes.push(route);
}