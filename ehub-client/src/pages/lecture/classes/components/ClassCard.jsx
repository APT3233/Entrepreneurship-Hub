import { Users, BarChart2 } from "lucide-react";
import { GroupIcon } from "@/components/icons/lecture";
import StatusBadge from "@/components/ui/StatusBadge";

/**
 * ClassCard
 *
 * Props:
 * - code        : string   — Mã lớp (vd: "GD18D01")
 * - subject     : string   — Môn + học kỳ (vd: "EXE101 - Học kì Fall 2026")
 * - students    : number
 * - groups      : number
 * - completion  : number   — % hoàn thành (0–100)
 * - avatars     : string[] — mảng URL ảnh đại diện (tối đa hiển thị 3)
 * - onDetail    : () => void
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

  // If no actual avatars are provided, we show up to 3 placeholder avatars based on student count
  const placeholderCount = shownAvatars.length === 0 ? Math.min(students, 3) : 0;
  const placeholders = Array.from({ length: placeholderCount });

  return (
    <div className="w-full min-w-0 rounded-card overflow-hidden border border-border bg-surface">

      {/* ── Header ── */}
      <div className="px-4 py-4 sm:px-5 sm:py-5 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base sm:text-lg font-medium text-text-primary truncate">{code}</h2>
          {semesterStatus === "upcoming" && (
            <StatusBadge status="warning" label="Sắp diễn ra" />
          )}
          {semesterStatus === "ongoing" && (
            <StatusBadge status="success" label="Đang diễn ra" />
          )}
        </div>
        <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">{subject}</p>
      </div>

      {/* ── Body ── */}
      <div className="px-4 py-4 sm:px-5 sm:py-5 flex flex-col gap-4 sm:gap-5">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
          <div className="flex flex-col items-center gap-1.5 sm:gap-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-control bg-subtle flex items-center justify-center">
              <Users size={20} className="text-text-muted sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-lg font-medium text-text-primary">{students}</p>
              <p className="text-label text-text-secondary">Sinh viên</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5 sm:gap-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-control bg-subtle flex items-center justify-center">
              <GroupIcon />
            </div>
            <div>
              <p className="text-lg font-medium text-text-primary">{groups}</p>
              <p className="text-label text-text-secondary">Nhóm</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5 sm:gap-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-control bg-subtle flex items-center justify-center">
              <BarChart2 size={20} className="text-text-muted sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-lg font-medium text-text-primary">{completion}%</p>
              <p className="text-label text-text-secondary">Hoàn thành</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Footer: avatars + button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center min-w-0">
            {shownAvatars.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                style={{ marginLeft: i === 0 ? 0 : "-8px", zIndex: shownAvatars.length - i }}
                className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-surface object-cover shrink-0"
              />
            ))}
            {placeholders.map((_, i) => (
              <div
                key={i}
                style={{ marginLeft: i === 0 ? 0 : "-8px", zIndex: 3 - i }}
                className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-surface bg-subtle flex items-center justify-center shrink-0"
              >
                <Users size={12} className="text-text-muted" />
              </div>
            ))}
            {extraCount > 0 && (
              <span className="ml-1.5 sm:ml-2 text-label text-text-secondary shrink-0">+{extraCount}</span>
            )}
          </div>
          <button
            onClick={onDetail}
            className="h-9 px-4 sm:px-5 rounded-control bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors shrink-0 cursor-pointer"
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}
