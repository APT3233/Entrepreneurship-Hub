import { Pencil, Trash2, Calendar, Trophy } from "lucide-react";
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

  const formatDate = (dateString) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative w-full rounded-xl border bg-white cursor-pointer
        transition-all duration-200
        ${isSelected
          ? "border-indigo-400 ring-2 ring-indigo-100 shadow-sm"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"}
      `}
    >
      <div className="p-4 sm:p-5">
        {/* Top row: title + actions */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 leading-snug">
            {title}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(assignment); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors duration-150"
            >
              <Pencil size={13} />
              <span className="hidden sm:inline">Sửa</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(assignment); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-500 bg-white hover:bg-red-50 hover:border-red-300 transition-colors duration-150"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Xóa</span>
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="mt-1.5 text-xs sm:text-sm text-gray-500 leading-relaxed line-clamp-2 whitespace-pre-wrap">
          {description}
        </p>

        {/* Meta row: deadline + max score */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar size={13} className="text-gray-400" />
            Hạn nộp: {formatDate(deadline)}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Trophy size={13} className="text-gray-400" />
            Điểm tối đa: {maxScore}
          </span>
        </div>

        {/* Bottom row: badges + submission count */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <ClassTag classCode={classCode} />
          </div>
          <span className="text-xs text-gray-400 font-medium">
            {submittedGroups}/{totalGroups} nhóm đã nộp
          </span>
        </div>
      </div>
    </div>
  );
}
