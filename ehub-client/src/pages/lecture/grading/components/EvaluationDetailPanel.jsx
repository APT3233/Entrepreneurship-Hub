import DateTimeCell from "@/components/ui/DateTimeCell";
import { useTranslation } from "@/context/TranslationContext";
import EvaluationStatusBadge from "./EvaluationStatusBadge";

export default function EvaluationDetailPanel({ evaluation }) {
  const { t } = useTranslation();

  if (!evaluation) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-5 text-sm text-text-muted">
        {t("lecturer.gradingPage.evaluationPanel.empty")}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-text-primary">{t("lecturer.gradingPage.evaluationPanel.title")}</h3>
            <EvaluationStatusBadge value={evaluation.status} />
          </div>
          <p className="mt-1 text-sm text-text-secondary">{t("lecturer.gradingPage.evaluationPanel.evaluator")}: {evaluation.evaluator_name || evaluation.evaluator_id || "—"}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-3xl font-bold text-text-primary">{Number(evaluation.total_score || 0).toFixed(2)}</p>
          <DateTimeCell value={evaluation.evaluated_at || evaluation.updated_at} multiline={false} />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase text-text-muted">{t("lecturer.gradingPage.evaluationPanel.overallFeedback")}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{evaluation.overall_feedback || "—"}</p>
      </div>

      <div className="mt-5 space-y-3">
        {(evaluation.scores || []).map((score) => (
          <div key={score.id || score.criterion_id} className="rounded-xl bg-gray-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-text-primary">{score.criterion_name || t("lecturer.gradingPage.evaluationPanel.criterionFallback", { id: score.criterion_id })}</p>
                <p className="mt-1 text-xs text-text-secondary">{t("lecturer.gradingPage.evaluationPanel.maxScore", { max: Number(score.max_score || 0) })}</p>
              </div>
              <span className="rounded-lg bg-surface px-3 py-1 text-sm font-bold text-accent-600">{Number(score.score || 0).toFixed(2)}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-text-secondary">{score.feedback || "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
