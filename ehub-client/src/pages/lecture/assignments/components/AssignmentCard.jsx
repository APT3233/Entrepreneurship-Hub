import { Pencil, Trash2, Calendar, Trophy } from "lucide-react";
import { formatDateTimeText } from "@/utils/dateTimeDisplay";
import StatusBadge from "./StatusBadge";
import ClassTag from "./ClassTag";

export default function AssignmentCard({ assignment, isSelected, onEdit, onDelete, onClick }) {
  const {
    title,
    description,
    deadline,
    maxScore,
    status,
    classCode,
    submittedGroups,
    totalGroups,
  } = assignment;

  const progressPercent = totalGroups ? Math.round((submittedGroups / totalGroups) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className={`
        relative w-full rounded-card border bg-surface cursor-pointer overflow-hidden
        transition-colors
        ${isSelected ? "border-border-strong" : "border-border hover:border-border-strong"}
      `}
    >
      <div className="p-5 sm:p-6 flex flex-col justify-between h-full">
        <div>
          {/* Top Row: Tags + Edit/Delete Actions */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <ClassTag classCode={classCode} />
              <StatusBadge status={status} />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(assignment); }}
                className="flex items-center gap-1.5 h-8 px-3 rounded-control text-xs font-medium text-text-secondary bg-subtle hover:bg-border transition-colors cursor-pointer"
              >
                <Pencil size={12} />
                <span>Sửa</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onDelete(assignment); }}
                className="flex items-center gap-1.5 h-8 px-3 rounded-control text-xs font-medium text-danger-text bg-danger-bg hover:brightness-95 transition-colors cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Xóa</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base font-medium text-text-primary leading-snug mt-3">
            {title}
          </h3>

          {/* Description */}
          <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-2 min-h-[40px] whitespace-pre-wrap">
            {description || "Chưa có mô tả chi tiết cho bài tập này."}
          </p>

          {/* Technical Info Cards */}
          <div className="grid grid-cols-2 gap-3 mt-5 mb-5">
            <div className="bg-subtle rounded-control p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Calendar size={14} className="text-text-muted" />
                <span className="text-label text-text-secondary">Hạn nộp</span>
              </div>
              <p className="text-sm font-medium text-text-primary mt-2 leading-none">
                {formatDateTimeText(deadline)}
              </p>
            </div>

            <div className="bg-subtle rounded-control p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Trophy size={14} className="text-text-muted" />
                <span className="text-label text-text-secondary">Điểm tối đa</span>
              </div>
              <p className="text-sm font-medium text-text-primary mt-2 leading-none">
                {maxScore} <span className="text-label text-text-secondary">điểm</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Submission Progress Bar */}
        <div className="pt-4 border-t border-border mt-auto">
          <div className="flex items-center justify-between text-sm text-text-secondary mb-1.5">
            <span>Tiến độ nộp bài</span>
            <span className="text-text-primary font-medium">
              {submittedGroups}/{totalGroups} nhóm
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
