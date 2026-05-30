import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarDays,
  GraduationCap,
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
} from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

const commandItems = [
  { labelKey: "nav.dashboard", path: "/admin/dashboard", icon: LayoutDashboard, categoryTag: "WORKSPACE" },
  { labelKey: "nav.users", path: "/admin/users", icon: Users, categoryTag: "WORKSPACE" },
  
  { labelKey: "nav.subjects", path: "/admin/academic/subjects", icon: BookOpen, categoryTag: "ACADEMIC" },
  { labelKey: "nav.semesters", path: "/admin/academic/semesters", icon: CalendarDays, categoryTag: "ACADEMIC" },
  { labelKey: "nav.classes", path: "/admin/academic/classes", icon: GraduationCap, categoryTag: "ACADEMIC" },
  
  { labelKey: "nav.students", path: "/admin/students", icon: Users, categoryTag: "STUDENTS & GROUPS" },
  { labelKey: "nav.enrollments", path: "/admin/enrollments", icon: UserPlus, categoryTag: "STUDENTS & GROUPS" },
  { labelKey: "nav.groups", path: "/admin/groups", icon: UsersRound, categoryTag: "STUDENTS & GROUPS" },
  { labelKey: "nav.groupInvites", path: "/admin/group-invites", icon: MailWarning, categoryTag: "STUDENTS & GROUPS" },
  { labelKey: "nav.groupReports", path: "/admin/group-reports", icon: TriangleAlert, categoryTag: "STUDENTS & GROUPS" },
  
  { labelKey: "nav.projects", path: "/admin/projects", icon: FolderKanban, categoryTag: "PROJECT SUBMISSIONS" },
  { labelKey: "nav.checkpoints", path: "/admin/checkpoints", icon: ClipboardCheck, categoryTag: "PROJECT SUBMISSIONS" },
  { labelKey: "nav.checkpointSubmissions", path: "/admin/checkpoint-submissions", icon: ClipboardList, categoryTag: "PROJECT SUBMISSIONS" },
  { labelKey: "nav.assignments", path: "/admin/assignments", icon: BookOpen, categoryTag: "PROJECT SUBMISSIONS" },
  { labelKey: "nav.assignmentSubmissions", path: "/admin/assignment-submissions", icon: ClipboardList, categoryTag: "PROJECT SUBMISSIONS" },
  { labelKey: "nav.submissionFiles", path: "/admin/submission-files", icon: Files, categoryTag: "PROJECT SUBMISSIONS" },
  
  { labelKey: "nav.evaluationOverview", path: "/admin/evaluation", icon: BarChart3, categoryTag: "EVALUATION" },
  { labelKey: "nav.evaluationSessions", path: "/admin/evaluation/sessions", icon: ClipboardCheck, categoryTag: "EVALUATION" },
  { labelKey: "nav.evaluationResults", path: "/admin/evaluation/results", icon: ClipboardList, categoryTag: "EVALUATION & LOGS" },
  { labelKey: "nav.gradingProgress", path: "/admin/evaluation/progress", icon: ClipboardList, categoryTag: "EVALUATION" },
  { labelKey: "nav.rubricUsage", path: "/admin/evaluation/rubric-usage", icon: Layers3, categoryTag: "EVALUATION" },
  { labelKey: "nav.gradeAudit", path: "/admin/evaluation/grade-audit", icon: History, categoryTag: "EVALUATION" },
  { labelKey: "nav.exportScores", path: "/admin/evaluation/exports", icon: FileUp, categoryTag: "EVALUATION" },
  { labelKey: "nav.rubrics", path: "/admin/evaluation/rubrics", icon: ClipboardCheck, categoryTag: "EVALUATION & LOGS" },
  { labelKey: "nav.gradingConfig", path: "/admin/evaluation/grading-config", icon: Settings, categoryTag: "EVALUATION & LOGS" },
  { labelKey: "nav.evaluationAnalytics", path: "/admin/evaluation/analytics", icon: BarChart3, categoryTag: "EVALUATION & LOGS" },
  { labelKey: "nav.importExport", path: "/admin/import-export", icon: FileUp, categoryTag: "EVALUATION & LOGS" },
  { labelKey: "nav.invitations", path: "/admin/invitations", icon: Send, categoryTag: "EVALUATION & LOGS" },
  { labelKey: "nav.auditLogs", path: "/admin/logs/audit", icon: History, categoryTag: "EVALUATION & LOGS" },
  { labelKey: "nav.apiAccessLogs", path: "/admin/logs/api-access", icon: Cloud, categoryTag: "EVALUATION & LOGS" },
  { labelKey: "nav.importLogs", path: "/admin/logs/import", icon: Files, categoryTag: "EVALUATION & LOGS" },
  
  { labelKey: "nav.roles", path: "/admin/roles", icon: ShieldCheck, categoryTag: "ACCESS CONTROL" },
  { labelKey: "nav.permissions", path: "/admin/permissions", icon: KeyRound, categoryTag: "ACCESS CONTROL" },
  { labelKey: "nav.settings", path: "/admin/settings", icon: Settings, categoryTag: "ACCESS CONTROL" },
];

export default function CommandPalette({ isOpen, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Focus search input when modal opens
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

  // Click outside to close
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

  // Filter items dynamically
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return commandItems;
    return commandItems.filter((item) => {
      const label = t(item.labelKey).toLowerCase();
      const cat = item.categoryTag.toLowerCase();
      return label.includes(query) || cat.includes(query);
    });
  }, [search, t]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          navigate(filteredItems[selectedIndex].path);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose, navigate]);

  // Sync scroll on keyboard selection
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
        {/* Header Search Input */}
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
            placeholder={t("header.searchPlaceholder") || "Search pages, actions..."}
            className="w-full bg-transparent border-none outline-none text-sm font-semibold text-slate-800 placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 select-none">
            esc
          </kbd>
        </div>

        {/* Scrollable Results */}
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
                    {item.categoryTag}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="text-center py-10 text-xs font-semibold text-slate-400">
              {t("common.noData") || "No matching items found."}
            </div>
          )}
        </div>

        {/* Keybinding instructions footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 shrink-0 flex items-center justify-between text-[10px] font-bold text-slate-400 select-none">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="border rounded bg-white px-1 py-0.5 shadow-sm">↑</span>
              <span className="border rounded bg-white px-1 py-0.5 shadow-sm">↓</span>
              <span>{t("common.confirm") === "Xác nhận" ? "di chuyển" : "navigate"}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="border rounded bg-white px-1.5 py-0.5 shadow-sm">↵</span>
              <span>{t("common.confirm") === "Xác nhận" ? "chọn" : "select"}</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <span className="border rounded bg-white px-1.5 py-0.5 shadow-sm">esc</span>
            <span>{t("common.confirm") === "Xác nhận" ? "đóng" : "close"}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
