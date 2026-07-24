import SharedStatusBadge from "@/components/ui/StatusBadge";

/**
 * StatusBadge (assignment) — map trạng thái bài tập sang StatusBadge dùng chung.
 * Caller truyền `status` gốc (open/closed/archived), không đổi.
 */
export default function StatusBadge({ status }) {
  if (status === "open") return <SharedStatusBadge status="success" label="Đang mở" />;
  if (status === "archived") return <SharedStatusBadge status="neutral" label="Lưu trữ" />;
  return <SharedStatusBadge status="neutral" label="Đã đóng" />;
}
