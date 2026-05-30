const styles = {
  submitted: "border-blue-100 bg-blue-50 text-blue-700",
  resubmitted: "border-amber-100 bg-amber-50 text-amber-700",
  graded: "border-emerald-100 bg-emerald-50 text-emerald-700",
  not_submitted: "border-slate-200 bg-slate-50 text-slate-600",
};

const labels = {
  submitted: "Đã nộp",
  resubmitted: "Nộp lại",
  graded: "Đã chấm",
  not_submitted: "Chưa nộp",
};

export default function SubmissionStatusBadge({ value }) {
  const key = value || "not_submitted";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[key] || styles.not_submitted}`}>
      {labels[key] || key}
    </span>
  );
}
