import { Plus, Users, UsersRound, ClipboardList, PenLine } from "lucide-react";

const STATUS_BADGE = {
  ongoing:  { label: "Đang diễn ra", cls: "bg-success-bg text-success-text" },
  upcoming: { label: "Sắp diễn ra",  cls: "bg-warning-bg text-warning-text" },
};

/**
 * ClassHeader — "trung tâm chỉ huy" của lớp: identity + insight + hành động chính.
 */
export default function ClassHeader({
  classCode = "GD18D01",
  subject = "",
  semester = "",
  lecturer = "",
  semesterStatus = null,
  isNewlyCreated = false,
  studentCount = 0,
  groupCount = 0,
  assignmentCount = 0,
  needGradingCount = 0,
  canCreateGroup = false,
  onCreateGroup,
}) {
  const badge = STATUS_BADGE[semesterStatus];
  const initials = (classCode || "?").replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();

  const stats = [
    { label: "Sinh viên", value: studentCount, icon: Users, box: "bg-accent-bg", ic: "text-accent" },
    { label: "Nhóm", value: groupCount, icon: UsersRound, box: "bg-secondary-bg", ic: "text-secondary" },
    { label: "Bài tập", value: assignmentCount, icon: ClipboardList, box: "bg-warning-bg", ic: "text-warning" },
    { label: "Cần chấm", value: needGradingCount, icon: PenLine, box: "bg-success-bg", ic: "text-success" },
  ];

  return (
    <div className="rounded-card bg-surface shadow-card p-5 sm:p-6">
      {/* Identity + CTA */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="shrink-0 grid place-items-center w-14 h-14 rounded-2xl bg-linear-to-br from-accent-500 to-accent-400 text-white font-bold text-lg shadow-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold text-text-primary truncate">{classCode}</h1>
              {badge && (
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${badge.cls}`}>{badge.label}</span>
              )}
              {isNewlyCreated && !badge && (
                <span className="rounded-full px-2.5 py-1 text-[11px] font-medium bg-secondary-bg text-secondary">Mới tạo</span>
              )}
            </div>
            {(subject || semester) && (
              <p className="mt-1 text-sm text-text-secondary truncate">
                {subject}{subject && semester ? " · " : ""}{semester}
              </p>
            )}
            {lecturer && <p className="mt-0.5 text-xs text-text-muted truncate">Giảng viên: {lecturer}</p>}
          </div>
        </div>

        {canCreateGroup && (
          <button
            type="button"
            onClick={onCreateGroup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-control bg-accent hover:bg-accent-hover text-white text-sm font-medium shadow-sm hover:shadow-md transition-all duration-150 shrink-0 cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            Tạo nhóm
          </button>
        )}
      </div>

      {/* Insight strip */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-border pt-5">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3 min-w-0">
            <span className={`shrink-0 grid place-items-center w-9 h-9 rounded-xl ${s.box} ${s.ic} [&_svg]:w-[18px] [&_svg]:h-[18px]`}>
              <s.icon />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-semibold text-text-primary leading-none">{s.value}</p>
              <p className="mt-1 text-xs text-text-muted truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
