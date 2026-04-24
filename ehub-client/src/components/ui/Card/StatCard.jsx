import { BookOpen } from "lucide-react";
import AnimatedNumber from "@/components/ui/common/AnimatedNumber";

/**
 * StatCard — Component dùng chung
 *
 * Props:
 * - title      : string           — Tên thống kê (vd: "Lớp học")
 * - value      : number | string  — Giá trị hiển thị (vd: 0, "12", "98%")
 * - icon       : ReactNode        — Icon từ lucide-react hoặc bất kỳ
 * - iconBg     : string           — Tailwind class màu nền icon (mặc định: "bg-blue-50")
 * - iconColor  : string           — Tailwind class màu icon (mặc định: "text-blue-500")
 * - className  : string           — Class tuỳ chỉnh thêm cho card
 */
export default function StatCard({
  title = "Tiêu đề",
  value = 0,
  icon,
  iconBg = "bg-blue-50",
  iconColor = "text-blue-500",
  className = "",
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white rounded-2xl px-4 py-4 sm:px-5 sm:py-5
        border border-gray-100 shadow-sm
        w-full min-w-0
        flex items-center justify-between gap-3 sm:gap-4
        hover:shadow-md transition-shadow duration-200
        ${onClick ? "cursor-pointer active:scale-[0.98]" : ""}
        ${className}
      `}
    >
      {/* Left: title + value */}
      <div className="flex flex-col gap-1.5 sm:gap-2 min-w-0">
        <p className="text-xs sm:text-sm text-gray-400 font-medium truncate">{title}</p>
        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-none truncate">
          {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
        </p>
      </div>

      {/* Right: icon */}
      {icon && (
        <div
          className={`
            w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0
            ${iconBg} ${iconColor}
          `}
        >
          {icon}
        </div>
      )}
    </div>
  );
}

// ─── Preview / usage example ───────────────────────────────────────────────
export function StatCardDemo() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-2 gap-4 max-w-xl">
        <StatCard
          title="Lớp học"
          value={0}
          icon={<BookOpen size={22} />}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <StatCard
          title="Sinh viên"
          value={128}
          icon={<BookOpen size={22} />}
          iconBg="bg-green-50"
          iconColor="text-green-500"
        />
        <StatCard
          title="Bài tập"
          value={24}
          icon={<BookOpen size={22} />}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
        />
        <StatCard
          title="Chờ chấm"
          value={7}
          icon={<BookOpen size={22} />}
          iconBg="bg-red-50"
          iconColor="text-red-400"
        />
      </div>
    </div>
  );
}