export default function StatusBadge({ status }) {
  const isOpen = status === "open";
  const isArchived = status === "archived";

  let label = "Đã đóng";
  let cls =
    "bg-slate-100 text-slate-700 border-slate-200";

  if (isOpen) {
    label = "Đang mở";
    cls = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (isArchived) {
    label = "Lưu trữ";
    cls = "bg-violet-50 text-violet-700 border-violet-200";
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}
    >
      {label}
    </span>
  );
}
