import { useTranslation } from "@/context/TranslationContext";

const styles = {
  not_started: "bg-subtle text-text-secondary",
  draft: "bg-amber-100 text-amber-700",
  submitted: "bg-emerald-100 text-emerald-700",
  confirmed: "bg-accent-100 text-accent",
};

const dots = {
  not_started: "bg-text-muted",
  draft: "bg-amber-500",
  submitted: "bg-emerald-500",
  confirmed: "bg-accent",
};

export default function EvaluationStatusBadge({ value }) {
  const { t } = useTranslation();
  const key = value || "not_started";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[key] || styles.not_started}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[key] || dots.not_started}`} />
      {t(`status.${key}`, { defaultValue: key })}
    </span>
  );
}
