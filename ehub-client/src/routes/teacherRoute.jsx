import MainLayout from "@/layouts/MainLayout";
import TeacherDashboard from "@/pages/teacher";
import { Roles } from "@/constants/roles";

export default function init(routes) {
  const route = {
    path: "/lecture",
    roles: [Roles.LECTURE, Roles.ADMIN],
    element: <MainLayout />,
    children: [
      {
        path: "dashboard",
        element: <TeacherDashboard />,
      },
    ],
  };
  routes.push(route);
}