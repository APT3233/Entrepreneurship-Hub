export default function AnalyticsCard({ label, value, helper, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-gray-900">{value ?? "—"}</p>
        </div>
        {Icon ? (
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
            <Icon size={20} />
          </div>
        ) : null}
      </div>
      {helper ? <p className="mt-2 text-xs font-medium text-gray-500">{helper}</p> : null}
    </div>
  );
}
