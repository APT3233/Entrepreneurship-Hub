import { useTranslation } from "@/context/TranslationContext";

export default function BarListChart({ title, rows = [], labelKey, valueKey, valueSuffix = "", emptyText }) {
  const { t } = useTranslation();
  const resolvedEmptyText = emptyText || t("admin.analytics.chartEmpty");

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-gray-900">{title}</h3>
        <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-400">{resolvedEmptyText}</div>
      </div>
    );
  }

  const max = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 1);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-gray-900">{title}</h3>
      <div className="space-y-3">
        {rows.map((row, index) => {
          const value = Number(row[valueKey] || 0);
          const width = `${Math.max((value / max) * 100, 4)}%`;
          return (
            <div key={`${row[labelKey]}-${index}`} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs font-medium text-gray-600">
                <span className="truncate">{row[labelKey]}</span>
                <span className="shrink-0 font-bold text-gray-900">
                  {value}
                  {valueSuffix}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-indigo-500" style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
