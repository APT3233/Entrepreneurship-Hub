import { MonitorPlay } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

/**
 * RecentClassesEmpty
 *
 * Props:
 * - onViewAll : () => void
 * - onCreate  : () => void  (optional — nếu muốn thêm nút tạo lớp)
 */
export default function RecentClassesEmpty({ onViewAll, onCreate }) {
  return (
    <div className="bg-surface rounded-card border border-border p-5 w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-medium text-text-primary">Lớp học gần đây</h2>
        <button
          onClick={onViewAll}
          className="text-sm font-medium text-accent hover:text-accent-hover transition-colors duration-150 cursor-pointer"
        >
          Xem tất cả
        </button>
      </div>

      {/* Empty state */}
      <EmptyState
        icon={<MonitorPlay size={24} />}
        title="Bạn chưa tạo lớp học nào"
        description="Hãy bắt đầu bằng cách tạo lớp học đầu tiên để quản lý sinh viên và bài giảng."
        action={
          onCreate ? (
            <button
              onClick={onCreate}
              className="inline-flex items-center h-9 px-4 rounded-control bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer"
            >
              Tạo lớp học
            </button>
          ) : null
        }
      />
    </div>
  );
}
