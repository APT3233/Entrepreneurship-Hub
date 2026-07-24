import AnimatedNumber from "@/components/ui/common/AnimatedNumber";
import StatusBadge from "@/components/ui/StatusBadge";

/**
 * GroupStatus
 *
 * Props:
 * - stats     : { eligible, needsReview, ineligible }
 * - onDetail  : () => void
 */

const STATUS_CONFIG = [
  { key: "eligible", label: "Đủ điều kiện", status: "success" },
  { key: "needsReview", label: "Cần kiểm tra thêm", status: "warning" },
  { key: "ineligible", label: "Chưa đủ điều kiện", status: "danger" },
];

export default function GroupStatus({
  stats = { eligible: 28, needsReview: 8, ineligible: 4 },
  onDetail,
}) {
  return (
    <div className="h-full w-full rounded-card border border-border bg-surface p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium text-text-primary">Trạng thái nhóm</h2>
        <button
          onClick={onDetail}
          className="text-sm font-medium text-accent hover:text-accent-hover transition-colors duration-150 cursor-pointer"
        >
          Chi tiết
        </button>
      </div>

      {/* Status rows */}
      <ul className="flex flex-col">
        {STATUS_CONFIG.map(({ key, label, status }) => (
          <li
            key={key}
            className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
          >
            <StatusBadge status={status} label={label} />
            <span className="text-sm font-medium text-text-primary">
              <AnimatedNumber value={stats[key] ?? 0} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
