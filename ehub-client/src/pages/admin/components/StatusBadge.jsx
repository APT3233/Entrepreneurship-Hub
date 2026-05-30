import { useTranslation } from "@/context/TranslationContext";

const statusMap = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  inactive: "bg-slate-50 text-slate-600 border-slate-200",
  locked: "bg-red-50 text-red-600 border-red-100",
  local: "bg-blue-50 text-blue-700 border-blue-100",
  google: "bg-amber-50 text-amber-700 border-amber-100",
  upcoming: "bg-sky-50 text-sky-700 border-sky-100",
  ongoing: "bg-emerald-50 text-emerald-700 border-emerald-100",
  completed: "bg-violet-50 text-violet-700 border-violet-100",
  draft: "bg-slate-50 text-slate-600 border-slate-200",
  open: "bg-emerald-50 text-emerald-700 border-emerald-100",
  closed: "bg-slate-50 text-slate-600 border-slate-200",
  archived: "bg-zinc-50 text-zinc-600 border-zinc-200",
  deleted: "bg-red-50 text-red-600 border-red-100",
  not_submitted: "bg-slate-50 text-slate-600 border-slate-200",
  submitted: "bg-blue-50 text-blue-700 border-blue-100",
  confirmed: "bg-indigo-50 text-indigo-700 border-indigo-100",
  resubmitted: "bg-amber-50 text-amber-700 border-amber-100",
  pending_grading: "bg-amber-50 text-amber-700 border-amber-100",
  graded: "bg-emerald-50 text-emerald-700 border-emerald-100",
  late: "bg-red-50 text-red-700 border-red-100",
  checkpoint: "bg-indigo-50 text-indigo-700 border-indigo-100",
  assignment: "bg-sky-50 text-sky-700 border-sky-100",
  final: "bg-violet-50 text-violet-700 border-violet-100",
  class_invite: "bg-blue-50 text-blue-700 border-blue-100",
  group_invite: "bg-indigo-50 text-indigo-700 border-indigo-100",
  email_event: "bg-cyan-50 text-cyan-700 border-cyan-100",
  queued: "bg-blue-50 text-blue-700 border-blue-100",
  sending: "bg-amber-50 text-amber-700 border-amber-100",
  sent: "bg-emerald-50 text-emerald-700 border-emerald-100",
  used: "bg-emerald-50 text-emerald-700 border-emerald-100",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-100",
  declined: "bg-red-50 text-red-700 border-red-100",
  expired: "bg-slate-50 text-slate-600 border-slate-200",
  revoked: "bg-red-50 text-red-700 border-red-100",
  processing: "bg-amber-50 text-amber-700 border-amber-100",
  failed: "bg-red-50 text-red-700 border-red-100",
  cancelled: "bg-slate-50 text-slate-600 border-slate-200",
  done: "bg-emerald-50 text-emerald-700 border-emerald-100",
  dead: "bg-red-50 text-red-700 border-red-100",
  manual: "bg-slate-50 text-slate-600 border-slate-200",
  weighted_sum: "bg-blue-50 text-blue-700 border-blue-100",
  true: "bg-indigo-50 text-indigo-700 border-indigo-100",
  false: "bg-gray-50 text-gray-600 border-gray-100",
};

const labelMap = {
  active: "Active",
  inactive: "Inactive",
  locked: "Locked",
  local: "Local",
  google: "Google",
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  archived: "Archived",
  deleted: "Deleted",
  not_submitted: "Not submitted",
  submitted: "Submitted",
  confirmed: "Confirmed",
  resubmitted: "Resubmitted",
  pending_grading: "Pending grading",
  graded: "Graded",
  late: "Late",
  checkpoint: "Checkpoint",
  assignment: "Assignment",
  final: "Final",
  class_invite: "Class invite",
  group_invite: "Group invite",
  email_event: "Email event",
  queued: "Queued",
  sending: "Sending",
  sent: "Sent",
  used: "Used",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  revoked: "Revoked",
  processing: "Processing",
  failed: "Failed",
  cancelled: "Cancelled",
  done: "Done",
  dead: "Dead",
  manual: "Manual",
  weighted_sum: "Weighted sum",
  true: "System",
  false: "Custom",
};

export default function StatusBadge({ value }) {
  const { t } = useTranslation();
  const key = String(value);
  const label = t(`status.${key}`);
  const displayLabel = label === `status.${key}` ? (labelMap[key] || key) : label;

  let customStyle = statusMap[key];
  if (!customStyle && /^\d{3}$/.test(key)) {
    const code = parseInt(key, 10);
    if (code >= 200 && code < 300) {
      customStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
    } else if (code >= 300 && code < 400) {
      customStyle = "bg-blue-50 text-blue-700 border-blue-100";
    } else if (code >= 400 && code < 500) {
      customStyle = "bg-amber-50 text-amber-700 border-amber-100";
    } else if (code >= 500 && code < 600) {
      customStyle = "bg-red-50 text-red-700 border-red-100";
    }
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${customStyle || "bg-gray-50 text-gray-600 border-gray-100"}`}>
      {displayLabel}
    </span>
  );
}
