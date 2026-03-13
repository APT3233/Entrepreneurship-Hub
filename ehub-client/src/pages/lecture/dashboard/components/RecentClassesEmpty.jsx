import { MonitorPlay } from "lucide-react";

/**
 * RecentClassesEmpty
 *
 * Props:
 * - onViewAll : () => void
 * - onCreate  : () => void  (optional — nếu muốn thêm nút tạo lớp)
 */
export default function RecentClassesEmpty({ onViewAll, onCreate }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-92">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-bold text-gray-900">Lớp học gần đây</h2>
        <button
          onClick={onViewAll}
          className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors duration-150 cursor-pointer"
        >
          Xem tất cả
        </button>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-3">

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-1">
          <MonitorPlay size={28} className="text-indigo-500" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900">
          Bạn chưa tạo lớp học nào
        </h3>

        {/* Subtitle */}
        <p className="text-sm text-gray-400 leading-relaxed max-w-[260px]">
          Hãy bắt đầu bằng cách tạo lớp học đầu tiên của bạn
          <br />
          để quản lý sinh viên và bài giảng
        </p>

      </div>
    </div>
  );
}