import { useTranslation } from "@/context/TranslationContext";

export default function RubricCriteriaScoringForm({ criteria = [], scores = {}, onChange, disabled = false, submitMode = false }) {
  const { t } = useTranslation();

  const getScoreState = (criterion) => {
    const value = scores[criterion.id]?.score;
    if (value === "" || value === undefined || value === null) return submitMode ? "missing" : "ok";
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > Number(criterion.max_score)) return "invalid";
    return "ok";
  };

  return (
    <div className="space-y-3">
      {criteria.map((criterion, index) => {
        const item = scores[criterion.id] || { score: "", feedback: "" };
        const scoreState = getScoreState(criterion);
        const feedbackMissing = submitMode && Boolean(criterion.is_required_feedback) && !String(item.feedback || "").trim();
        return (
          <div key={criterion.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">{index + 1}</span>
                  <h3 className="text-base font-bold text-gray-900">{criterion.name}</h3>
                  {criterion.is_required_feedback ? (
                    <span className="rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">{t("lecturer.gradingPage.scoring.requiredFeedback")}</span>
                  ) : null}
                </div>
                {criterion.description ? <p className="mt-2 text-sm leading-6 text-gray-500">{criterion.description}</p> : null}
                <p className="mt-2 text-xs font-medium text-gray-400">{t("lecturer.gradingPage.scoring.maxScore", { max: Number(criterion.max_score) })}</p>
              </div>
              <label className="w-full lg:w-36">
                <span className="mb-1 block text-xs font-semibold text-gray-500">{t("lecturer.gradingPage.scoring.score")}</span>
                <input
                  type="number"
                  min="0"
                  max={Number(criterion.max_score)}
                  step="0.25"
                  value={item.score}
                  disabled={disabled}
                  onChange={(event) => onChange?.(criterion.id, { ...item, score: event.target.value })}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-400 ${
                    scoreState === "invalid" || scoreState === "missing"
                      ? "border-red-200 focus:border-red-300 focus:ring-red-100"
                      : "border-gray-200 focus:border-indigo-300 focus:ring-indigo-100"
                  }`}
                />
                {scoreState === "invalid" ? <span className="mt-1 block text-xs text-red-600">{t("lecturer.gradingPage.scoring.scoreRangeInvalid", { max: Number(criterion.max_score) })}</span> : null}
                {scoreState === "missing" ? <span className="mt-1 block text-xs text-red-600">{t("lecturer.gradingPage.scoring.scoreMissing")}</span> : null}
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-semibold text-gray-500">{t("lecturer.gradingPage.scoring.criterionFeedback")}</span>
              <textarea
                rows={3}
                value={item.feedback}
                disabled={disabled}
                onChange={(event) => onChange?.(criterion.id, { ...item, feedback: event.target.value })}
                className={`w-full resize-y rounded-xl border px-3 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-400 ${
                  feedbackMissing
                    ? "border-red-200 focus:border-red-300 focus:ring-red-100"
                    : "border-gray-200 focus:border-indigo-300 focus:ring-indigo-100"
                }`}
              />
              {feedbackMissing ? <span className="mt-1 block text-xs text-red-600">{t("lecturer.gradingPage.scoring.feedbackRequired")}</span> : null}
            </label>
          </div>
        );
      })}
    </div>
  );
}
