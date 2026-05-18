import { Calendar, FileText, Target, Pencil, Trash2 } from "lucide-react";
const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} | ${hours}:${minutes}`;
};

export default function CheckpointCard({ checkpoint, onEdit, onDetail, onDelete }) {
  const { 
    title, 
    deadline, 
    weight, 
    max_score, 
    status, 
    description,
    order_index,
    submitted_groups = 0,
    total_groups = 0
  } = checkpoint;

  const formattedDeadline = formatDate(deadline);
  const isExpired = deadline ? new Date() > new Date(deadline) : false;
  const progress = total_groups > 0 ? (submitted_groups / total_groups) * 100 : 0;

  const getStatusInfo = (status) => {
    switch (status) {
      case "open":
        return { label: "Đang mở", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "closed":
        return { label: "Đã đóng", color: "bg-slate-100 text-slate-700 border-slate-200" };
      case "draft":
        return { label: "Bản nháp", color: "bg-amber-50 text-amber-700 border-amber-200" };
      default:
        return { label: status, color: "bg-gray-100 text-gray-600 border-gray-200" };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <div className="relative bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
      {(status === "draft" && (checkpoint.graded_count || 0) === 0) && (
        <button 
          onClick={onDelete}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 z-10"
          title="Xóa bản nháp"
        >
          <Trash2 size={14} />
        </button>
      )}
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
          <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-[40px] whitespace-pre-wrap">
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
          <p className={`text-xs font-bold ${isExpired ? "text-rose-500" : "text-gray-700"}`}>
            {formattedDeadline}
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

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tiến độ nộp bài</span>
          <span className="text-[10px] font-bold text-indigo-600">{submitted_groups}/{total_groups} Nhóm</span>
        </div>
        <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
        <button 
          onClick={onEdit}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 text-xs font-bold transition-all cursor-pointer"
        >
          <Pencil size={14} />
          Chỉnh sửa
        </button>
        <button 
          onClick={onDetail}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 text-gray-500 hover:text-indigo-600 text-xs font-bold transition-all cursor-pointer"
        >
          <FileText size={14} />
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}
