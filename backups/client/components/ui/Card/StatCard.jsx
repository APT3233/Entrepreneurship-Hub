import AnimatedNumber from "@/components/ui/common/AnimatedNumber";

/**
 * StatCard — thẻ thống kê dùng chung (calm style).
 *
 * Props:
 * - title     : string           — nhãn thống kê (13px, text-secondary, ở trên)
 * - value     : number | string  — giá trị (24px/500, ở dưới)
 * - className? : string           — class thêm cho card
 * - onClick?  : function
 *
 * icon / iconBg / iconColor vẫn được nhận để không phá các nơi đang gọi,
 * nhưng KHÔNG còn được render (style calm: không icon màu, không viền, không đổ bóng).
 */
export default function StatCard({
  title = "Tiêu đề",
  value = 0,
  className = "",
  onClick,
  // eslint-disable-next-line no-unused-vars
  icon,
  // eslint-disable-next-line no-unused-vars
  iconBg,
  // eslint-disable-next-line no-unused-vars
  iconColor,
}) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-subtle rounded-card px-4 py-4 sm:px-5 sm:py-5
        w-full min-w-0 flex flex-col gap-2
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      <p className="text-label text-text-secondary truncate">{title}</p>
      <p className="text-2xl font-medium text-text-primary leading-none truncate">
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </p>
    </div>
  );
}

// ─── Preview / ví dụ dùng ──────────────────────────────────────────────────
export function StatCardDemo() {
  return (
    <div className="p-8 bg-page min-h-screen">
      <div className="grid grid-cols-2 gap-4 max-w-xl">
        <StatCard title="Lớp học" value={0} />
        <StatCard title="Sinh viên" value={128} />
        <StatCard title="Bài tập" value={24} />
        <StatCard title="Chờ chấm" value={7} />
      </div>
    </div>
  );
}
