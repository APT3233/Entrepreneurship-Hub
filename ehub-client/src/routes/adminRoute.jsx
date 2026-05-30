import React from "react";
import { Navigate } from "react-router-dom";
import AdminLayout from "@/layouts/admin";
import { Roles } from "@/constants/roles";

const AdminDashboard = React.lazy(() => import("@/pages/admin/dashboard"));
const AdminUsers = React.lazy(() => import("@/pages/admin/access-control/users"));
const AdminRoles = React.lazy(() => import("@/pages/admin/access-control/roles"));
const AdminPermissions = React.lazy(() => import("@/pages/admin/access-control/permissions"));
const AdminSettings = React.lazy(() => import("@/pages/admin/access-control/settings"));
const AdminSubjects = React.lazy(() => import("@/pages/admin/academic/subjects"));
const AdminSemesters = React.lazy(() => import("@/pages/admin/academic/semesters"));
const AdminClasses = React.lazy(() => import("@/pages/admin/academic/classes"));
const AdminClassDetail = React.lazy(() => import("@/pages/admin/academic/classes/ClassDetailPage"));
const AdminStudents = React.lazy(() => import("@/pages/admin/student-group/students"));
const AdminEnrollments = React.lazy(() => import("@/pages/admin/student-group/enrollments"));
const AdminGroups = React.lazy(() => import("@/pages/admin/student-group/groups"));
const AdminGroupDetail = React.lazy(() => import("@/pages/admin/student-group/groups/GroupDetailPage"));
const AdminGroupInvites = React.lazy(() => import("@/pages/admin/student-group/group-invites"));
const AdminGroupReports = React.lazy(() => import("@/pages/admin/student-group/group-reports"));
const AdminProjects = React.lazy(() => import("@/pages/admin/project-submission/projects"));
const AdminCheckpoints = React.lazy(() => import("@/pages/admin/project-submission/checkpoints"));
const AdminCheckpointDetail = React.lazy(() => import("@/pages/admin/project-submission/checkpoints/CheckpointDetailPage"));
const AdminCheckpointSubmissions = React.lazy(() => import("@/pages/admin/project-submission/checkpoint-submissions"));
const AdminAssignments = React.lazy(() => import("@/pages/admin/project-submission/assignments"));
const AdminAssignmentDetail = React.lazy(() => import("@/pages/admin/project-submission/assignments/AssignmentDetailPage"));
const AdminAssignmentSubmissions = React.lazy(() => import("@/pages/admin/project-submission/assignment-submissions"));
const AdminSubmissionFiles = React.lazy(() => import("@/pages/admin/project-submission/submission-files"));
const AdminRubrics = React.lazy(() => import("@/pages/admin/evaluation-ops/rubrics"));
const AdminRubricDetail = React.lazy(() => import("@/pages/admin/evaluation-ops/rubrics/RubricDetailPage"));
const AdminEvaluationOverview = React.lazy(() => import("@/pages/admin/evaluation-ops"));
const AdminEvaluationSessions = React.lazy(() => import("@/pages/admin/evaluation-ops/sessions"));
const AdminGradingConfig = React.lazy(() => import("@/pages/admin/evaluation-ops/grading-config"));
const AdminEvaluationResults = React.lazy(() => import("@/pages/admin/evaluation-ops/results"));
const AdminGradingProgress = React.lazy(() => import("@/pages/admin/evaluation-ops/progress"));
const AdminRubricUsage = React.lazy(() => import("@/pages/admin/evaluation-ops/rubric-usage"));
const AdminGradeAudit = React.lazy(() => import("@/pages/admin/evaluation-ops/grade-audit"));
const AdminEvaluationExports = React.lazy(() => import("@/pages/admin/evaluation-ops/exports"));
const AdminEvaluationAnalytics = React.lazy(() => import("@/pages/admin/evaluation-ops/analytics"));
const AdminImportExport = React.lazy(() => import("@/pages/admin/evaluation-ops/import-export"));
const AdminInvitations = React.lazy(() => import("@/pages/admin/evaluation-ops/invitations"));
const AdminAuditLogs = React.lazy(() => import("@/pages/admin/evaluation-ops/logs/AuditLogsPage"));
const AdminApiAccessLogs = React.lazy(() => import("@/pages/admin/evaluation-ops/logs/ApiAccessLogsPage"));
const AdminImportLogs = React.lazy(() => import("@/pages/admin/evaluation-ops/logs/ImportLogsPage"));
const AdminProfile = React.lazy(() => import("@/pages/admin/profile"));

export default function init(routes) {
  routes.push({
    path: "/admin",
    roles: [Roles.ADMIN, Roles.DEPARTMENT_HEAD],
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "profile", element: <AdminProfile /> },
      { path: "users", element: <AdminUsers /> },
      { path: "roles", element: <AdminRoles /> },
      { path: "permissions", element: <AdminPermissions /> },
      { path: "settings", element: <AdminSettings /> },
      { path: "academic/subjects", element: <AdminSubjects /> },
      { path: "academic/semesters", element: <AdminSemesters /> },
      { path: "academic/classes", element: <AdminClasses /> },
      { path: "academic/classes/:id", element: <AdminClassDetail /> },
      { path: "students", element: <AdminStudents /> },
      { path: "enrollments", element: <AdminEnrollments /> },
      { path: "groups", element: <AdminGroups /> },
      { path: "groups/:id", element: <AdminGroupDetail /> },
      { path: "group-invites", element: <AdminGroupInvites /> },
      { path: "group-reports", element: <AdminGroupReports /> },
      { path: "projects", element: <AdminProjects /> },
      { path: "checkpoints", element: <AdminCheckpoints /> },
      { path: "checkpoints/:id", element: <AdminCheckpointDetail /> },
      { path: "checkpoint-submissions", element: <AdminCheckpointSubmissions /> },
      { path: "assignments", element: <AdminAssignments /> },
      { path: "assignments/:id", element: <AdminAssignmentDetail /> },
      { path: "assignment-submissions", element: <AdminAssignmentSubmissions /> },
      { path: "submission-files", element: <AdminSubmissionFiles /> },
      { path: "evaluation", element: <AdminEvaluationOverview /> },
      { path: "evaluation/sessions", element: <AdminEvaluationSessions /> },
      { path: "evaluation/rubrics", element: <AdminRubrics /> },
      { path: "evaluation/rubrics/:id", element: <AdminRubricDetail /> },
      { path: "evaluation/grading-config", element: <AdminGradingConfig /> },
      { path: "evaluation/results", element: <AdminEvaluationResults /> },
      { path: "evaluation/progress", element: <AdminGradingProgress /> },
      { path: "evaluation/rubric-usage", element: <AdminRubricUsage /> },
      { path: "evaluation/grade-audit", element: <AdminGradeAudit /> },
      { path: "evaluation/exports", element: <AdminEvaluationExports /> },
      { path: "evaluation/analytics", element: <AdminEvaluationAnalytics /> },
      { path: "import-export", element: <AdminImportExport /> },
      { path: "invitations", element: <AdminInvitations /> },
      { path: "logs/audit", element: <AdminAuditLogs /> },
      { path: "logs/api-access", element: <AdminApiAccessLogs /> },
      { path: "logs/import", element: <AdminImportLogs /> },
    ],
  });
}
