import { Calendar, FileText, Target, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/utils/dateTimeDisplay";

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
    if (isGraded) return { label: "Đã chấm", color: "bg-emerald-50 text-emerald-600 border-emerald-100" };
    if (isSubmitted) return { label: "Đã nộp", color: "bg-blue-50 text-blue-600 border-blue-100" };
    if (isOverdue) return { label: "Quá hạn", color: "bg-rose-50 text-rose-600 border-rose-100" };
    return { label: "Chưa nộp", color: "bg-amber-50 text-amber-600 border-amber-100" };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="relative bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
             <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Thứ tự: {order_index}
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug">
            Checkpoint {order_index}: {title}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-[40px]">
            {description || "Chưa có mô tả chi tiết cho checkpoint này."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Calendar size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Hạn nộp</span>
          </div>
          <p className={`text-xs font-bold ${isOverdue ? "text-rose-500" : "text-gray-700"}`}>
            {formatDate(deadline)}
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Target size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Trọng số</span>
          </div>
          <p className="text-xs font-bold text-gray-700">
            {(weight * 100).toFixed(0)}% (Max: {max_score})
          </p>
        </div>
      </div>

      {isGraded && (
        <div className="mb-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
           <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Điểm số đạt được</span>
              <span className="text-lg font-black text-indigo-600">{Number(score)}/{Number(max_score)}</span>
           </div>
           {feedback && (
             <p className="text-xs text-indigo-900/70 italic line-clamp-1">"{feedback}"</p>
           )}
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
        <button 
          onClick={onDetail}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-100 cursor-pointer active:scale-95"
        >
          <CheckCircle2 size={14} />
          {isSubmitted ? "Xem bài nộp" : "Nộp bài ngay"}
        </button>
      </div>
    </div>
  );
}
