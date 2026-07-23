/**
 * Banner — dải thông báo full-width dùng chung (presentational).
 *
 * Props:
 * - variant : 'warning' | 'info'   — màu nền/chữ theo token
 * - icon?   : ReactNode            — icon bên trái
 * - children: ReactNode            — nội dung
 */
const VARIANT_STYLES = {
  warning: "bg-warning-bg text-warning-text",
  info: "bg-accent-bg text-text-primary",
};

export default function Banner({ variant = "info", icon, children }) {
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.info;
  return (
    <div
      className={`flex w-full items-start gap-2.5 rounded-control border border-current/15 px-4 py-3 text-sm ${style}`}
    >
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// ─── Ví dụ dùng ────────────────────────────────────────────────────────────
// <Banner variant="warning" icon={<AlertTriangle size={16} />}>
//   Bạn chưa tham gia nhóm nào.
// </Banner>
