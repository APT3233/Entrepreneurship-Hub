import { Users } from "lucide-react";
import AnimatedNumber from "@/components/ui/common/AnimatedNumber";

/**
 * GroupStatus
 *
 * Props:
 * - stats     : { eligible, needsReview, ineligible }
 * - onDetail  : () => void
 */

const STATUS_CONFIG = [
  {
    key: "eligible",
    label: "Đủ điều kiện",
    dot: "bg-green-500",
    bg: "bg-green-50",
    text: "text-green-600",
  },
  {
    key: "needsReview",
    label: "Cần kiểm tra thêm",
    dot: "bg-yellow-400",
    bg: "bg-yellow-50",
    text: "text-yellow-600",
  },
  {
    key: "ineligible",
    label: "Chưa đủ điều kiện",
    dot: "bg-red-500",
    bg: "bg-red-50",
    text: "text-red-500",
  },
];

export default function GroupStatus({
  stats = { eligible: 28, needsReview: 8, ineligible: 4 },
  onDetail,
}) {
  return (
    <div className="h-full w-full rounded-card bg-surface p-5 shadow-card">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-secondary-bg text-secondary">
            <Users size={17} />
          </span>
          <h2 className="text-base font-semibold text-text-primary">Trạng thái nhóm</h2>
        </div>
        <button
          onClick={onDetail}
          className="text-sm font-medium text-accent hover:text-accent-hover transition-colors duration-150 cursor-pointer"
        >
          Chi tiết
        </button>
      </div>

      {/* Status rows */}
      <ul className="flex flex-col gap-3">
        {STATUS_CONFIG.map(({ key, label, dot, bg, text }) => (
          <li
            key={key}
            className={`flex items-center justify-between px-4 py-3.5 rounded-xl ${bg}`}
          >
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full shrink-0 ${dot}`} />
              <span className="text-sm font-medium text-text-secondary">{label}</span>
            </div>
            <span className={`text-sm font-bold ${text}`}>
              <AnimatedNumber value={stats[key] ?? 0} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}