import MainLayout from "@/layouts/MainLayout";
import StudentDashboard from "@/pages/student";
import { Roles } from "@/constants/roles";

export default function init(routes) {
  const route = {
    path: "/student",
    roles: [Roles.STUDENT],
    element: <MainLayout />,
    children: [
      {
        path: "dashboard",
        element: <StudentDashboard />,
      },
    ],
  };
  routes.push(route);
}