import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarDays,
  GraduationCap,
  UserRound,
  UserPlus,
  UsersRound,
  MailWarning,
  TriangleAlert,
  FolderKanban,
  ClipboardCheck,
  ClipboardList,
  Files,
  BarChart3,
  Layers3,
  Settings,
  FileUp,
  Send,
  History,
  Cloud,
  ShieldCheck,
  KeyRound,
  Search,
  Rocket,
} from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

const commandItems = [
  { labelKey: "nav.dashboard", path: "/admin/dashboard", icon: LayoutDashboard, categoryKey: "commandPalette.categories.workspace" },
  { labelKey: "nav.users", path: "/admin/users", icon: Users, categoryKey: "commandPalette.categories.workspace" },

  { labelKey: "nav.subjects", path: "/admin/academic/subjects", icon: BookOpen, categoryKey: "commandPalette.categories.academic" },
  { labelKey: "nav.semesters", path: "/admin/academic/semesters", icon: CalendarDays, categoryKey: "commandPalette.categories.academic" },
  { labelKey: "nav.classes", path: "/admin/academic/classes", icon: GraduationCap, categoryKey: "commandPalette.categories.academic" },
  { labelKey: "nav.lecturers", path: "/admin/lecturers", icon: UserRound, categoryKey: "commandPalette.categories.lecturer" },
  { labelKey: "nav.lecturerWorkload", path: "/admin/lecturers/workload", icon: BarChart3, categoryKey: "commandPalette.categories.lecturer" },

  { labelKey: "nav.mentors", path: "/admin/mentors", icon: UserPlus, categoryKey: "commandPalette.categories.mentor" },
  { labelKey: "nav.pendingMentors", path: "/admin/mentors/pending", icon: TriangleAlert, categoryKey: "commandPalette.categories.mentor" },
  { labelKey: "nav.expertiseAreas", path: "/admin/mentors/expertise", icon: Layers3, categoryKey: "commandPalette.categories.mentor" },
  { labelKey: "nav.mentorDocuments", path: "/admin/mentors/documents", icon: Files, categoryKey: "commandPalette.categories.mentor" },
  { labelKey: "nav.mentorAssignments", path: "/admin/mentor-assignments", icon: ClipboardList, categoryKey: "commandPalette.categories.mentor" },
  { labelKey: "nav.mentoringSessions", path: "/admin/mentoring/sessions", icon: ClipboardCheck, categoryKey: "commandPalette.categories.mentor" },
  { labelKey: "nav.mentoringFeedbacks", path: "/admin/mentoring/feedbacks", icon: BarChart3, categoryKey: "commandPalette.categories.mentor" },
  { labelKey: "nav.mentoringActionItems", path: "/admin/mentoring/action-items", icon: FolderKanban, categoryKey: "commandPalette.categories.mentor" },
  { labelKey: "nav.mentorMatching", path: "/admin/mentor-matching", icon: ClipboardList, categoryKey: "commandPalette.categories.mentor" },
  { labelKey: "nav.mentorAnalytics", path: "/admin/mentor-analytics", icon: BarChart3, categoryKey: "commandPalette.categories.mentor" },
  { labelKey: "nav.mentorWorkload", path: "/admin/mentor-analytics/workload", icon: ClipboardList, categoryKey: "commandPalette.categories.mentor" },
  { labelKey: "nav.mentorGroupSupport", path: "/admin/mentor-analytics/group-support", icon: UsersRound, categoryKey: "commandPalette.categories.mentor" },

  { labelKey: "nav.startupPool", path: "/admin/incubation/startups", icon: Rocket, categoryKey: "commandPalette.categories.incubation" },
  { labelKey: "nav.selectionReviews", path: "/admin/incubation/selection-reviews", icon: ClipboardCheck, categoryKey: "commandPalette.categories.incubation" },
  { labelKey: "nav.pipeline", path: "/admin/incubation/pipeline", icon: FolderKanban, categoryKey: "commandPalette.categories.incubation" },
  { labelKey: "nav.pipelineStages", path: "/admin/incubation/pipeline/stages", icon: Layers3, categoryKey: "commandPalette.categories.incubation" },
  { labelKey: "nav.ecosystemEvents", path: "/admin/ecosystem/events", icon: CalendarDays, categoryKey: "commandPalette.categories.incubation" },
  { labelKey: "nav.ecosystemAlumni", path: "/admin/ecosystem/alumni", icon: GraduationCap, categoryKey: "commandPalette.categories.incubation" },
  { labelKey: "nav.ecosystemPartners", path: "/admin/ecosystem/partners", icon: UsersRound, categoryKey: "commandPalette.categories.incubation" },
  { labelKey: "nav.ecosystemOpportunities", path: "/admin/ecosystem/opportunities", icon: ClipboardList, categoryKey: "commandPalette.categories.incubation" },
  { labelKey: "nav.incubationAnalytics", path: "/admin/incubation/analytics", icon: BarChart3, categoryKey: "commandPalette.categories.incubation" },
  { labelKey: "nav.ecosystemHealth", path: "/admin/incubation/analytics/ecosystem-health", icon: TriangleAlert, categoryKey: "commandPalette.categories.incubation" },
  { labelKey: "nav.incubationReports", path: "/admin/incubation/reports", icon: FileUp, categoryKey: "commandPalette.categories.incubation" },

  { labelKey: "nav.students", path: "/admin/students", icon: Users, categoryKey: "commandPalette.categories.studentsGroups" },
  { labelKey: "nav.enrollments", path: "/admin/enrollments", icon: UserPlus, categoryKey: "commandPalette.categories.studentsGroups" },
  { labelKey: "nav.groups", path: "/admin/groups", icon: UsersRound, categoryKey: "commandPalette.categories.studentsGroups" },
  { labelKey: "nav.groupInvites", path: "/admin/group-invites", icon: MailWarning, categoryKey: "commandPalette.categories.studentsGroups" },
  { labelKey: "nav.groupReports", path: "/admin/group-reports", icon: TriangleAlert, categoryKey: "commandPalette.categories.studentsGroups" },

  { labelKey: "nav.projects", path: "/admin/projects", icon: FolderKanban, categoryKey: "commandPalette.categories.projectSubmissions" },
  { labelKey: "nav.checkpoints", path: "/admin/checkpoints", icon: ClipboardCheck, categoryKey: "commandPalette.categories.projectSubmissions" },
  { labelKey: "nav.checkpointSubmissions", path: "/admin/checkpoint-submissions", icon: ClipboardList, categoryKey: "commandPalette.categories.projectSubmissions" },
  { labelKey: "nav.assignments", path: "/admin/assignments", icon: BookOpen, categoryKey: "commandPalette.categories.projectSubmissions" },
  { labelKey: "nav.assignmentSubmissions", path: "/admin/assignment-submissions", icon: ClipboardList, categoryKey: "commandPalette.categories.projectSubmissions" },
  { labelKey: "nav.submissionFiles", path: "/admin/submission-files", icon: Files, categoryKey: "commandPalette.categories.projectSubmissions" },

  { labelKey: "nav.evaluationOverview", path: "/admin/evaluation", icon: BarChart3, categoryKey: "commandPalette.categories.evaluation" },
  { labelKey: "nav.evaluationSessions", path: "/admin/evaluation/sessions", icon: ClipboardCheck, categoryKey: "commandPalette.categories.evaluation" },
  { labelKey: "nav.evaluationResults", path: "/admin/evaluation/results", icon: ClipboardList, categoryKey: "commandPalette.categories.evaluationLogs" },
  { labelKey: "nav.gradingProgress", path: "/admin/evaluation/progress", icon: ClipboardList, categoryKey: "commandPalette.categories.evaluation" },
  { labelKey: "nav.rubrics", path: "/admin/evaluation/rubrics", icon: ClipboardCheck, categoryKey: "commandPalette.categories.rubrics" },
  { labelKey: "nav.gradingConfig", path: "/admin/evaluation/grading-config", icon: Settings, categoryKey: "commandPalette.categories.rubrics" },
  { labelKey: "nav.rubricUsage", path: "/admin/evaluation/rubric-usage", icon: Layers3, categoryKey: "commandPalette.categories.rubrics" },
  { labelKey: "nav.gradeAudit", path: "/admin/evaluation/grade-audit", icon: History, categoryKey: "commandPalette.categories.evaluation" },
  { labelKey: "nav.exportScores", path: "/admin/evaluation/exports", icon: FileUp, categoryKey: "commandPalette.categories.evaluation" },
  { labelKey: "nav.evaluationAnalytics", path: "/admin/evaluation/analytics", icon: BarChart3, categoryKey: "commandPalette.categories.evaluationLogs" },
  { labelKey: "nav.importExport", path: "/admin/import-export", icon: FileUp, categoryKey: "commandPalette.categories.evaluationLogs" },
  { labelKey: "nav.invitations", path: "/admin/invitations", icon: Send, categoryKey: "commandPalette.categories.evaluationLogs" },
  { labelKey: "nav.auditLogs", path: "/admin/logs/audit", icon: History, categoryKey: "commandPalette.categories.evaluationLogs" },
  { labelKey: "nav.apiAccessLogs", path: "/admin/logs/api-access", icon: Cloud, categoryKey: "commandPalette.categories.evaluationLogs" },
  { labelKey: "nav.importLogs", path: "/admin/logs/import", icon: Files, categoryKey: "commandPalette.categories.evaluationLogs" },

  { labelKey: "nav.analyticsOverview", path: "/admin/analytics", icon: BarChart3, categoryKey: "commandPalette.categories.analytics" },
  { labelKey: "nav.academicQuality", path: "/admin/analytics/academic-quality", icon: GraduationCap, categoryKey: "commandPalette.categories.analytics" },
  { labelKey: "nav.gradingAnalytics", path: "/admin/analytics/grading", icon: ClipboardCheck, categoryKey: "commandPalette.categories.analytics" },
  { labelKey: "nav.rubricAnalytics", path: "/admin/analytics/rubric", icon: Layers3, categoryKey: "commandPalette.categories.analytics" },
  { labelKey: "nav.projectAnalytics", path: "/admin/analytics/projects", icon: FolderKanban, categoryKey: "commandPalette.categories.analytics" },

  { labelKey: "nav.roles", path: "/admin/roles", icon: ShieldCheck, categoryKey: "commandPalette.categories.accessControl" },
  { labelKey: "nav.permissions", path: "/admin/permissions", icon: KeyRound, categoryKey: "commandPalette.categories.accessControl" },
  { labelKey: "nav.settings", path: "/admin/settings", icon: Settings, categoryKey: "commandPalette.categories.accessControl" },
];

export default function CommandPalette({ isOpen, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setSearch("");
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return commandItems;
    return commandItems.filter((item) => {
      const label = t(item.labelKey).toLowerCase();
      const cat = t(item.categoryKey).toLowerCase();
      return label.includes(query) || cat.includes(query);
    });
  }, [search, t]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
        e.preventDefault();
        navigate(filteredItems[selectedIndex].path);
        onClose();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose, navigate]);

  const activeItemRef = useRef(null);
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={containerRef}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[480px] scale-in duration-200"
      >
        <div className="relative border-b border-slate-100 p-4 shrink-0 flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={t("commandPalette.placeholder")}
            className="w-full bg-transparent border-none outline-none text-sm font-semibold text-slate-800 placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 select-none">
            esc
          </kbd>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 min-h-0">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.path}
                  ref={isSelected ? activeItemRef : null}
                  type="button"
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all text-left cursor-pointer ${
                    isSelected
                      ? "bg-[#eaf2ff] text-[#2563eb]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon size={16} strokeWidth={2} className="shrink-0" />
                    <span className="truncate">{t(item.labelKey)}</span>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold tracking-wider select-none shrink-0 border rounded px-1.5 py-0.5 transition-colors ${
                      isSelected
                        ? "border-blue-200 bg-blue-50 text-blue-600"
                        : "border-slate-100 bg-slate-50 text-slate-400"
                    }`}
                  >
                    {t(item.categoryKey)}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="text-center py-10 text-xs font-semibold text-slate-400">
              {t("commandPalette.noResults")}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 shrink-0 flex items-center justify-between text-[10px] font-bold text-slate-400 select-none">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="border rounded bg-white px-1 py-0.5 shadow-sm">↑</span>
              <span className="border rounded bg-white px-1 py-0.5 shadow-sm">↓</span>
              <span>{t("common.paletteNavigate")}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="border rounded bg-white px-1.5 py-0.5 shadow-sm">↵</span>
              <span>{t("common.paletteSelect")}</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <span className="border rounded bg-white px-1.5 py-0.5 shadow-sm">esc</span>
            <span>{t("common.paletteClose")}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
