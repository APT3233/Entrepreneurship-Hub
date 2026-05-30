export default function DetailGrid({ items }) {
  return (
    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl bg-gray-50 p-3">
          <dt className="text-xs font-bold uppercase text-gray-400">{label}</dt>
          <dd className="mt-1 break-words font-medium text-gray-800">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
