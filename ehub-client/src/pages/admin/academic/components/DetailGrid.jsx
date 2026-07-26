export default function DetailGrid({ items }) {
  return (
    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-card bg-subtle p-3">
          <dt className="text-label text-text-muted">{label}</dt>
          <dd className="mt-1 break-words font-medium text-text-primary">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
