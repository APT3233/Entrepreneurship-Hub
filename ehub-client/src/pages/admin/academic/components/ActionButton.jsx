export default function ActionButton({ children, onClick, title, tone = "gray", disabled = false }) {
  const toneClass = {
    gray: "text-gray-500 hover:bg-gray-50",
    blue: "text-blue-600 hover:bg-blue-50",
    green: "text-emerald-600 hover:bg-emerald-50",
    red: "text-red-600 hover:bg-red-50",
    indigo: "text-indigo-600 hover:bg-indigo-50",
  }[tone] || "text-gray-500 hover:bg-gray-50";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`rounded-lg p-2 ${toneClass} disabled:opacity-40 disabled:cursor-not-allowed`} title={title}>
      {children}
    </button>
  );
}
