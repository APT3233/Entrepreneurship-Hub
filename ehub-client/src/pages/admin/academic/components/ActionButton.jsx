export default function ActionButton({ children, onClick, title, tone = "gray", disabled = false }) {
  const toneClass = {
    gray: "text-text-secondary hover:bg-subtle",
    blue: "text-accent hover:bg-accent-bg",
    green: "text-success-text hover:bg-success-bg",
    red: "text-danger-text hover:bg-danger-bg",
    indigo: "text-accent hover:bg-accent-bg",
  }[tone] || "text-text-secondary hover:bg-subtle";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`rounded-control p-2 ${toneClass} disabled:opacity-40 disabled:cursor-not-allowed`} title={title}>
      {children}
    </button>
  );
}
