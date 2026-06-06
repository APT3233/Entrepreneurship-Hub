import React from "react";
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
        relative w-full rounded-[24px] border bg-white cursor-pointer overflow-hidden
        transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5
        ${isSelected
          ? "border-slate-800 shadow-md"
          : "border-slate-100/80 hover:border-slate-200/80"}
      `}
    >
      {/* Decorative colored glow on top edge based on submission progress */}
      <div className={`absolute top-0 left-0 right-0 h-1 transition-colors duration-300 ${
        progressPercent === 100
          ? "bg-emerald-500"
          : status === "open"
            ? "bg-indigo-500"
            : "bg-slate-300"
      }`} />

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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-black text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-850 hover:border-slate-300 transition-all duration-150 shadow-sm active:scale-95 cursor-pointer"
              >
                <Pencil size={12} />
                <span>Sửa</span>
              </button>
              
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(assignment); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-100 text-xs font-black text-rose-500 bg-white hover:bg-rose-50 hover:border-rose-200 transition-all duration-150 shadow-sm active:scale-95 cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Xóa</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug tracking-tight mt-3">
            {title}
          </h3>

          {/* Description */}
          <p className="mt-2 text-sm text-slate-600 font-bold leading-relaxed line-clamp-2 min-h-[40px] whitespace-pre-wrap">
            {description || "Chưa có mô tả chi tiết cho bài tập này."}
          </p>

          {/* Technical Info Cards */}
          <div className="grid grid-cols-2 gap-3 mt-5 mb-5">
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/60 flex flex-col justify-between hover:bg-slate-100/60 transition-colors duration-200">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hạn nộp</span>
              </div>
              <p className="text-xs font-black text-slate-800 mt-2 leading-none">
                {formatDateTimeText(deadline)}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/60 flex flex-col justify-between hover:bg-slate-100/60 transition-colors duration-200">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Trophy size={14} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Điểm tối đa</span>
              </div>
              <p className="text-xs font-black text-slate-800 mt-2 leading-none">
                {maxScore} <span className="text-[9px] text-slate-500 font-bold font-black">điểm</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Submission Progress Bar */}
        <div className="pt-4 border-t border-slate-50 mt-auto">
          <div className="flex items-center justify-between text-xs font-black text-slate-500 mb-1.5">
            <span>Tiến độ nộp bài</span>
            <span className="text-slate-700 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
              {submittedGroups}/{totalGroups} nhóm
            </span>
          </div>
          
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/20 shadow-inner flex">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                progressPercent === 100
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-indigo-500 to-violet-500"
              }`} 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
