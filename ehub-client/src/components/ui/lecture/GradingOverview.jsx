import { useEffect, useState } from "react";
import { PenLine } from "lucide-react";
import AnimatedNumber from "@/components/ui/common/AnimatedNumber";

/**
 * GradingOverview — Tổng quan chấm điểm
 *
 * Props:
 * - items : Array<{ label, count, percent, note, color }>
 *   color: "green" | "orange" | "red"
 */

const COLOR_MAP = {
  green: {
    bg: "bg-green-50",
    border: "border-green-100",
    label: "text-text-primary",
    count: "text-green-500",
    bar: "bg-green-500",
    track: "bg-green-200",
    note: "text-green-700",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-100",
    label: "text-text-primary",
    count: "text-orange-400",
    bar: "bg-orange-400",
    track: "bg-orange-200",
    note: "text-orange-600",
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-100",
    label: "text-text-primary",
    count: "text-red-500",
    bar: "bg-red-500",
    track: "bg-red-200",
    note: "text-red-500",
  },
};

function ProgressBar({ percent, color }) {
  const [width, setWidth] = useState(0);
  const c = COLOR_MAP[color] ?? COLOR_MAP.green;

  // Animate vào sau khi mount
  useEffect(() => {
    const t = setTimeout(() => setWidth(percent), 80);
    return () => clearTimeout(t);
  }, [percent]);

  return (
    <div className={`w-full h-2.5 rounded-full ${c.track} overflow-hidden`}>
      <div
        className={`h-full rounded-full ${c.bar} transition-all duration-700 ease-out`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function GradingRow({ label, count, percent, note, color = "green" }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.green;

  return (
    <div className={`rounded-xl md:rounded-2xl border px-3 py-3 md:px-5 md:py-4 flex flex-col gap-2 md:gap-2.5 ${c.bg} ${c.border}`}>
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className={`text-xs md:text-sm font-semibold ${c.label}`}>{label}</span>
        <span className={`text-lg md:text-2xl font-bold ${c.count}`}>
          <AnimatedNumber value={count} />
        </span>
      </div>

      {/* Progress bar */}
      <ProgressBar percent={percent} color={color} />

      {/* Note */}
      <p className={`text-[10px] md:text-xs font-medium ${c.note}`}>{note}</p>
    </div>
  );
}

const DEFAULT_ITEMS = [
  { label: "Đã chấm", count: 140, percent: 85, note: "85% hoàn thành",  color: "green"  },
  { label: "Đã chấm", count: 18,  percent: 45, note: "45% tiến độ",     color: "orange" },
  { label: "Đã chấm", count: 24,  percent: 50, note: "Cần xử lý gấp",   color: "red"    },
];

export default function GradingOverview({ items = DEFAULT_ITEMS }) {
  return (
    <div className="bg-surface rounded-card shadow-card p-3 md:p-5 w-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3 md:mb-4">
        <span className="grid place-items-center w-8 h-8 rounded-lg bg-accent-bg text-accent">
          <PenLine size={17} />
        </span>
        <h2 className="text-sm md:text-base font-semibold text-text-primary">Tổng quan chấm điểm</h2>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2 md:gap-3">
        {items.map((item, i) => (
          <GradingRow key={i} {...item} />
        ))}
      </div>
    </div>
  );
}