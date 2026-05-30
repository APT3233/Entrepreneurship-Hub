const palette = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-rose-500", "bg-slate-500"];

export default function SimpleChartWrapper({ title, rows = [], labelKey, valueKey, valueSuffix = "" }) {
  const maxValue = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 0);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <span className="text-xs font-semibold text-gray-400">{rows.length} mục</span>
      </div>
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((row, index) => {
            const value = Number(row[valueKey] || 0);
            const width = maxValue ? `${Math.max(6, (value / maxValue) * 100)}%` : "0%";
            return (
              <div key={`${row[labelKey]}-${index}`}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold text-gray-600">
                  <span className="truncate">{row[labelKey] || "—"}</span>
                  <span>{value}{valueSuffix}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className={`h-2 rounded-full ${palette[index % palette.length]}`} style={{ width }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-400">Chưa có dữ liệu biểu đồ.</div>
      )}
    </div>
  );
}
