const normalizeJson = (value) => {
  if (!value) return "—";
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
};

export default function JsonDiffViewer({ oldValue, newValue, payload }) {
  if (payload !== undefined) {
    return (
      <pre className="max-h-[60vh] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
        {normalizeJson(payload)}
      </pre>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Old values</p>
        <pre className="max-h-[55vh] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
          {normalizeJson(oldValue)}
        </pre>
      </div>
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">New values</p>
        <pre className="max-h-[55vh] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
          {normalizeJson(newValue)}
        </pre>
      </div>
    </div>
  );
}
