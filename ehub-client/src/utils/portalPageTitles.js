const lecturerExactTitles = {
  "/lecturer/dashboard": "lecturer.dashboard",
  "/lecturer/classes": "lecturer.classes",
  "/lecturer/groups": "lecturer.groups",
  "/lecturer/assignments": "lecturer.assignments",
  "/lecturer/grading": "lecturer.grading",
  "/lecturer/evaluation": "lecturer.evaluation",
  "/lecturer/evaluation/rubrics": "nav.rubrics",
  "/lecturer/analytics": "lecturer.analyticsPage.title",
  "/lecturer/mentor-analytics": "lecturer.mentorAnalytics",
  "/lecturer/mentoring/sessions": "nav.mentoringSessions",
  "/lecturer/incubation/nominations": "lecturer.incubation",
  "/lecturer/schedule": "lecturer.schedule",
  "/lecturer/profile": "profile.title",
};

const studentExactTitles = {
  "/student/dashboard": "student.dashboard",
  "/student/groups": "student.groups",
  "/student/assignments": "student.assignments",
  "/student/mentoring": "student.mentoring",
  "/student/startup-profile": "student.startupProfile.pageTitle",
  "/student/ecosystem/opportunities": "student.startupProfile.panels.opportunities",
  "/student/profile": "profile.title",
};

export function getLecturerPageTitle(pathname, t) {
  if (lecturerExactTitles[pathname]) return t(lecturerExactTitles[pathname]);

  if (/^\/lecturer\/classes\/[^/]+\/checkpoints\/[^/]+\/submissions$/.test(pathname)) {
    return t("lecturer.gradingPage.checkpointSubmissionsTitle");
  }
  if (/^\/lecturer\/classes\/[^/]+\/assignments\/[^/]+\/submissions$/.test(pathname)) {
    return t("lecturer.gradingPage.assignmentSubmissionsTitle");
  }
  if (/^\/lecturer\/classes\/[^/]+\/analytics$/.test(pathname)) {
    return t("lecturer.analyticsPage.classTitle");
  }
  if (/^\/lecturer\/classes\/[^/]+\/mentor-assignments$/.test(pathname)) {
    return t("nav.mentorAssignments");
  }
  if (/^\/lecturer\/classes\/[^/]+\/mentoring-sessions$/.test(pathname)) {
    return t("nav.mentoringSessions");
  }
  if (pathname.startsWith("/lecturer/classes/")) return t("header.detailClass");

  if (/\/request-mentor$/.test(pathname)) return t("lecturer.mentoringPage.requestTitle");
  if (/\/mentor-matching$/.test(pathname)) return t("lecturer.mentoringPage.requestMatchingTitle");
  if (/\/nominate-startup$/.test(pathname)) return t("lecturer.incubationPage.nominateTitle");
  if (pathname.startsWith("/lecturer/groups/")) return t("header.detailGroup");

  if (
    pathname.startsWith("/lecturer/grading/checkpoint-submissions/")
    || pathname.startsWith("/lecturer/grading/assignment-submissions/")
  ) {
    return t("lecturer.gradingPage.title");
  }

  if (pathname.startsWith("/lecturer/evaluation/rubrics/")) return t("header.detailRubric");
  if (pathname.startsWith("/lecturer/mentoring/sessions/")) return t("mentorPortal.sessionDetail.pageTitle");

  return t("lecturer.portal");
}

export function getStudentPageTitle(pathname, t) {
  if (studentExactTitles[pathname]) return t(studentExactTitles[pathname]);

  if (pathname.startsWith("/student/mentoring/sessions/")) {
    return t("mentorPortal.sessionDetail.pageTitle");
  }

  if (pathname.startsWith("/student/startup-profile/") || pathname.startsWith("/student/startups/")) {
    if (pathname.endsWith("/opportunities")) return t("student.startupProfile.panels.opportunities");
    if (pathname.endsWith("/progress")) return t("student.startupProfile.tabs.progress");
    if (pathname.endsWith("/support-needs")) return t("student.startupProfile.tabs.support");
    return t("student.startupProfile.detailTitle");
  }

  return t("student.portal");
}
