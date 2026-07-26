import { Users, BookOpen } from "lucide-react";

const STATUS_BADGE = {
  ongoing:  { label: "Đang diễn ra", cls: "bg-success-bg text-success-text" },
  upcoming: { label: "Sắp diễn ra",  cls: "bg-warning-bg text-warning-text" },
};

/**
 * ClassCard — thẻ lớp học (premium: nền trắng, màu hạn chế, progress + avatar stack).
 *
 * Props:
 * - code, subject, students, groups, completion (0–100), avatars[], semesterStatus, onDetail
 */
export default function ClassCard({
  code       = "GD18D01",
  subject    = "EXE101 - Học kì Fall 2026",
  students   = 32,
  groups     = 6,
  completion = 85,
  avatars    = [],
  semesterStatus = null,
  onDetail,
}) {
  const shownAvatars = avatars.slice(0, 3);
  const extraCount = Math.max(0, students - 3);
  const placeholderCount = shownAvatars.length === 0 ? Math.min(students, 3) : 0;
  const placeholders = Array.from({ length: placeholderCount });
  const badge = STATUS_BADGE[semesterStatus];

  return (
    <div className="group w-full min-w-0 rounded-card bg-surface p-5 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover">

      {/* Header: mã lớp + môn + badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-accent-bg text-accent">
            <BookOpen size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-text-primary truncate leading-tight">{code}</h3>
            <p className="text-sm text-text-secondary truncate mt-0.5">{subject}</p>
          </div>
        </div>
        {badge && (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-5">
        <div className="flex flex-col">
          <span className="text-2xl font-semibold text-text-primary leading-none">{students}</span>
          <span className="mt-1.5 text-xs text-text-muted">Sinh viên</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-semibold text-text-primary leading-none">{groups}</span>
          <span className="mt-1.5 text-xs text-text-muted">Nhóm</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-semibold text-text-primary leading-none">{completion}%</span>
          <span className="mt-1.5 text-xs text-text-muted">Hoàn thành</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-4 h-1.5 w-full rounded-full bg-subtle overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${Math.min(100, Math.max(0, completion))}%` }}
        />
      </div>

      {/* Footer: avatars + CTA */}
      <div className="flex items-center justify-between gap-2 mt-5 pt-4 border-t border-border">
        <div className="flex items-center min-w-0">
          {shownAvatars.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              style={{ marginLeft: i === 0 ? 0 : "-8px", zIndex: shownAvatars.length - i }}
              className="relative w-8 h-8 rounded-full border-2 border-surface object-cover shrink-0"
            />
          ))}
          {placeholders.map((_, i) => (
            <div
              key={i}
              style={{ marginLeft: i === 0 ? 0 : "-8px", zIndex: 3 - i }}
              className="relative w-8 h-8 rounded-full border-2 border-surface bg-subtle flex items-center justify-center shrink-0"
            >
              <Users size={13} className="text-text-muted" />
            </div>
          ))}
          {extraCount > 0 && (
            <span className="ml-2 text-xs text-text-muted font-medium shrink-0">+{extraCount}</span>
          )}
        </div>
        <button
          onClick={onDetail}
          className="px-4 py-2 rounded-control bg-accent hover:bg-accent-hover active:scale-[0.98] text-white text-sm font-medium transition-all duration-150 shrink-0 cursor-pointer"
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}
