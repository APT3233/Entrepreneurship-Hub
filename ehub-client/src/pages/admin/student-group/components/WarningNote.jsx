export default function WarningNote({ children }) {
  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
      {children}
    </div>
  );
}
