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
const GradingSubmissionListPage = React.lazy(() => import("@/pages/lecture/grading/SubmissionListPage"));
const GradingFormPage = React.lazy(() => import("@/pages/lecture/grading/GradingFormPage"));
const LecturerEvaluationOverview = React.lazy(() => import("@/pages/lecture/evaluation"));
const LecturerRubricsPage = React.lazy(() => import("@/pages/lecture/evaluation/rubrics"));
const LecturerRubricDetailPage = React.lazy(() => import("@/pages/lecture/evaluation/rubrics/RubricDetailPage"));
const LecturerAnalyticsPage = React.lazy(() => import("@/pages/lecture/analytics"));
const SchedulePage = React.lazy(() => import("@/pages/lecture/schedule"));
const ProfilePage = React.lazy(() => import("@/pages/common/ProfilePage"));
const ClassMentorAssignmentsPage = React.lazy(() => import("@/pages/lecture/mentoring/ClassMentorAssignmentsPage"));
const ClassMentoringSessionsPage = React.lazy(() => import("@/pages/lecture/mentoring/ClassMentoringSessionsPage"));
const RequestMentorPage = React.lazy(() => import("@/pages/lecture/mentoring/RequestMentorPage"));
const GroupMentorMatchingPage = React.lazy(() => import("@/pages/lecture/mentoring/GroupMentorMatchingPage"));
const LecturerMentorAnalyticsPage = React.lazy(() => import("@/pages/lecture/mentoring/LecturerMentorAnalyticsPage"));
const SessionDetailPage = React.lazy(() => import("@/pages/mentoring/SessionDetailPage"));

export default function init(routes) {
  const route = {
    path: "/lecturer",
    roles: [Roles.LECTURER, Roles.ADMIN, Roles.DEPARTMENT_HEAD],
    element: <LectureLayout />,
    children: [
      { path: "dashboard", element: <LectureDashboard /> },
      { path: "classes", element: <ClassesPage /> },
      { path: "classes/:id", element: <ClassDetailPage /> },
      { path: "classes/:classId/checkpoints/:checkpointId/submissions", element: <GradingSubmissionListPage sourceType="checkpoint" /> },
      { path: "classes/:classId/assignments/:assignmentId/submissions", element: <GradingSubmissionListPage sourceType="assignment" /> },
      { path: "groups", element: <GroupsPage /> },
      { path: "groups/:id", element: <GroupDetailPage /> },
      { path: "assignments", element: <AssignmentsPage /> },
      { path: "grading", element: <GradingPage /> },
      { path: "grading/checkpoint-submissions/:submissionId", element: <GradingFormPage sourceType="checkpoint" /> },
      { path: "grading/assignment-submissions/:submissionId", element: <GradingFormPage sourceType="assignment" /> },
      { path: "evaluation", element: <LecturerEvaluationOverview /> },
      { path: "evaluation/rubrics", element: <LecturerRubricsPage /> },
      { path: "evaluation/rubrics/:id", element: <LecturerRubricDetailPage /> },
      { path: "analytics", element: <LecturerAnalyticsPage /> },
      { path: "classes/:classId/analytics", element: <LecturerAnalyticsPage /> },
      { path: "classes/:classId/mentor-assignments", element: <ClassMentorAssignmentsPage /> },
      { path: "mentor-analytics", element: <LecturerMentorAnalyticsPage /> },
      { path: "mentoring/sessions", element: <ClassMentoringSessionsPage /> },
      { path: "classes/:classId/mentoring-sessions", element: <ClassMentoringSessionsPage /> },
      { path: "groups/:groupId/request-mentor", element: <RequestMentorPage /> },
      { path: "groups/:groupId/mentor-matching", element: <GroupMentorMatchingPage /> },
      { path: "mentoring/sessions/:id", element: <SessionDetailPage /> },
      { path: "schedule", element: <SchedulePage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  };
  routes.push(route);
}
