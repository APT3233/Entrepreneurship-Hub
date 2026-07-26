const TONES = {
  accent: { box: "bg-accent-bg",    icon: "text-accent" },
  blue:   { box: "bg-secondary-bg", icon: "text-secondary" },
  green:  { box: "bg-success-bg",   icon: "text-success" },
  amber:  { box: "bg-warning-bg",   icon: "text-warning" },
  red:    { box: "bg-danger-bg",    icon: "text-danger" },
  slate:  { box: "bg-subtle",       icon: "text-text-secondary" },
};

// tone = màu container icon (dùng ở cổng lecturer). Không truyền tone → mặc định xanh (admin giữ nguyên).
export default function MetricCard({ label, value, helper, icon: Icon, tone }) {
  const t = TONES[tone] || { box: "bg-secondary-bg", icon: "text-secondary" };
  return (
    <div className="group rounded-card bg-surface p-5 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
          <p className="mt-2 truncate text-3xl font-semibold text-text-primary">{value ?? "-"}</p>
        </div>
        {Icon ? (
          <div className={`shrink-0 grid place-items-center h-10 w-10 rounded-xl ${t.box} ${t.icon}`}>
            <Icon size={20} />
          </div>
        ) : null}
      </div>
      {helper ? <p className="mt-2 text-xs font-medium text-text-muted">{helper}</p> : null}
    </div>
  );
}
