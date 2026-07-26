import { TrendingUp, TrendingDown } from "lucide-react";
import AnimatedNumber from "@/components/ui/common/AnimatedNumber";

/**
 * StatCard — thẻ thống kê (premium SaaS: nền trắng, chỉ icon có màu).
 *
 * Props:
 * - title   : string          — nhãn
 * - value   : number | string — giá trị (số to, nhấn mạnh)
 * - icon?   : ReactNode        — icon mono trong container màu
 * - tone?   : keyof TONES      — màu container icon (mặc định accent)
 * - trend?  : { value: string, dir?: "up"|"down" } — badge xu hướng (tuỳ chọn)
 * - hint?   : string           — mô tả phụ nhỏ (tuỳ chọn)
 * - className?: string
 * - valueClassName?: string
 * - onClick?: function
 *
 * (iconBg / iconColor vẫn nhận để tương thích chỗ gọi cũ khi không truyền tone.)
 */
const TONES = {
  accent: { box: "bg-accent-bg",    icon: "text-accent" },
  blue:   { box: "bg-secondary-bg", icon: "text-secondary" },
  green:  { box: "bg-success-bg",   icon: "text-success" },
  amber:  { box: "bg-warning-bg",   icon: "text-warning" },
  red:    { box: "bg-danger-bg",    icon: "text-danger" },
  slate:  { box: "bg-subtle",       icon: "text-text-secondary" },
};

export default function StatCard({
  title = "Tiêu đề",
  value = 0,
  icon,
  tone,
  trend,
  hint,
  className = "",
  valueClassName = "text-3xl font-semibold",
  onClick,
  iconBg,
  iconColor,
}) {
  const t = TONES[tone];
  const boxBg = t ? t.box : iconBg || "bg-accent-bg";
  const boxIcon = t ? t.icon : iconColor || "text-accent";
  const trendUp = trend?.dir !== "down";

  return (
    <div
      onClick={onClick}
      className={`
        group bg-surface rounded-card p-5 w-full min-w-0
        shadow-card transition-all duration-150
        ${onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-card-hover" : ""}
        ${className}
      `}
    >
      <div className="flex items-center justify-between gap-2">
        {icon && (
          <span
            className={`shrink-0 grid place-items-center w-10 h-10 rounded-xl ${boxBg} ${boxIcon}
              [&_svg]:w-5 [&_svg]:h-5`}
          >
            {icon}
          </span>
        )}
        {trend && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium
              ${trendUp ? "bg-success-bg text-success-text" : "bg-danger-bg text-danger-text"}`}
          >
            {trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {trend.value}
          </span>
        )}
      </div>

      <p className="mt-4 text-sm font-medium text-text-secondary truncate">{title}</p>
      <p className={`mt-1 ${valueClassName} text-text-primary leading-tight truncate`}>
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </p>
      {hint && <p className="mt-1 text-xs text-text-muted truncate">{hint}</p>}
    </div>
  );
}

// ─── Preview ────────────────────────────────────────────────────────────────
export function StatCardDemo() {
  return (
    <div className="p-8 bg-page min-h-screen">
      <div className="grid grid-cols-2 gap-6 max-w-2xl">
        <StatCard title="Lớp học" value={12} tone="accent" trend={{ value: "+2 kỳ này" }} />
        <StatCard title="Sinh viên" value={128} tone="blue" />
        <StatCard title="Bài tập" value={24} tone="amber" />
        <StatCard title="Chờ chấm" value={7} tone="green" />
      </div>
    </div>
  );
}
