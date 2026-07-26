import { Plus, Users, BookOpen, TrendingUp, MonitorPlay } from "lucide-react";

const FEATURES = [
  {
    icon: <Users size={28} className="text-accent-500" />,
    title: "Quản lý sinh viên",
    desc: "Theo dõi danh sách và điểm danh",
  },
  {
    icon: <BookOpen size={28} className="text-green-500" />,
    title: "Tài liệu học tập",
    desc: "Chia sẻ bài giảng và tài liệu",
  },
  {
    icon: <TrendingUp size={28} className="text-purple-500" />,
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
    <div className="flex flex-col items-center justify-center w-full min-h-[60vh] px-4 py-12">

      {/* Illustration icon */}
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent-100 flex items-center justify-center mb-5 shadow-inner">
        <MonitorPlay size={32} className="text-accent-500 md:hidden" />
        <MonitorPlay size={38} className="text-accent-500 hidden md:block" />
      </div>

      {/* Title */}
      <h2 className="text-xl md:text-2xl font-bold text-text-primary text-center mb-2">
        Bạn chưa tạo lớp học nào
      </h2>

      {/* Subtitle — 2 dòng, hiển thị đủ chữ */}
      <p className="text-sm md:text-base text-text-muted text-center max-w-xs leading-relaxed mb-7">
        Hãy bắt đầu bằng cách tạo lớp học đầu tiên của bạn
        <br />
        để quản lý sinh viên và bài giảng
      </p>

      {/* CTA button */}
      <button
        onClick={onCreate}
        className="
          flex items-center gap-2 px-7 py-3 rounded-2xl
          bg-accent hover:bg-accent-hover active:scale-95
          text-white text-sm md:text-base font-semibold
          shadow-md shadow-accent-200
          transition-all duration-200
        "
      >
        <Plus size={18} strokeWidth={2.5} />
        Tạo lớp học
      </button>

      {/* Divider */}
      <div className="w-full max-w-lg border-t border-border my-8 md:my-10" />

      {/* Feature hints */}
      <div className="grid grid-cols-3 gap-4 md:gap-8 w-full max-w-lg">
        {FEATURES.map(({ icon, title, desc }) => (
          <div key={title} className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
              {icon}
            </div>
            <p className="text-[11px] md:text-sm font-semibold text-text-secondary leading-tight">
              {title}
            </p>
            <p className="text-[10px] md:text-xs text-text-muted leading-snug hidden sm:block">
              {desc}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}