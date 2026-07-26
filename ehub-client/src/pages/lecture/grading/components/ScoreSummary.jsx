import { useTranslation } from "@/context/TranslationContext";

export default function ScoreSummary({
  total = 0,
  rubricTotal,
  sourceMax,
  invalidCount = 0,
  missingFeedbackCount = 0,
  missingScoreCount = 0,
  directMode = false,
}) {
  const { t } = useTranslation();
  const hasProblems = invalidCount > 0 || missingFeedbackCount > 0 || missingScoreCount > 0;

  return (
    <div className="rounded-2xl bg-surface p-5 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-text-secondary">{t("lecturer.gradingPage.summary.total")}</p>
          <p className="mt-1 text-4xl font-bold text-text-primary">{Number(total || 0).toFixed(2)}</p>
        </div>
        <div className="text-right text-sm text-text-secondary">
          {!directMode ? (
            <p>{t("lecturer.gradingPage.summary.rubric")}: <span className="font-semibold text-text-primary">{rubricTotal ?? "—"}</span></p>
          ) : null}
          <p>{t("lecturer.gradingPage.summary.source")}: <span className="font-semibold text-text-primary">{sourceMax ?? "—"}</span></p>
        </div>
      </div>
      {hasProblems ? (
        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700">
          {invalidCount > 0 ? <p>{directMode ? t("lecturer.gradingPage.form.directScoreRange", { max: sourceMax }) : t("lecturer.gradingPage.summary.invalidScores", { count: invalidCount })}</p> : null}
          {missingScoreCount > 0 ? <p>{directMode ? t("lecturer.gradingPage.scoring.scoreMissing") : t("lecturer.gradingPage.summary.missingScores", { count: missingScoreCount })}</p> : null}
          {!directMode && missingFeedbackCount > 0 ? <p>{t("lecturer.gradingPage.summary.missingFeedback", { count: missingFeedbackCount })}</p> : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-emerald-600">{t("lecturer.gradingPage.summary.valid")}</p>
      )}
    </div>
  );
}
