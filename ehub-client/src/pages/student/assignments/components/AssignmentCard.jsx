import { Calendar, Trophy, Info } from "lucide-react";
import { formatDate } from "@/utils/dateTimeDisplay";
import StatusBadge from "@/components/ui/StatusBadge";

export default function AssignmentCard({ assignment, onClick }) {
  const {
    title,
    description,
    deadline,
    maxScore,
    status,
    classCode,
    submissionStatus,
    score,
    evaluation,
  } = assignment;

  const isSubmitted = submissionStatus === "submitted" || submissionStatus === "graded" || submissionStatus === "resubmitted";
  const isGraded = submissionStatus === "graded";
  const isOpen = status === "open";

  return (
    <div
      onClick={onClick}
      className="relative w-full rounded-card border border-border bg-surface cursor-pointer transition-colors duration-200 hover:border-border-strong group"
    >
      <div className="p-5">
        {/* Top row: status + class */}
        <div className="flex items-center gap-2 mb-3">
          <StatusBadge status={isOpen ? "success" : "neutral"} label={isOpen ? "Đang mở" : "Đã đóng"} />
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100">
            {classCode}
          </span>
          {isSubmitted && (
            <span className="ml-auto">
              <StatusBadge status="success" label={isGraded ? "Đã chấm" : "Đã nộp"} />
            </span>
          )}
          {isGraded && evaluation?.scores?.length ? (
            <span className="rounded-full bg-violet-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-600 border border-violet-100">
              Rubric
            </span>
          ) : null}
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
          {title}
        </h3>
        <p className="mt-1.5 text-sm text-gray-500 line-clamp-2 min-h-[40px] whitespace-pre-wrap">
          {description}
        </p>

        {/* Meta info */}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Hạn nộp: {formatDate(deadline)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Trophy size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Tối đa: {maxScore} điểm</span>
          </div>
          {isGraded && (
             <div className="flex items-center gap-2 text-indigo-600 font-bold ml-auto">
                <span className="text-[10px] uppercase tracking-widest">Điểm:</span>
                <span className="text-base font-black">{score}/{maxScore}</span>
             </div>
          )}
        </div>

        {/* Action Prompt */}
        {!isSubmitted && isOpen && (
          <div className="mt-4 flex items-center justify-center py-2 px-4 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95">
             Nộp bài ngay
          </div>
        )}
      </div>
    </div>
  );
}
