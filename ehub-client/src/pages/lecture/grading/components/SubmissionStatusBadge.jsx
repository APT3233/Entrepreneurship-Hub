import { useTranslation } from "@/context/TranslationContext";

const styles = {
  submitted: "bg-blue-100 text-blue-700",
  resubmitted: "bg-amber-100 text-amber-700",
  graded: "bg-emerald-100 text-emerald-700",
  not_submitted: "bg-subtle text-text-secondary",
};

const dots = {
  submitted: "bg-blue-500",
  resubmitted: "bg-amber-500",
  graded: "bg-emerald-500",
  not_submitted: "bg-text-muted",
};

export default function SubmissionStatusBadge({ value }) {
  const { t } = useTranslation();
  const key = value || "not_submitted";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[key] || styles.not_submitted}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[key] || dots.not_submitted}`} />
      {t(`status.${key}`, { defaultValue: key })}
    </span>
  );
}
