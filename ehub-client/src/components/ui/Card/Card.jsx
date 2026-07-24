/**
 * Card — bề mặt trắng dùng chung (presentational).
 * Nền surface, viền 1px, bo 12px, KHÔNG đổ bóng.
 *
 * Props:
 * - className?: string      — class thêm (vd padding tuỳ chỗ)
 * - ...rest  : thuộc tính <div> (children, onClick…)
 */
export default function Card({ className = "", ...rest }) {
  return (
    <div
      className={`bg-surface border border-border rounded-card ${className}`}
      {...rest}
    />
  );
}

// ─── Ví dụ dùng ────────────────────────────────────────────────────────────
// <Card className="p-5">
//   <h2 className="text-base font-medium">Thông tin nhóm</h2>
// </Card>
