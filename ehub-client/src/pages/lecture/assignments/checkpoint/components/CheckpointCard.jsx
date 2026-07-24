import { Calendar, FileText, Target, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/utils/dateTimeDisplay";
import StatusBadge from "@/components/ui/StatusBadge";

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

  const isExpired = deadline ? new Date() > new Date(deadline) : false;
  const progress = total_groups > 0 ? (submitted_groups / total_groups) * 100 : 0;

  const getStatusInfo = (status) => {
    switch (status) {
      case "open":
        return { label: "Đang mở", tone: "success" };
      case "closed":
        return { label: "Đã đóng", tone: "neutral" };
      case "draft":
        return { label: "Bản nháp", tone: "warning" };
      default:
        return { label: status, tone: "neutral" };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <div className="relative bg-surface rounded-card border border-border p-6 transition-colors hover:border-border-strong">
      {(status === "draft" && (checkpoint.graded_count || 0) === 0) && (
        <button
          onClick={onDelete}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-control bg-danger-bg text-danger-text hover:brightness-95 transition-colors cursor-pointer z-10"
          title="Xóa bản nháp"
        >
          <Trash2 size={14} />
        </button>
      )}
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={statusInfo.tone} label={statusInfo.label} />
            <span className="text-label text-text-muted">
              Thứ tự: {order_index}
            </span>
          </div>
          <h3 className="text-base font-medium text-text-primary leading-snug">
            Checkpoint {order_index}: {title}
          </h3>
          <p className="text-sm text-text-secondary mt-1 line-clamp-2 min-h-[40px] whitespace-pre-wrap">
            {description || "Chưa có mô tả chi tiết cho checkpoint này."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Calendar size={14} />
            <span className="text-label">Hạn nộp</span>
          </div>
          <p className={`text-sm font-medium ${isExpired ? "text-danger-text" : "text-text-primary"}`}>
            {formatDate(deadline)}
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Target size={14} />
            <span className="text-label">Trọng số</span>
          </div>
          <p className="text-sm font-medium text-text-primary">
            {(weight * 100).toFixed(0)}% (Max: {max_score})
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-label text-text-secondary">Tiến độ nộp bài</span>
          <span className="text-label text-text-primary font-medium">{submitted_groups}/{total_groups} nhóm</span>
        </div>
        <div className="h-2 w-full bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <button
          onClick={onEdit}
          className="flex-1 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-control bg-subtle hover:bg-border text-text-secondary text-sm font-medium transition-colors cursor-pointer"
        >
          <Pencil size={14} />
          Chỉnh sửa
        </button>
        <button
          onClick={onDetail}
          className="flex-1 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-control bg-surface border border-border hover:bg-subtle text-text-secondary text-sm font-medium transition-colors cursor-pointer"
        >
          <FileText size={14} />
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}
