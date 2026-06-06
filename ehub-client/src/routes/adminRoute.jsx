import React from "react";
import { Navigate } from "react-router-dom";
import AdminLayout from "@/layouts/admin";
import { Roles } from "@/constants/roles";

const AdminDashboard = React.lazy(() => import("@/pages/admin/dashboard"));
const AdminUsers = React.lazy(() => import("@/pages/admin/access-control/users"));
const AdminRoles = React.lazy(() => import("@/pages/admin/access-control/roles"));
const AdminPermissions = React.lazy(() => import("@/pages/admin/access-control/permissions"));
const AdminSettings = React.lazy(() => import("@/pages/admin/access-control/settings"));
const AdminAiSettings = React.lazy(() => import("@/pages/admin/access-control/ai-settings"));
const AdminSubjects = React.lazy(() => import("@/pages/admin/academic/subjects"));
const AdminSemesters = React.lazy(() => import("@/pages/admin/academic/semesters"));
const AdminClasses = React.lazy(() => import("@/pages/admin/academic/classes"));
const AdminClassDetail = React.lazy(() => import("@/pages/admin/academic/classes/ClassDetailPage"));
const AdminLecturers = React.lazy(() => import("@/pages/admin/lecturer-management"));
const AdminCreateLecturer = React.lazy(() => import("@/pages/admin/lecturer-management/CreateLecturerPage"));
const AdminLecturerDetail = React.lazy(() => import("@/pages/admin/lecturer-management/LecturerDetailPage"));
const AdminLecturerWorkload = React.lazy(() => import("@/pages/admin/lecturer-management/WorkloadPage"));
const AdminMentors = React.lazy(() => import("@/pages/admin/mentor-management"));
const AdminCreateMentor = React.lazy(() => import("@/pages/admin/mentor-management/CreateMentorPage"));
const AdminMentorDetail = React.lazy(() => import("@/pages/admin/mentor-management/MentorDetailPage"));
const AdminMentorExpertise = React.lazy(() => import("@/pages/admin/mentor-management/ExpertiseAreasPage"));
const AdminPendingMentors = React.lazy(() => import("@/pages/admin/mentor-management/PendingMentorsPage"));
const AdminMentorDocuments = React.lazy(() => import("@/pages/admin/mentor-management/MentorDocumentsPage"));
const AdminMentorAssignments = React.lazy(() => import("@/pages/admin/mentor-workflow/AssignmentsPage"));
const AdminMentorAssignmentDetail = React.lazy(() => import("@/pages/admin/mentor-workflow/AssignmentDetailPage"));
const AdminGroupMentors = React.lazy(() => import("@/pages/admin/mentor-workflow/GroupMentorsPage"));
const AdminMentoringSessions = React.lazy(() => import("@/pages/admin/mentor-workflow/MentoringSessionsPage"));
const AdminMentoringFeedbacks = React.lazy(() => import("@/pages/admin/mentor-workflow/MentoringFeedbacksPage"));
const AdminMentoringActionItems = React.lazy(() => import("@/pages/admin/mentor-workflow/MentoringActionItemsPage"));
const AdminMentorMatching = React.lazy(() => import("@/pages/admin/mentor-matching/MatchingRequestsPage"));
const AdminMentorMatchingDetail = React.lazy(() => import("@/pages/admin/mentor-matching/MatchingDetailPage"));
const AdminMentorAnalyticsOverview = React.lazy(() => import("@/pages/admin/mentor-analytics/OverviewPage"));
const AdminMentorAnalyticsWorkload = React.lazy(() => import("@/pages/admin/mentor-analytics/WorkloadPage"));
const AdminMentorAnalyticsEffectiveness = React.lazy(() => import("@/pages/admin/mentor-analytics/EffectivenessPage"));
const AdminMentorAnalyticsMatching = React.lazy(() => import("@/pages/admin/mentor-analytics/MatchingPage"));
const AdminMentorAnalyticsExpertise = React.lazy(() => import("@/pages/admin/mentor-analytics/ExpertiseHeatmapPage"));
const AdminMentorAnalyticsGroupSupport = React.lazy(() => import("@/pages/admin/mentor-analytics/GroupSupportPage"));
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
const AdminAiSuggestions = React.lazy(() => import("@/pages/admin/evaluation-ops/ai-suggestions"));
const AdminImportExport = React.lazy(() => import("@/pages/admin/evaluation-ops/import-export"));
const AdminInvitations = React.lazy(() => import("@/pages/admin/evaluation-ops/invitations"));
const AdminAuditLogs = React.lazy(() => import("@/pages/admin/evaluation-ops/logs/AuditLogsPage"));
const AdminApiAccessLogs = React.lazy(() => import("@/pages/admin/evaluation-ops/logs/ApiAccessLogsPage"));
const AdminImportLogs = React.lazy(() => import("@/pages/admin/evaluation-ops/logs/ImportLogsPage"));
const AdminAnalyticsOverview = React.lazy(() => import("@/pages/admin/analytics"));
const AdminAcademicQualityAnalytics = React.lazy(() => import("@/pages/admin/analytics/AcademicQualityPage"));
const AdminGradingAnalytics = React.lazy(() => import("@/pages/admin/analytics/GradingAnalyticsPage"));
const AdminRubricAnalytics = React.lazy(() => import("@/pages/admin/analytics/RubricAnalyticsPage"));
const AdminProjectAnalytics = React.lazy(() => import("@/pages/admin/analytics/ProjectAnalyticsPage"));
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
      { path: "settings/ai", element: <AdminAiSettings /> },
      { path: "academic/subjects", element: <AdminSubjects /> },
      { path: "academic/semesters", element: <AdminSemesters /> },
      { path: "academic/classes", element: <AdminClasses /> },
      { path: "academic/classes/:id", element: <AdminClassDetail /> },
      { path: "lecturers", element: <AdminLecturers /> },
      { path: "lecturers/create", element: <AdminCreateLecturer /> },
      { path: "lecturers/workload", element: <AdminLecturerWorkload /> },
      { path: "lecturers/:id", element: <AdminLecturerDetail /> },
      { path: "lecturers/:id/profile", element: <AdminLecturerDetail /> },
      { path: "lecturers/:id/classes", element: <AdminLecturerDetail /> },
      { path: "lecturers/:id/grading", element: <AdminLecturerDetail /> },
      { path: "lecturers/:id/created-content", element: <AdminLecturerDetail /> },
      { path: "lecturers/:id/activity", element: <AdminLecturerDetail /> },
      { path: "lecturers/:id/permissions", element: <AdminLecturerDetail /> },
      { path: "lecturers/:id/password", element: <AdminLecturerDetail /> },
      { path: "mentors", element: <AdminMentors /> },
      { path: "mentors/create", element: <AdminCreateMentor /> },
      { path: "mentors/expertise", element: <AdminMentorExpertise /> },
      { path: "mentors/pending", element: <AdminPendingMentors /> },
      { path: "mentors/documents", element: <AdminMentorDocuments /> },
      { path: "mentors/:id", element: <AdminMentorDetail /> },
      { path: "mentors/:id/profile", element: <AdminMentorDetail /> },
      { path: "mentors/:id/expertise", element: <AdminMentorDetail /> },
      { path: "mentors/:id/availability", element: <AdminMentorDetail /> },
      { path: "mentors/:id/documents", element: <AdminMentorDetail /> },
      { path: "mentors/:id/assignments", element: <AdminMentorDetail /> },
      { path: "mentors/:id/sessions", element: <AdminMentorDetail /> },
      { path: "mentors/:id/activity", element: <AdminMentorDetail /> },
      { path: "mentor-assignments", element: <AdminMentorAssignments /> },
      { path: "mentor-assignments/:id", element: <AdminMentorAssignmentDetail /> },
      { path: "groups/:groupId/mentors", element: <AdminGroupMentors /> },
      { path: "mentoring/sessions", element: <AdminMentoringSessions /> },
      { path: "mentoring/feedbacks", element: <AdminMentoringFeedbacks /> },
      { path: "mentoring/action-items", element: <AdminMentoringActionItems /> },
      { path: "mentor-matching", element: <AdminMentorMatching /> },
      { path: "mentor-matching/:requestId", element: <AdminMentorMatchingDetail /> },
      { path: "mentor-analytics", element: <AdminMentorAnalyticsOverview /> },
      { path: "mentor-analytics/workload", element: <AdminMentorAnalyticsWorkload /> },
      { path: "mentor-analytics/effectiveness", element: <AdminMentorAnalyticsEffectiveness /> },
      { path: "mentor-analytics/matching", element: <AdminMentorAnalyticsMatching /> },
      { path: "mentor-analytics/expertise", element: <AdminMentorAnalyticsExpertise /> },
      { path: "mentor-analytics/group-support", element: <AdminMentorAnalyticsGroupSupport /> },
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
      { path: "evaluation/ai-suggestions", element: <AdminAiSuggestions /> },
      { path: "import-export", element: <AdminImportExport /> },
      { path: "invitations", element: <AdminInvitations /> },
      { path: "logs/audit", element: <AdminAuditLogs /> },
      { path: "logs/api-access", element: <AdminApiAccessLogs /> },
      { path: "logs/import", element: <AdminImportLogs /> },
      { path: "analytics", element: <AdminAnalyticsOverview /> },
      { path: "analytics/academic-quality", element: <AdminAcademicQualityAnalytics /> },
      { path: "analytics/grading", element: <AdminGradingAnalytics /> },
      { path: "analytics/rubric", element: <AdminRubricAnalytics /> },
      { path: "analytics/projects", element: <AdminProjectAnalytics /> },
    ],
  });
}
