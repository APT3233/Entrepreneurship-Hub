import { getDeadlineState, formatDate } from "@/pages/admin/project-submission/shared";

const classes = {
  open: "border-emerald-100 bg-emerald-50 text-emerald-700",
  overdue: "border-red-100 bg-red-50 text-red-700",
  closed: "border-slate-200 bg-slate-50 text-slate-600",
  unknown: "border-gray-100 bg-gray-50 text-gray-500",
};

const labels = {
  open: "Còn hạn",
  overdue: "Quá hạn",
  closed: "Đã đóng",
  unknown: "Chưa có hạn",
};

export default function DeadlineBadge({ deadline, status }) {
  const state = getDeadlineState(deadline, status);
  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classes[state]}`}>
        {labels[state]}
      </span>
      <span className="text-xs text-gray-500">{formatDate(deadline)}</span>
    </div>
  );
}
