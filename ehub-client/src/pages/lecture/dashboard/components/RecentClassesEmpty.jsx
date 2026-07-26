import { MonitorPlay, Plus } from "lucide-react";

/**
 * RecentClassesEmpty
 *
 * Props:
 * - onViewAll : () => void
 * - onCreate  : () => void  (optional — nếu muốn thêm nút tạo lớp)
 */
export default function RecentClassesEmpty({ onViewAll, onCreate }) {
  return (
    <div className="bg-surface rounded-card shadow-card p-5 sm:p-6 w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-text-primary">Lớp học gần đây</h2>
        <button
          onClick={onViewAll}
          className="text-sm font-medium text-accent hover:text-accent-hover transition-colors duration-150 cursor-pointer"
        >
          Xem tất cả
        </button>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-10 sm:py-14 px-4 text-center gap-4">

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center ring-1 ring-accent-100">
          <MonitorPlay size={28} className="text-accent" />
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-bold text-text-primary">
            Bạn chưa tạo lớp học nào
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed max-w-[320px]">
            Hãy bắt đầu bằng cách tạo lớp học đầu tiên để quản lý sinh viên và bài giảng
          </p>
        </div>

        {/* CTA */}
        {onCreate && (
          <button
            onClick={onCreate}
            className="mt-1 inline-flex items-center gap-2 rounded-control bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-accent-hover hover:shadow-md cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            Tạo lớp học
          </button>
        )}

      </div>
    </div>
  );
}
