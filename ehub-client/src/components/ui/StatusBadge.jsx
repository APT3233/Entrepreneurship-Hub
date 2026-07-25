/**
 * StatusBadge — nhãn trạng thái dùng chung (presentational).
 * Caller quyết định status; component KHÔNG tự suy ra từ dữ liệu.
 *
 * Props:
 * - status : 'success' | 'warning' | 'danger' | 'neutral'
 * - label  : string  — chữ hiển thị (12px, sentence case)
 */
const STATUS_STYLES = {
  success: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning-text",
  danger: "bg-danger-bg text-danger-text",
  neutral: "bg-neutral-bg text-neutral-text",
};

export default function StatusBadge({ status = "neutral", label }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.neutral;
  return (
    <span
      className={`inline-flex items-center rounded-control px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}

// ─── Ví dụ dùng ────────────────────────────────────────────────────────────
// <StatusBadge status="success" label="Đã nộp" />
// <StatusBadge status="danger" label="Quá hạn" />
