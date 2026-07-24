import { Calendar, Trophy, CheckCircle2, Info } from "lucide-react";
import { formatDate } from "@/utils/dateTimeDisplay";

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
      className="relative w-full rounded-xl border border-gray-200 bg-white cursor-pointer transition-all duration-200 hover:border-indigo-300 hover:shadow-md group"
    >
      <div className="p-5">
        {/* Top row: status + class */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              isOpen
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            {isOpen ? "Đang mở" : "Đã đóng"}
          </span>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100">
            {classCode}
          </span>
          {isSubmitted && (
            <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
              <CheckCircle2 size={12} />
              {isGraded ? "Đã chấm" : "Đã nộp"}
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
