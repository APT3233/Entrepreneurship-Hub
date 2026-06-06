import { useTranslation } from "@/context/TranslationContext";

const styles = {
  not_started: "border-slate-200 bg-slate-50 text-slate-600",
  draft: "border-amber-100 bg-amber-50 text-amber-700",
  submitted: "border-emerald-100 bg-emerald-50 text-emerald-700",
  confirmed: "border-indigo-100 bg-indigo-50 text-indigo-700",
};

export default function EvaluationStatusBadge({ value }) {
  const { t } = useTranslation();
  const key = value || "not_started";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[key] || styles.not_started}`}>
      {t(`status.${key}`, { defaultValue: key })}
    </span>
  );
}
