import { useTranslation } from "@/context/TranslationContext";
import { MetricCard } from "@/pages/admin/mentor-workflow/components";

export function MetricsGrid({ items = [] }) {
  return <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">{items.map((item) => <MetricCard key={item.label} label={item.label} value={item.value} />)}</div>;
}

export function Panel({ title, children }) {
  return <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h3 className="mb-4 text-sm font-black text-slate-900">{title}</h3>{children}</section>;
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
  if (!items.length) return <p className="text-sm font-medium text-slate-400">{emptyText}</p>;
  return <div className="space-y-2">{items.map((item, index) => <div key={`${item[labelKey]}-${index}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"><span className="font-bold text-slate-700">{listLabel(t, item, labelKey)}</span><span className="font-black text-slate-900">{item[valueKey]}</span></div>)}</div>;
}
