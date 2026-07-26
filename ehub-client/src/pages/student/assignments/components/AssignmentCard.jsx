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
      className="relative w-full rounded-card bg-surface shadow-card cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover group"
    >
      <div className="p-5">
        {/* Top row: status + class */}
        <div className="flex items-center gap-2 mb-3">
          <StatusBadge status={isOpen ? "success" : "neutral"} label={isOpen ? "Đang mở" : "Đã đóng"} />
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-accent-50 text-accent border border-accent-100">
            {classCode}
          </span>
          {isSubmitted && (
            <span className="ml-auto flex items-center gap-2">
              <StatusBadge status="success" label={isGraded ? "Đã chấm" : "Đã nộp"} />
              {isGraded && (
                <span className="text-lg font-medium text-text-primary">{score}/{maxScore}</span>
              )}
            </span>
          )}
          {isGraded && evaluation?.scores?.length ? (
            <span className="rounded-full bg-violet-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-600 border border-violet-100">
              Rubric
            </span>
          ) : null}
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-text-primary group-hover:text-accent transition-colors">
          {title}
        </h3>
        <p className="mt-1.5 text-sm text-text-secondary line-clamp-2 min-h-[40px] whitespace-pre-wrap">
          {description}
        </p>

        {/* Meta info */}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2 text-text-muted">
            <Calendar size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Hạn nộp: {formatDate(deadline)}</span>
          </div>
          <div className="flex items-center gap-2 text-text-muted">
            <Trophy size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Tối đa: {maxScore} điểm</span>
          </div>
        </div>

        {/* Action Prompt */}
        {!isSubmitted && isOpen && (
          <div className="mt-4 flex h-10 items-center justify-center rounded-control bg-accent px-4 text-sm font-medium text-white transition-colors">
             Nộp bài ngay
          </div>
        )}
      </div>
    </div>
  );
}
