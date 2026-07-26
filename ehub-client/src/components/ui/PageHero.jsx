/**
 * PageHero — dải mở đầu chuẩn cho mọi trang: tiêu đề lớn + mô tả + KPI + hành động.
 * Tạo focus/hierarchy, thay cho "title + hàng card thống kê" rời rạc.
 *
 * Props:
 * - title    : string
 * - subtitle?: string
 * - kpis?    : Array<{ label, value, icon?, tone?, percent? }>
 * - actions? : ReactNode  (nút bên phải, vd nút chính)
 * - className?: string
 */
const KPI_TONE = {
  accent: "bg-accent-bg text-accent",
  blue:   "bg-secondary-bg text-secondary",
  green:  "bg-success-bg text-success",
  amber:  "bg-warning-bg text-warning",
  red:    "bg-danger-bg text-danger",
  slate:  "bg-subtle text-text-secondary",
};

export default function PageHero({ title, subtitle, kpis = [], actions, className = "", kpiCols = "grid-cols-2 sm:grid-cols-4" }) {
  return (
    <section className={`rounded-card bg-surface shadow-card p-6 sm:p-8 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-text-secondary leading-relaxed max-w-2xl">{subtitle}</p>
          )}
        </div>
        {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
      </div>

      {kpis.length > 0 && (
        <div className={`mt-6 grid ${kpiCols} gap-4 border-t border-border pt-5`}>
          {kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <div key={i} className="flex items-center gap-3 min-w-0">
                {Icon && (
                  <span className={`shrink-0 grid place-items-center w-10 h-10 rounded-xl ${KPI_TONE[k.tone] || KPI_TONE.accent} [&_svg]:w-5 [&_svg]:h-5`}>
                    <Icon />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[28px] font-bold text-text-primary leading-none truncate tracking-tight">{k.value}</p>
                  <p className="mt-1.5 text-xs text-text-muted truncate">{k.label}</p>
                  {k.percent != null && (
                    <div className="mt-2 h-1.5 w-full rounded-full bg-subtle overflow-hidden">
                      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${k.percent}%` }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
