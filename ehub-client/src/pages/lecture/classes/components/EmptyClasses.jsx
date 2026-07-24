import { Plus, Users, BookOpen, TrendingUp, MonitorPlay } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

const FEATURES = [
  {
    icon: <Users size={22} className="text-text-muted" />,
    title: "Quản lý sinh viên",
    desc: "Theo dõi danh sách và điểm danh",
  },
  {
    icon: <BookOpen size={22} className="text-text-muted" />,
    title: "Tài liệu học tập",
    desc: "Chia sẻ bài giảng và tài liệu",
  },
  {
    icon: <TrendingUp size={22} className="text-text-muted" />,
    title: "Theo dõi tiến độ",
    desc: "Xem báo cáo và thống kê",
  },
];

/**
 * EmptyClasses
 *
 * Props:
 * - onCreate : () => void  — callback nút "Tạo lớp học"
 */
export default function EmptyClasses({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[60vh] px-4">
      <EmptyState
        icon={<MonitorPlay size={24} />}
        title="Bạn chưa tạo lớp học nào"
        description="Hãy bắt đầu bằng cách tạo lớp học đầu tiên để quản lý sinh viên và bài giảng."
        action={
          onCreate ? (
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-control bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Tạo lớp học
            </button>
          ) : null
        }
      />

      {/* Divider */}
      <div className="w-full max-w-lg border-t border-border my-8" />

      {/* Feature hints */}
      <div className="grid grid-cols-3 gap-4 md:gap-8 w-full max-w-lg">
        {FEATURES.map(({ icon, title, desc }) => (
          <div key={title} className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
              {icon}
            </div>
            <p className="text-sm font-medium text-text-primary leading-tight">
              {title}
            </p>
            <p className="text-label text-text-secondary leading-snug hidden sm:block">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
