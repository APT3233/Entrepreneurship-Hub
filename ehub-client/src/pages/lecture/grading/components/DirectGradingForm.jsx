import { Award } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

export default function DirectGradingForm({
  score,
  feedback,
  maxScore,
  disabled = false,
  scoreInvalid = false,
  scoreMissing = false,
  feedbackMissing = false,
  feedbackTooShort = false,
  minFeedbackLength = 15,
  onScoreChange,
  onFeedbackChange,
}) {
  const { t } = useTranslation();

  return (
    <section className="space-y-4 rounded-2xl border border-accent-100/80 bg-accent-50/30 p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-accent-800 flex items-center gap-2">
          <Award className="shrink-0 text-accent-500" size={18} />
          {t("lecturer.gradingPage.form.directGradingTitle")}
        </p>
        <p className="mt-2 text-sm text-text-secondary">{t("lecturer.gradingPage.form.directGradingHint")}</p>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-text-secondary">{t("lecturer.gradingPage.form.directScore")}</span>
        <input
          type="number"
          min={0}
          max={maxScore ?? undefined}
          step="0.01"
          value={score}
          disabled={disabled}
          onChange={(event) => onScoreChange(event.target.value)}
          className={`w-full rounded-xl border px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-text-muted ${
            scoreInvalid || scoreMissing
              ? "border-red-200 focus:border-red-300 focus:ring-red-100"
              : "border-border focus:border-accent-300 focus:ring-accent-100"
          }`}
        />
        {maxScore != null ? (
          <span className="mt-1 block text-xs text-text-muted">{t("lecturer.gradingPage.form.maxScoreHint", { max: maxScore })}</span>
        ) : null}
        {scoreMissing ? <span className="mt-1 block text-xs text-red-600">{t("lecturer.gradingPage.form.directScoreRequired")}</span> : null}
        {scoreInvalid ? <span className="mt-1 block text-xs text-red-600">{t("lecturer.gradingPage.form.directScoreRange", { max: maxScore })}</span> : null}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-text-secondary">{t("lecturer.gradingPage.form.overallFeedback")}</span>
        <textarea
          rows={4}
          value={feedback}
          disabled={disabled}
          onChange={(event) => onFeedbackChange(event.target.value)}
          className={`w-full resize-y rounded-xl border px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-text-muted ${
            feedbackMissing || feedbackTooShort
              ? "border-red-200 focus:border-red-300 focus:ring-red-100"
              : "border-border focus:border-accent-300 focus:ring-accent-100"
          }`}
        />
        {feedbackMissing ? <span className="mt-1 block text-xs text-red-600">{t("lecturer.gradingPage.form.overallFeedbackRequired")}</span> : null}
        {feedbackTooShort ? <span className="mt-1 block text-xs text-red-600">{t("lecturer.gradingPage.form.overallFeedbackMinLength", { min: minFeedbackLength })}</span> : null}
      </label>
    </section>
  );
}
