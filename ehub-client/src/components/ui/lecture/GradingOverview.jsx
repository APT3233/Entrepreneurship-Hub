import { useEffect, useState } from "react";
import AnimatedNumber from "@/components/ui/common/AnimatedNumber";

/**
 * GradingOverview — Tổng quan chấm điểm
 *
 * Props:
 * - items : Array<{ label, count, percent, note }>
 *   (color vẫn được nhận để không phá nơi gọi, nhưng không còn dùng —
 *    style calm: một màu accent cho progress, không tô nhiều màu trang trí)
 */

function ProgressBar({ percent }) {
  const [width, setWidth] = useState(0);

  // Animate vào sau khi mount
  useEffect(() => {
    const t = setTimeout(() => setWidth(percent), 80);
    return () => clearTimeout(t);
  }, [percent]);

  return (
    <div className="w-full h-2 rounded-full bg-border overflow-hidden">
      <div
        className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function GradingRow({ label, count, percent, note }) {
  return (
    <div className="rounded-card bg-subtle px-4 py-4 flex flex-col gap-2.5">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-2xl font-medium text-text-primary leading-none">
          <AnimatedNumber value={count} />
        </span>
      </div>

      {/* Progress bar */}
      <ProgressBar percent={percent} />

      {/* Note */}
      <p className="text-label text-text-secondary">{note}</p>
    </div>
  );
}

const DEFAULT_ITEMS = [
  { label: "Đã chấm", count: 140, percent: 85, note: "85% hoàn thành" },
  { label: "Đang chấm", count: 18, percent: 45, note: "45% tiến độ" },
  { label: "Cần xử lý", count: 24, percent: 50, note: "Cần xử lý gấp" },
];

export default function GradingOverview({ items = DEFAULT_ITEMS }) {
  return (
    <div className="bg-surface rounded-card border border-border p-5 w-full">
      {/* Header */}
      <h2 className="text-base font-medium text-text-primary mb-4">Tổng quan chấm điểm</h2>

      {/* Rows */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((item, i) => (
          <GradingRow key={i} {...item} />
        ))}
      </div>
    </div>
  );
}
