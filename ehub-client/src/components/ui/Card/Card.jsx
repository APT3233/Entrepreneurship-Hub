/**
 * Card — bề mặt trắng dùng chung (presentational).
 * Nền surface, bo lớn, nổi bằng bóng mềm (không viền — style floating hiện đại).
 *
 * Props:
 * - className?: string      — class thêm (vd padding tuỳ chỗ)
 * - ...rest  : thuộc tính <div> (children, onClick…)
 */
export default function Card({ className = "", ...rest }) {
  return (
    <div
      className={`bg-surface rounded-card shadow-card ${className}`}
      {...rest}
    />
  );
}

// ─── Ví dụ dùng ────────────────────────────────────────────────────────────
// <Card className="p-5">
//   <h2 className="text-base font-medium">Thông tin nhóm</h2>
// </Card>
