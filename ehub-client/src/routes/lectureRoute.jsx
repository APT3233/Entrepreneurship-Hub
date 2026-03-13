import LectureLayout from "@/layouts/lecture";
import LectureDashboard from "@/pages/lecture/dashboard";
import ClassesPage from "@/pages/lecture/classes";
import ClassDetailPage from "@/pages/lecture/classes/ClassDetailPage";
import GroupsPage from "@/pages/lecture/groups";
import GroupDetailPage from "@/pages/lecture/groups/GroupDetailPage";
import AssignmentsPage from "@/pages/lecture/assignments";
import GradingPage from "@/pages/lecture/grading";
import SchedulePage from "@/pages/lecture/schedule";
import { Roles } from "@/constants/roles";

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
    ],
  };
  routes.push(route);
}