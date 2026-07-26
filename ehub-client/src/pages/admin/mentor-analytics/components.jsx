import { useTranslation } from "@/context/TranslationContext";
import { MetricCard } from "@/pages/admin/mentor-workflow/components";

export function MetricsGrid({ items = [] }) {
  return <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">{items.map((item) => <MetricCard key={item.label} label={item.label} value={item.value} />)}</div>;
}

export function Panel({ title, children }) {
  return <section className="rounded-card border border-border bg-surface p-5"><h3 className="mb-4 text-sm font-medium text-text-primary">{title}</h3>{children}</section>;
}

function listLabel(t, item, labelKey) {
  const raw = item[labelKey] || item.name || item.organization || item.mentor_type || item.status || item.preferred_mentor_type;
  if (!raw) return "—";
  if (["mentor_type", "status", "preferred_mentor_type"].includes(labelKey)) {
    const translated = t(`status.${raw}`);
    return translated === `status.${raw}` ? raw : translated;
  }
  return raw;
}

export function SimpleList({ items = [], labelKey = "name", valueKey = "total", empty }) {
  const { t } = useTranslation();
  const emptyText = empty ?? t("admin.mentorAnalytics.emptyData");
  if (!items.length) return <p className="text-sm text-text-muted">{emptyText}</p>;
  return <div className="space-y-2">{items.map((item, index) => <div key={`${item[labelKey]}-${index}`} className="flex items-center justify-between rounded-control bg-subtle px-3 py-2 text-sm"><span className="font-medium text-text-secondary">{listLabel(t, item, labelKey)}</span><span className="font-medium text-text-primary">{item[valueKey]}</span></div>)}</div>;
}
