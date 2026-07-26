/**
 * Button — nút dùng chung (presentational).
 *
 * Props:
 * - variant  : 'accent' | 'ghost'   — accent = nền cam; ghost = trong suốt + viền
 * - className?: string
 * - ...rest  : các thuộc tính <button> (type, onClick, disabled, children…)
 *
 * Kích thước chạm: 44px trên mobile, 36px trên desktop.
 * (GoogleButton.jsx vẫn giữ nguyên, độc lập với component này.)
 */
const VARIANT_STYLES = {
  accent:
    "bg-accent text-white hover:bg-accent-hover disabled:bg-accent/50",
  ghost:
    "bg-transparent border border-border text-text-primary hover:bg-subtle disabled:text-text-muted",
};

export default function Button({ variant = "accent", className = "", ...rest }) {
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.accent;
  return (
    <button
      className={`
        inline-flex h-11 sm:h-9 items-center justify-center gap-2
        rounded-control px-4 text-sm font-medium
        transition-colors duration-150
        disabled:cursor-not-allowed
        ${style} ${className}
      `}
      {...rest}
    />
  );
}

// ─── Ví dụ dùng ────────────────────────────────────────────────────────────
// <Button variant="accent" onClick={save}>Lưu</Button>
// <Button variant="ghost" onClick={cancel}>Huỷ</Button>
