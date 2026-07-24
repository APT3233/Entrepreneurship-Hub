import AnimatedNumber from "@/components/ui/common/AnimatedNumber";
import StatusBadge from "@/components/ui/StatusBadge";

/**
 * AssignmentStatus — Bài tập cần xử lý
 *
 * Props:
 * - stats    : { submitted, pending, late }  — giá trị % hoặc số
 * - unit     : string  — đơn vị hiển thị, mặc định "%"
 * - onCreate : () => void
 */

const STATUS_CONFIG = [
  { key: "submitted", label: "Đã nộp", status: "success" },
  { key: "pending", label: "Chưa nộp", status: "warning" },
  { key: "late", label: "Trễ hạn", status: "danger" },
];

export default function AssignmentStatus({
  stats = { submitted: 28, pending: 8, late: 4 },
  unit = "%",
  onCreate,
}) {
  return (
    <div className="h-full w-full rounded-card border border-border bg-surface p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium text-text-primary">Checkpoint cần xử lý</h2>
        <button
          onClick={onCreate}
          className="text-sm font-medium text-accent hover:text-accent-hover transition-colors duration-150 cursor-pointer"
        >
          Tạo mới
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
              <AnimatedNumber value={stats[key] ?? 0} />{unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
