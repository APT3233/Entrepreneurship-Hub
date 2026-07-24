import SharedStatusBadge from "@/components/ui/StatusBadge";
export { LastNameAvatar as Avatar } from "@/components/icons/ui";

/**
 * StatusBadge for Checkpoints — map sang StatusBadge dùng chung.
 */
export function StatusBadge({ status }) {
  const map = {
    graded: { label: "Đã chấm", tone: "success" },
    ungraded: { label: "Chưa chấm", tone: "warning" },
    not_submitted: { label: "Chưa nộp", tone: "danger" },
  };

  const s = map[status] ?? (status === "submitted" || status === "resubmitted" ? map.ungraded : map.not_submitted);

  return <SharedStatusBadge status={s.tone} label={s.label} />;
}

/**
 * ProgressBar
 */
export function ProgressBar({ value = 0, className = "" }) {
  return (
    <div className={`h-2 bg-border rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

export { default as FileIcon } from "@/components/icons/FileIcon";

/**
 * Skeleton loader
 */
export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-subtle rounded-control ${className}`} />;
}
