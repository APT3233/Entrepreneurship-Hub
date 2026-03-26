import { useEffect } from "react";
import { X, Calendar, Check, Trophy } from "lucide-react";


// ── AssignmentDetailModal ─────────────────────────────────────────────────────
/**
 * Props:
 *  - assignment: Assignment | null   → null = hidden
 *  - onClose: () => void
 *  - onConfirm: (assignment) => void  → "Đóng bài" action
 */
export default function AssignmentDetailModal({ assignment, onClose, onConfirm }) {
  // Close on Escape key
  useEffect(() => {
    if (!assignment) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [assignment, onClose]);

  if (!assignment) return null;

  const {
    title,
    description,
    deadline,
    classCode,
    maxScore,
    totalGroups,
    submittedGroups,
    status,
  } = assignment;

  const notSubmitted = totalGroups - submittedGroups;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal panel */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="px-6 sm:px-8 pt-7 pb-6">

          {/* Title + description */}
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug pr-8">
            {title}
          </h2>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">
            {description}
          </p>

          {/* Deadline / class / max score */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={15} className="text-gray-400 shrink-0" />
              <span>Deadline: {deadline}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Lớp: <span className="font-medium">{classCode}</span></span>
              <span className="text-gray-300">|</span>
              <span>Điểm tối đa: <span className="font-medium">{maxScore}</span></span>
            </div>
          </div>

          {/* Divider */}
          <div className="my-5 border-t border-gray-100" />

          {/* Group submission summary */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-800">
              Danh sách nhóm: {totalGroups}
            </p>

            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <Check size={15} className="stroke-[2.5]" />
              <span>Đã nộp: <span className="font-medium">{submittedGroups}</span></span>
            </div>

            <div className="flex items-center gap-2 text-sm text-red-500">
              {/* Custom × icon to match design */}
              <span className="text-base leading-none font-bold">✕</span>
              <span>Chưa nộp: <span className="font-medium">{notSubmitted}</span></span>
            </div>
          </div>

          {/* Status */}
          <div className="mt-4 flex items-center gap-3 text-sm text-gray-700">
            <span className="font-medium">Trạng thái:</span>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => onConfirm(assignment)}
            className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors duration-150"
          >
            Đóng bài
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-sm font-semibold transition-colors duration-150"
          >
            Hủy
          </button>
        </div>

      </div>
    </div>
  );
}

// ── StatusBadge (open / closed) ───────────────────────────────────────────────
function StatusBadge({ status }) {
  const isOpen = status === "open";
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
        ${isOpen
          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
          : "bg-gray-100 text-gray-500 border border-gray-200"}
      `}
    >
      {isOpen ? "Đang mở" : "Đã đóng"}
    </span>
  );
}