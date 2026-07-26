import { CheckCircle2, Clock, AlertCircle, FileText } from "lucide-react";
export { LastNameAvatar as Avatar } from "@/components/icons/ui";

/**
 * StatusBadge for Checkpoints
 */
export function StatusBadge({ status }) {
  const map = {
    graded: {
      label: "Đã chấm",
      cls: "text-green-600 bg-green-50 border-green-100",
      icon: <CheckCircle2 size={13} />,
    },
    ungraded: {
      label: "Chưa chấm",
      cls: "text-amber-600 bg-amber-50 border-amber-100",
      icon: <Clock size={13} />,
    },
    not_submitted: {
      label: "Chưa nộp",
      cls: "text-red-500 bg-red-50 border-red-100",
      icon: <AlertCircle size={13} />,
    },
  };
  
  const s = map[status] ?? (status === "submitted" || status === "resubmitted" ? map.ungraded : map.not_submitted);
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${s.cls}`}
    >
      {s.icon} {s.label}
    </span>
  );
}

/**
 * ProgressBar
 */
export function ProgressBar({ value = 0, className = "" }) {
  return (
    <div className={`h-2.5 bg-gray-100 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-accent-500 rounded-full transition-all duration-700 ease-out"
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
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}
