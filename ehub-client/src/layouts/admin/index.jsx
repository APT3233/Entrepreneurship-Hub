import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import pkg from "../../../package.json";
import {
  Bell,
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Bot,
  ChevronRight,
  Cloud,
  Files,
  FileUp,
  FolderKanban,
  GraduationCap,
  History,
  MailWarning,
  KeyRound,
  LayoutDashboard,
  Layers3,
  LogOut,
  Menu,
  PinIcon,
  PinOff,
  Rocket,
  User,
  UserPlus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  TriangleAlert,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import NavProgress from "@/components/ui/NavProgress";
import ConfirmModal from "@/components/modal/ConfirmModal";
import { authApi } from "@/api/auth";
import { logout, selectAuthUser } from "@/store/slices/authSlice";
import { useTranslation } from "@/context/TranslationContext";
import CommandPalette from "@/components/layout/CommandPalette";
import useDocumentTitle from "@/hooks/useDocumentTitle";

const navItems = [
  {
    titleKey: "nav.workspace",
    icon: LayoutDashboard,
    items: [
      { labelKey: "nav.dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
      { labelKey: "nav.users", path: "/admin/users", icon: Users },
    ],
  },
  {
    titleKey: "nav.academicManagement",
    icon: BookOpen,
    items: [
      { labelKey: "nav.subjects", path: "/admin/academic/subjects", icon: BookOpen },
      { labelKey: "nav.semesters", path: "/admin/academic/semesters", icon: CalendarDays },
      { labelKey: "nav.classes", path: "/admin/academic/classes", icon: GraduationCap },
    ],
  },
  {
    titleKey: "nav.lecturerManagement",
    icon: User,
    items: [
      { labelKey: "nav.lecturers", path: "/admin/lecturers", icon: User },
      { labelKey: "nav.lecturerWorkload", path: "/admin/lecturers/workload", icon: BarChart3 },
    ],
  },
  {
    titleKey: "nav.mentorManagement",
    icon: UserPlus,
    items: [
      { labelKey: "nav.mentors", path: "/admin/mentors", icon: UserPlus },
      { labelKey: "nav.pendingMentors", path: "/admin/mentors/pending", icon: TriangleAlert },
      { labelKey: "nav.expertiseAreas", path: "/admin/mentors/expertise", icon: Layers3 },
      { labelKey: "nav.mentorDocuments", path: "/admin/mentors/documents", icon: Files },
      { labelKey: "nav.mentorAssignments", path: "/admin/mentor-assignments", icon: ClipboardList },
      { labelKey: "nav.mentoringSessions", path: "/admin/mentoring/sessions", icon: ClipboardCheck },
      { labelKey: "nav.mentoringFeedbacks", path: "/admin/mentoring/feedbacks", icon: BarChart3 },
      { labelKey: "nav.mentoringActionItems", path: "/admin/mentoring/action-items", icon: FolderKanban },
      { labelKey: "nav.mentorMatching", path: "/admin/mentor-matching", icon: Bot },
      { labelKey: "nav.mentorAnalytics", path: "/admin/mentor-analytics", icon: BarChart3 },
      { labelKey: "nav.mentorWorkload", path: "/admin/mentor-analytics/workload", icon: ClipboardList },
      { labelKey: "nav.mentorEffectiveness", path: "/admin/mentor-analytics/effectiveness", icon: ClipboardCheck },
      { labelKey: "nav.mentorMatchingAnalytics", path: "/admin/mentor-analytics/matching", icon: Bot },
      { labelKey: "nav.mentorExpertiseHeatmap", path: "/admin/mentor-analytics/expertise", icon: Layers3 },
      { labelKey: "nav.mentorGroupSupport", path: "/admin/mentor-analytics/group-support", icon: UsersRound },
    ],
  },
  {
    titleKey: "nav.incubation",
    icon: Rocket,
    items: [
      { labelKey: "nav.startupPool", path: "/admin/incubation/startups", icon: Rocket },
      { labelKey: "nav.selectionReviews", path: "/admin/incubation/selection-reviews", icon: ClipboardCheck },
      { labelKey: "nav.pipeline", path: "/admin/incubation/pipeline", icon: FolderKanban },
      { labelKey: "nav.pipelineStages", path: "/admin/incubation/pipeline/stages", icon: Layers3 },
      { labelKey: "nav.ecosystemEvents", path: "/admin/ecosystem/events", icon: CalendarDays },
      { labelKey: "nav.ecosystemAlumni", path: "/admin/ecosystem/alumni", icon: GraduationCap },
      { labelKey: "nav.ecosystemPartners", path: "/admin/ecosystem/partners", icon: UsersRound },
      { labelKey: "nav.ecosystemOpportunities", path: "/admin/ecosystem/opportunities", icon: ClipboardList },
      { labelKey: "nav.incubationAnalytics", path: "/admin/incubation/analytics", icon: BarChart3 },
      { labelKey: "nav.ecosystemHealth", path: "/admin/incubation/analytics/ecosystem-health", icon: TriangleAlert },
      { labelKey: "nav.incubationReports", path: "/admin/incubation/reports", icon: FileUp },
    ],
  },
  {
    titleKey: "nav.studentGroupManagement",
    icon: UsersRound,
    items: [
      { labelKey: "nav.students", path: "/admin/students", icon: Users },
      { labelKey: "nav.enrollments", path: "/admin/enrollments", icon: UserPlus },
      { labelKey: "nav.groups", path: "/admin/groups", icon: UsersRound },
      { labelKey: "nav.groupInvites", path: "/admin/group-invites", icon: MailWarning },
      { labelKey: "nav.groupReports", path: "/admin/group-reports", icon: TriangleAlert },
    ],
  },
  {
    titleKey: "nav.projectSubmissionManagement",
    icon: FolderKanban,
    items: [
      { labelKey: "nav.projects", path: "/admin/projects", icon: FolderKanban },
      { labelKey: "nav.checkpoints", path: "/admin/checkpoints", icon: ClipboardCheck },
      { labelKey: "nav.checkpointSubmissions", path: "/admin/checkpoint-submissions", icon: ClipboardList },
      { labelKey: "nav.assignments", path: "/admin/assignments", icon: BookOpen },
      { labelKey: "nav.assignmentSubmissions", path: "/admin/assignment-submissions", icon: ClipboardList },
      { labelKey: "nav.submissionFiles", path: "/admin/submission-files", icon: Files },
    ],
  },
  {
    titleKey: "nav.rubricManagement",
    icon: Layers3,
    items: [
      { labelKey: "nav.rubrics", path: "/admin/evaluation/rubrics", icon: ClipboardCheck },
      { labelKey: "nav.gradingConfig", path: "/admin/evaluation/grading-config", icon: Settings },
      { labelKey: "nav.rubricUsage", path: "/admin/evaluation/rubric-usage", icon: Layers3 },
    ],
  },
  {
    titleKey: "nav.evaluationManagement",
    icon: BarChart3,
    items: [
      { labelKey: "nav.evaluationOverview", path: "/admin/evaluation", icon: BarChart3 },
      { labelKey: "nav.evaluationSessions", path: "/admin/evaluation/sessions", icon: ClipboardCheck },
      { labelKey: "nav.evaluationResults", path: "/admin/evaluation/results", icon: ClipboardList },
      { labelKey: "nav.gradingProgress", path: "/admin/evaluation/progress", icon: ClipboardList },
      { labelKey: "nav.gradeAudit", path: "/admin/evaluation/grade-audit", icon: History },
      { labelKey: "nav.exportScores", path: "/admin/evaluation/exports", icon: FileUp },
      { labelKey: "nav.evaluationAnalytics", path: "/admin/evaluation/analytics", icon: BarChart3 },
      { labelKey: "nav.aiSuggestions", path: "/admin/evaluation/ai-suggestions", icon: Bot },
      { labelKey: "nav.importExport", path: "/admin/import-export", icon: FileUp },
      { labelKey: "nav.invitations", path: "/admin/invitations", icon: Send },
    ],
  },
  {
    titleKey: "nav.analytics",
    icon: BarChart3,
    items: [
      { labelKey: "nav.analyticsOverview", path: "/admin/analytics", icon: BarChart3 },
      { labelKey: "nav.academicQuality", path: "/admin/analytics/academic-quality", icon: GraduationCap },
      { labelKey: "nav.gradingAnalytics", path: "/admin/analytics/grading", icon: ClipboardCheck },
      { labelKey: "nav.rubricAnalytics", path: "/admin/analytics/rubric", icon: Layers3 },
      { labelKey: "nav.projectAnalytics", path: "/admin/analytics/projects", icon: FolderKanban },
    ],
  },
  {
    titleKey: "nav.audit",
    icon: History,
    items: [
      { labelKey: "nav.auditLogs", path: "/admin/logs/audit", icon: History },
      { labelKey: "nav.apiAccessLogs", path: "/admin/logs/api-access", icon: Cloud },
      { labelKey: "nav.importLogs", path: "/admin/logs/import", icon: Files },
    ],
  },
  {
    titleKey: "nav.accessControl",
    icon: ShieldCheck,
    items: [
      { labelKey: "nav.roles", path: "/admin/roles", icon: ShieldCheck },
      { labelKey: "nav.permissions", path: "/admin/permissions", icon: KeyRound },
      { labelKey: "nav.settings", path: "/admin/settings", icon: Settings },
      { labelKey: "nav.aiSettings", path: "/admin/settings/ai", icon: Bot },
    ],
  },
];

const titleMap = {
  "/admin/dashboard": "nav.dashboard",
  "/admin/profile": "profile.title",
  "/admin/users": "nav.users",
  "/admin/roles": "nav.roles",
  "/admin/permissions": "nav.permissions",
  "/admin/settings": "nav.settings",
  "/admin/settings/ai": "nav.aiSettings",
  "/admin/academic/subjects": "nav.subjects",
  "/admin/academic/semesters": "nav.semesters",
  "/admin/academic/classes": "nav.classes",
  "/admin/lecturers": "nav.lecturers",
  "/admin/lecturers/create": "nav.createLecturer",
  "/admin/lecturers/workload": "nav.lecturerWorkload",
  "/admin/mentors": "nav.mentors",
  "/admin/mentors/create": "nav.createMentor",
  "/admin/mentors/expertise": "nav.expertiseAreas",
  "/admin/mentors/pending": "nav.pendingMentors",
  "/admin/mentors/documents": "nav.mentorDocuments",
  "/admin/mentor-assignments": "nav.mentorAssignments",
  "/admin/mentoring/sessions": "nav.mentoringSessions",
  "/admin/mentoring/feedbacks": "nav.mentoringFeedbacks",
  "/admin/mentoring/action-items": "nav.mentoringActionItems",
  "/admin/mentor-matching": "nav.mentorMatching",
  "/admin/mentor-analytics": "nav.mentorAnalytics",
  "/admin/mentor-analytics/workload": "nav.mentorWorkload",
  "/admin/mentor-analytics/effectiveness": "nav.mentorEffectiveness",
  "/admin/mentor-analytics/matching": "nav.mentorMatchingAnalytics",
  "/admin/mentor-analytics/expertise": "nav.mentorExpertiseHeatmap",
  "/admin/mentor-analytics/group-support": "nav.mentorGroupSupport",
  "/admin/incubation": "nav.startupPool",
  "/admin/incubation/startups": "nav.startupPool",
  "/admin/incubation/startups/create": "nav.createStartup",
  "/admin/incubation/selection-reviews": "nav.selectionReviews",
  "/admin/incubation/pipeline": "nav.pipeline",
  "/admin/incubation/pipeline/stages": "nav.pipelineStages",
  "/admin/ecosystem/events": "nav.ecosystemEvents",
  "/admin/ecosystem/events/create": "nav.createEcosystemEvent",
  "/admin/ecosystem/alumni": "nav.ecosystemAlumni",
  "/admin/ecosystem/partners": "nav.ecosystemPartners",
  "/admin/ecosystem/opportunities": "nav.ecosystemOpportunities",
  "/admin/incubation/analytics": "nav.incubationAnalytics",
  "/admin/incubation/analytics/pipeline": "nav.pipelineAnalytics",
  "/admin/incubation/analytics/progress": "nav.progressAnalytics",
  "/admin/incubation/analytics/events": "nav.eventAnalytics",
  "/admin/incubation/analytics/ecosystem-health": "nav.ecosystemHealth",
  "/admin/incubation/reports": "nav.incubationReports",
  "/admin/students": "nav.students",
  "/admin/enrollments": "nav.enrollments",
  "/admin/groups": "nav.groups",
  "/admin/group-invites": "nav.groupInvites",
  "/admin/group-reports": "nav.groupReports",
  "/admin/projects": "nav.projects",
  "/admin/checkpoints": "nav.checkpoints",
  "/admin/checkpoint-submissions": "nav.checkpointSubmissions",
  "/admin/assignments": "nav.assignments",
  "/admin/assignment-submissions": "nav.assignmentSubmissions",
  "/admin/submission-files": "nav.submissionFiles",
  "/admin/evaluation": "nav.evaluationOverview",
  "/admin/evaluation/sessions": "nav.evaluationSessions",
  "/admin/evaluation/rubrics": "nav.rubrics",
  "/admin/evaluation/grading-config": "nav.gradingConfig",
  "/admin/evaluation/results": "nav.evaluationResults",
  "/admin/evaluation/progress": "nav.gradingProgress",
  "/admin/evaluation/rubric-usage": "nav.rubricUsage",
  "/admin/evaluation/grade-audit": "nav.gradeAudit",
  "/admin/evaluation/exports": "nav.exportScores",
  "/admin/evaluation/analytics": "nav.evaluationAnalytics",
  "/admin/evaluation/ai-suggestions": "nav.aiSuggestions",
  "/admin/import-export": "nav.importExport",
  "/admin/invitations": "nav.invitations",
  "/admin/logs/audit": "nav.auditLogs",
  "/admin/logs/api-access": "nav.apiAccessLogs",
  "/admin/logs/import": "nav.importLogs",
  "/admin/analytics": "nav.analyticsOverview",
  "/admin/analytics/academic-quality": "nav.academicQuality",
  "/admin/analytics/grading": "nav.gradingAnalytics",
  "/admin/analytics/rubric": "nav.rubricAnalytics",
  "/admin/analytics/projects": "nav.projectAnalytics",
};

const getPageTitle = (pathname, t) => {
  if (titleMap[pathname]) return t(titleMap[pathname]);
  if (pathname.startsWith("/admin/academic/classes/")) return t("header.detailClass");
  if (pathname.startsWith("/admin/mentor-matching/")) return t("nav.mentorMatchingDetail");
  if (pathname.startsWith("/admin/mentor-assignments/")) return t("nav.mentorAssignmentDetail");
  if (/^\/admin\/groups\/\d+\/mentors/.test(pathname)) return t("nav.groupMentors");
  if (pathname.startsWith("/admin/groups/")) return t("header.detailGroup");
  if (pathname.startsWith("/admin/checkpoints/")) return t("header.detailCheckpoint");
  if (pathname.startsWith("/admin/assignments/")) return t("header.detailAssignment");
  if (pathname.startsWith("/admin/evaluation/rubrics/")) return t("header.detailRubric");
  if (pathname.startsWith("/admin/lecturers/")) return t("header.detailLecturer");
  if (pathname.startsWith("/admin/mentors/")) return t("nav.mentorDetail");
  if (pathname.startsWith("/admin/incubation/startups/")) return t("nav.startupDetail");
  if (pathname.startsWith("/admin/ecosystem/events/")) return t("nav.ecosystemEventDetail");
  if (pathname.startsWith("/admin/ecosystem/alumni/")) return t("nav.ecosystemAlumniDetail");
  if (pathname.startsWith("/admin/ecosystem/partners/")) return t("nav.ecosystemPartnerDetail");
  if (pathname.startsWith("/admin/ecosystem/opportunities/")) return t("nav.ecosystemOpportunityDetail");
  return t("header.adminTitle");
};

const getBreadcrumbRoot = (pathname, t) => {
  if (pathname.startsWith("/admin/academic")) return t("nav.academicManagement");
  if (pathname.startsWith("/admin/lecturers")) return t("nav.lecturerManagement");
  if (
    pathname.startsWith("/admin/mentors") ||
    pathname.startsWith("/admin/mentor-assignments") ||
    pathname.startsWith("/admin/mentor-matching") ||
    pathname.startsWith("/admin/mentor-analytics") ||
    pathname.startsWith("/admin/mentoring")
  ) return t("nav.mentorManagement");
  if (pathname.startsWith("/admin/incubation") || pathname.startsWith("/admin/ecosystem")) return t("nav.incubation");
  if (
    pathname.startsWith("/admin/students") ||
    pathname.startsWith("/admin/enrollments") ||
    pathname.startsWith("/admin/groups") ||
    pathname.startsWith("/admin/group-")
  ) {
    return t("nav.studentGroupManagement");
  }
  if (
    pathname.startsWith("/admin/projects") ||
    pathname.startsWith("/admin/checkpoints") ||
    pathname.startsWith("/admin/checkpoint-submissions") ||
    pathname.startsWith("/admin/assignments") ||
    pathname.startsWith("/admin/assignment-submissions") ||
    pathname.startsWith("/admin/submission-files")
  ) {
    return t("nav.projectSubmissionManagement");
  }
  if (
    pathname.startsWith("/admin/evaluation/rubrics") ||
    pathname.startsWith("/admin/evaluation/grading-config") ||
    pathname.startsWith("/admin/evaluation/rubric-usage")
  ) {
    return t("nav.rubricManagement");
  }
  if (
    pathname.startsWith("/admin/evaluation") ||
    pathname.startsWith("/admin/import-export") ||
    pathname.startsWith("/admin/invitations")
  ) {
    return t("nav.evaluationManagement");
  }
  if (pathname.startsWith("/admin/logs")) {
    return t("nav.audit");
  }
  if (pathname.startsWith("/admin/analytics")) {
    return t("nav.analytics");
  }
  if (
    pathname.startsWith("/admin/roles") ||
    pathname.startsWith("/admin/permissions") ||
    pathname.startsWith("/admin/settings")
  ) {
    return t("nav.accessControl");
  }
  return t("nav.workspace");
};

const NAV_EXCLUSIVE_CHILDREN = {
  "/admin/incubation/pipeline": ["/admin/incubation/pipeline/stages"],
  "/admin/incubation/analytics": ["/admin/incubation/analytics/ecosystem-health"],
  "/admin/incubation/startups": ["/admin/incubation/startups/create"],
};

const isPathActive = (pathname, path) => {
  if (path === "/admin/evaluation") return pathname === path;
  if (path === "/admin/analytics") return pathname === path;
  if (path === "/admin/mentor-analytics") return pathname === path;
  if (path === "/admin/settings") return pathname === path;
  if (path === "/admin/lecturers") {
    return pathname === path || (pathname.startsWith("/admin/lecturers/") && !pathname.startsWith("/admin/lecturers/workload"));
  }
  if (path === "/admin/mentors") {
    return pathname === path || pathname === "/admin/mentors/create" || /^\/admin\/mentors\/\d+/.test(pathname);
  }
  const exclusiveChildren = NAV_EXCLUSIVE_CHILDREN[path];
  if (exclusiveChildren) {
    const matches = pathname === path || pathname.startsWith(`${path}/`);
    if (!matches) return false;
    return !exclusiveChildren.some(
      (exclusivePath) => pathname === exclusivePath || pathname.startsWith(`${exclusivePath}/`),
    );
  }
  return pathname === path || pathname.startsWith(`${path}/`);
};

const getActiveSectionKeys = (pathname) =>
  navItems
    .filter((section) => section.items.some((item) => isPathActive(pathname, item.path)))
    .map((section) => section.titleKey);

const getInitials = (name = "Admin") =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase() || "A";

function LanguageSwitcher() {
  const { language, changeLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative select-none">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all text-xs font-bold text-slate-700 shadow-sm cursor-pointer"
      >
        <span>{language === "vi" ? "🇻🇳 VI" : "🇺🇸 EN"}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 w-32 bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
          <button
            type="button"
            onClick={() => { changeLanguage("vi"); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer ${language === "vi" ? "text-accent-600 bg-accent-50/50" : "text-slate-600"}`}
          >
            <span>🇻🇳 Tiếng Việt</span>
          </button>
          <button
            type="button"
            onClick={() => { changeLanguage("en"); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer ${language === "en" ? "text-accent-600 bg-accent-50/50" : "text-slate-600"}`}
          >
            <span>🇺🇸 English</span>
          </button>
        </div>
      )}
    </div>
  );
}

function AdminSidebar({ open, onClose }) {
  const { t } = useTranslation();
  const location = useLocation();
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(() => localStorage.getItem("admin_sidebar_pinned") === "true");
  const [expandedSections, setExpandedSections] = useState(() => new Set(getActiveSectionKeys(location.pathname)));
  const isExpanded = open || pinned || hovered;

  const [prevPathname, setPrevPathname] = useState(location.pathname);

  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    const activeKeys = getActiveSectionKeys(location.pathname);
    if (activeKeys.length) {
      const next = new Set(expandedSections);
      activeKeys.forEach((key) => next.add(key));
      setExpandedSections(next);
    }
  }

  const toggleSection = (sectionKey) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) next.delete(sectionKey);
      else next.add(sectionKey);
      return next;
    });
  };

  const togglePin = () => {
    const nextValue = !pinned;
    setPinned(nextValue);
    localStorage.setItem("admin_sidebar_pinned", String(nextValue));
  };

  return (
    <>
      {open && <button className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={onClose} aria-label="Đóng menu" />}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ width: isExpanded ? "280px" : "68px" }}
        className={`fixed md:static inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-slate-200 bg-white shadow-[2px_0_12px_rgba(15,23,42,0.04)] transition-[width,transform] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-[width,transform] ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className={`flex h-[78px] items-center justify-between overflow-hidden border-b border-slate-100 transition-[padding] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-[padding] ${isExpanded ? "px-4" : "px-[14px]"}`}>
          <div className={`flex items-center overflow-hidden transition-[gap,justify-content] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isExpanded ? "gap-3" : "w-full justify-center gap-0"}`}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#4f16f8] to-[#3b82f6] text-sm font-black text-white shadow-[0_8px_18px_rgba(79,22,248,0.24)] shrink-0">
              E
            </div>
            <div
              style={{
                opacity: isExpanded ? 1 : 0,
                maxWidth: isExpanded ? "190px" : "0px",
                transform: isExpanded ? "translateX(0)" : "translateX(-6px)",
              }}
              className="overflow-hidden whitespace-nowrap transition-[opacity,transform,max-width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-[opacity,transform,max-width]"
            >
              <p className="text-sm font-black tracking-wider bg-gradient-to-r from-[#4f16f8] to-[#3b82f6] bg-clip-text text-transparent uppercase leading-none">
                E-HUB
              </p>
              <p className="mt-1 text-[9px] font-semibold tracking-[0.24em] text-slate-400">v{pkg.version} · <span className="text-[7.5px] font-bold tracking-normal uppercase text-slate-300">APT3233</span></p>
            </div>
          </div>
          <button className="md:hidden p-2 text-gray-400" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>
        <nav className={`flex-1 overflow-x-hidden px-2 py-5 transition-[padding,margin] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isExpanded ? "overflow-y-auto" : "overflow-hidden"}`}>
          {navItems.map((section) => (
            <div key={section.titleKey} className={isExpanded ? "mb-2" : "mb-3"}>
              {(() => {
                const SectionIcon = section.icon;
                const expanded = expandedSections.has(section.titleKey);
                const activeSection = section.items.some((item) => isPathActive(location.pathname, item.path));
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleSection(section.titleKey)}
                      title={!isExpanded ? t(section.titleKey) : undefined}
                      className={`relative flex overflow-hidden rounded-lg text-[13px] font-bold transition-[width,padding,background-color,color] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                        isExpanded
                          ? "w-full items-center gap-3 px-3 py-2.5"
                          : "mx-auto h-11 w-11 items-center justify-center p-0"
                      } ${
                        activeSection
                          ? isExpanded ? "bg-[#eaf2ff] text-[#2563eb]" : "text-[#2563eb]"
                          : "text-[#64748b] hover:bg-slate-50 hover:text-[#2563eb]"
                      }`}
                    >
                      <SectionIcon size={isExpanded ? 17 : 20} strokeWidth={1.9} className="shrink-0 transition-[width,height,margin,transform] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]" />
                      {activeSection && !isExpanded ? <span className="absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#2563eb]" /> : null}
                      <span
                        style={{
                          opacity: isExpanded ? 1 : 0,
                          maxWidth: isExpanded ? "200px" : "0px",
                          transform: isExpanded ? "translateX(0)" : "translateX(-6px)",
                        }}
                        className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-ellipsis text-left leading-snug transition-[opacity,transform,max-width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-[opacity,transform,max-width]"
                      >
                        {t(section.titleKey)}
                      </span>
                      <ChevronRight
                        size={14}
                        style={{ opacity: isExpanded ? 1 : 0, width: isExpanded ? "14px" : 0, transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
                        className="shrink-0 transition-[opacity,transform,width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-[opacity,transform]"
                      />
                    </button>
                    {isExpanded && expanded ? (
                      <div className="ml-[22px] mt-1 space-y-1 border-l border-slate-200 py-1 pl-3 animate-in fade-in slide-in-from-top-1 duration-200">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    onClick={onClose}
                    className={({ isActive }) => {
                      const activeItem = isActive || isPathActive(location.pathname, item.path);
                      return `relative flex min-h-9 items-start gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
                        activeItem
                          ? "bg-[#eaf2ff] text-[#2563eb]"
                          : "text-[#64748b] hover:bg-slate-50 hover:text-[#2563eb]"
                      }`;
                    }}
                  >
                    <item.icon size={15} strokeWidth={1.8} className="mt-0.5 shrink-0" />
                    <span className="min-w-0 whitespace-nowrap truncate leading-snug">{t(item.labelKey)}</span>
                  </NavLink>
                ))}
                      </div>
                    ) : null}
                  </>
                );
              })()}
            </div>
          ))}
        </nav>
        <div className="mx-2 border-t border-slate-100 py-4">
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={togglePin}
              title={pinned ? t("common.unpin") : t("common.pin")}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                pinned
                  ? "bg-blue-50 text-[#2563eb] hover:bg-blue-100"
                  : "text-[#64748b] hover:bg-slate-100 hover:text-[#2563eb]"
              }`}
            >
              {pinned ? <PinIcon size={16} className="rotate-45" /> : <PinOff size={16} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function AdminHeader({ user, onMenu, onLogout, onSearchClick }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const name = user?.full_name || user?.username || user?.email || "Admin";
  const email = user?.email || "";
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-[58px] shrink-0 border-b border-slate-200 bg-[#f0f4f8] px-4 sm:px-8">
      <div className="flex h-full items-center gap-4">
        <button type="button" className="md:hidden p-2 rounded-xl text-[#64748b] hover:bg-white" onClick={onMenu} aria-label="Mở menu">
          <Menu size={20} />
        </button>
        <HeaderBreadcrumb />
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onSearchClick}
            className="relative hidden w-[220px] lg:flex xl:w-[320px] h-9 rounded-lg border border-slate-200 bg-white pl-9 pr-12 text-sm font-medium text-slate-400 outline-none items-center justify-start cursor-pointer hover:border-slate-300 transition-colors"
          >
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <span>{t("header.searchPlaceholder")}</span>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
              K
            </span>
          </button>
          <HeaderIcon badge="3" tone="red">
            <Bell size={17} />
          </HeaderIcon>
          <HeaderIcon badge="3" tone="blue">
            <Cloud size={17} />
          </HeaderIcon>

          {/* Premium Language Switcher */}
          <LanguageSwitcher />

          {/* Admin Avatar & Dropdown */}
          <div ref={ref} className="relative select-none">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6d16f8] text-xs font-bold text-white shadow-sm cursor-pointer hover:scale-105 transition-transform overflow-hidden"
              title={name}
              aria-label="Tài khoản admin"
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(name)
              )}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                <div className="px-4 py-2 leading-tight">
                  <p className="text-xs font-bold text-slate-900 truncate">{name}</p>
                  {email && <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{email}</p>}
                </div>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate("/admin/profile");
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-accent-600 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <User size={14} className="text-slate-400" />
                  <span>{t("profile.accountInfo")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>{t("header.logoutButton")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderBreadcrumb() {
  const { t } = useTranslation();
  const location = useLocation();
  const title = getPageTitle(location.pathname, t);
  return (
    <div className="hidden items-center gap-2 text-sm md:flex">
      <span className="font-semibold text-[#64748b]">{getBreadcrumbRoot(location.pathname, t)}</span>
      <ChevronRight size={14} className="text-slate-400" />
      <span className="font-bold text-slate-900">{title}</span>
    </div>
  );
}

function HeaderIcon({ children, badge, tone = "blue" }) {
  const badgeClass = tone === "red" ? "bg-rose-600" : "bg-sky-500";
  return (
    <button type="button" className="relative rounded-full p-2 text-[#64748b] hover:bg-white hover:text-[#2563eb] cursor-pointer">
      {children}
      {badge ? (
        <span className={`absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none text-white ${badgeClass}`}>
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export default function AdminLayout() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectAuthUser);
  const pageTitle = useMemo(() => getPageTitle(location.pathname, t), [location.pathname, t]);
  useDocumentTitle(pageTitle);

  const handleLogout = async () => {
    setLogoutOpen(false);
    await authApi.logout().catch(() => null);
    dispatch(logout());
    navigate("/auth/login", { replace: true });
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable);

      // Ctrl + K or Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      // '/' or 'k' when not in inputs
      else if (!isInput && (e.key === "/" || e.key?.toLowerCase() === "k")) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-[#f0f4f8]">
      <NavProgress />
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <AdminHeader
          user={user}
          onMenu={() => setSidebarOpen(true)}
          onLogout={() => setLogoutOpen(true)}
          onSearchClick={() => setCommandPaletteOpen(true)}
        />
        <main className="flex-1 min-h-0 overflow-auto bg-[#f0f4f8] p-4 sm:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              {pageTitle}
            </h1>
          </div>
          <Suspense fallback={<div className="h-40 flex items-center justify-center text-gray-400">{t("common.loading")}</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <ConfirmModal
        isOpen={logoutOpen}
        title={t("header.logoutTitle")}
        subtitle={t("header.logoutSubtitle")}
        variant="logout"
        color="indigo"
        yesLabel={t("header.logoutButton")}
        onYes={handleLogout}
        onClose={() => setLogoutOpen(false)}
      />
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </div>
  );
}
