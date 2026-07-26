import React from "react";
import { Calendar, FileText, Target, Award } from "lucide-react";
import { formatDateTimeText } from "@/utils/dateTimeDisplay";

export default function CheckpointCard({ checkpoint, onDetail }) {
  const { 
    title, 
    deadline, 
    weight, 
    max_score, 
    submission_status, 
    description,
    order_index,
    score,
    feedback
  } = checkpoint;

  const isSubmitted = submission_status === "submitted" || submission_status === "graded" || submission_status === "resubmitted";
  const isGraded = submission_status === "graded";
  const isOverdue = !isSubmitted && deadline && new Date() > new Date(deadline);

  const getStatusInfo = () => {
    if (isGraded) return { label: "Đã chấm điểm", color: "bg-emerald-50 text-emerald-600 border-emerald-100/60" };
    if (isSubmitted) return { label: "Đã nộp bài", color: "bg-blue-50 text-blue-600 border-blue-100/60" };
    if (isOverdue) return { label: "Quá hạn nộp", color: "bg-rose-50 text-rose-600 border-rose-100/60" };
    return { label: "Chưa nộp bài", color: "bg-amber-50 text-amber-600 border-amber-100/60" };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="relative bg-surface rounded-[24px] border border-border/80 p-6 shadow-sm hover:shadow-xl hover:shadow-accent-500/5 transition-all duration-300 hover:border-accent-100/80 group overflow-hidden flex flex-col justify-between h-full">
      {/* Decorative colored glow on top edge based on status */}
      <div className={`absolute top-0 left-0 right-0 h-1 transition-colors duration-300 ${
        isGraded ? "bg-emerald-500" : isSubmitted ? "bg-blue-500" : isOverdue ? "bg-rose-500" : "bg-amber-500"
      }`} />

      <div>
        {/* Top Info Bar */}
        <div className="flex items-center justify-between mb-4">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider border shadow-sm ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          <span className="text-[10px] font-semibold text-text-secondary bg-subtle border border-border/80 rounded-lg px-2.5 py-1 uppercase tracking-widest">
            Thứ tự: {order_index}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors leading-snug tracking-tight">
          Checkpoint {order_index}: {title}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-text-secondary font-bold leading-relaxed mt-2 line-clamp-2 min-h-[40px] overflow-hidden">
          {description || "Chưa có mô tả chi tiết cho checkpoint này."}
        </p>

        {/* Technical Guidelines Cards */}
        <div className="grid grid-cols-2 gap-3 mt-5 mb-5">
          <div className="bg-subtle rounded-2xl p-3.5 border border-border/60 flex flex-col justify-between hover:bg-slate-100/60 transition-colors duration-200">
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Calendar size={14} className={isOverdue ? "text-rose-500 animate-pulse" : "text-accent-500"} />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Hạn nộp</span>
            </div>
            <p className={`text-xs font-semibold mt-2 leading-none ${isOverdue ? "text-rose-600" : "text-text-primary"}`}>
              {formatDateTimeText(deadline)}
            </p>
          </div>
          
          <div className="bg-subtle rounded-2xl p-3.5 border border-border/60 flex flex-col justify-between hover:bg-slate-100/60 transition-colors duration-200">
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Target size={14} className="text-violet-500" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Trọng số</span>
            </div>
            <p className="text-xs font-semibold text-text-primary mt-2 leading-none">
              {(weight * 100).toFixed(0)}% <span className="text-[9px] text-text-secondary font-bold">(Max: {max_score})</span>
            </p>
          </div>
        </div>

        {/* Graded Mini Panel */}
        {isGraded && (
          <div className="mb-5 p-4 bg-gradient-to-r from-accent-50/40 to-purple-50/40 rounded-2xl border border-accent-100/60 relative overflow-hidden flex flex-col justify-between shadow-inner">
            <div className="absolute right-2 bottom-1 opacity-[0.03] select-none pointer-events-none text-5xl font-semibold text-accent-900">A+</div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-accent uppercase tracking-widest flex items-center gap-1">
                <Award size={14} className="text-accent" /> Kết quả chấm
              </span>
              <span className="text-sm font-semibold text-accent bg-surface px-2.5 py-1 rounded-lg border border-accent-200/50 shadow-sm leading-none flex items-baseline gap-0.5">
                {Number(score)}<span className="text-[10px] text-text-secondary font-bold">/{Number(max_score)}</span>
              </span>
            </div>
            {feedback && (
              <p className="text-xs text-text-secondary font-extrabold italic pl-0.5 line-clamp-1 leading-relaxed">
                "{feedback}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-50 mt-auto">
        <button 
          onClick={onDetail}
          className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 cursor-pointer shadow-md ${
            isSubmitted
              ? "bg-subtle hover:bg-accent-50 hover:text-accent hover:border-accent-200/50 border border-border text-text-secondary shadow-none"
              : isOverdue
                ? "bg-slate-100 text-text-muted border border-border cursor-not-allowed shadow-none"
                : "bg-accent hover:bg-accent-hover text-white shadow-accent-100 hover:shadow-lg"
          }`}
          disabled={!isSubmitted && isOverdue}
        >
          <FileText size={14} />
          {isSubmitted ? "Xem chi tiết bài nộp" : isOverdue ? "Đã quá hạn nộp" : "Nộp bài ngay"}
        </button>
      </div>
    </div>
  );
}
