import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, Save, Send } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ConfirmModal from "@/components/modal/ConfirmModal";
import PageForbidden from "@/components/PageForbidden";
import DateTimeCell from "@/components/ui/DateTimeCell";
import { useToast } from "@/components/ui/Toast";
import aiEvaluationApi from "@/api/aiEvaluation";
import gradingService from "@/api/grading";
import { useTranslation } from "@/context/TranslationContext";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import DirectGradingForm from "./components/DirectGradingForm";
import EvaluationStatusBadge from "./components/EvaluationStatusBadge";
import RubricCriteriaScoringForm from "./components/RubricCriteriaScoringForm";
import ScoreSummary from "./components/ScoreSummary";
import SubmissionFileList from "./components/SubmissionFileList";
import EvaluationDetailPanel from "./components/EvaluationDetailPanel";
import AiAssistantPanel from "./components/AiAssistantPanel";

const targetTypeBySource = {
  checkpoint: "checkpoint_submission",
  assignment: "assignment_submission",
};

const minOverallFeedbackLength = 15;

const getInitialScores = (criteria = [], evaluation) => {
  const byCriterion = new Map((evaluation?.scores || []).map((score) => [Number(score.criterion_id), score]));
  return Object.fromEntries(
    criteria.map((criterion) => {
      const existing = byCriterion.get(Number(criterion.id));
      return [
        criterion.id,
        {
          score: existing?.score ?? "",
          feedback: existing?.feedback || "",
        },
      ];
    }),
  );
};

export default function GradingFormPage({ sourceType }) {
  const { t } = useTranslation();
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [scores, setScores] = useState({});
  const [overallFeedback, setOverallFeedback] = useState("");
  const [directScore, setDirectScore] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const aiAppliedRef = useRef({ suggestionId: null, fields: new Set(), edited: new Set() });

  const rubricCriteria = data?.rubric?.criteria;
  const criteria = useMemo(() => rubricCriteria || [], [rubricCriteria]);
  const isDirectGrading = data?.grading_mode === "direct" || (data != null && !data.rubric);
  const evaluation = data?.evaluation || null;
  const isConfirmed = !isDirectGrading && evaluation?.status === "confirmed";
  const backPath = location.state?.from || "/lecturer/grading";

  useDocumentTitle(data?.source_title || null, 1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setForbidden(false);
    try {
      const res = await gradingService.gradingForm(targetTypeBySource[sourceType], submissionId);
      const next = res?.data || null;
      setData(next);
      setScores(getInitialScores(next?.rubric?.criteria || [], next?.evaluation));
      setOverallFeedback(next?.evaluation?.overall_feedback || next?.current_feedback || "");
      setDirectScore(
        next?.current_score != null && next?.current_score !== ""
          ? String(next.current_score)
          : next?.evaluation?.total_score != null
            ? String(next.evaluation.total_score)
            : "",
      );
    } catch (err) {
      if (err.status === 403) setForbidden(true);
      else setError(err.message || t("lecturer.gradingPage.form.loadError"));
    } finally {
      setLoading(false);
    }
  }, [sourceType, submissionId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const directScoreState = useMemo(() => {
    const max = Number(data?.source_max_score ?? 0);
    const value = directScore;
    const missing = value === "" || value === undefined || value === null;
    if (missing) {
      return {
        total: 0,
        scoreMissing: true,
        scoreInvalid: false,
        overallFeedbackMissing: !overallFeedback.trim(),
        overallFeedbackTooShort: Boolean(overallFeedback.trim()) && overallFeedback.trim().length < minOverallFeedbackLength,
      };
    }
    const number = Number(value);
    const invalid = !Number.isFinite(number) || number < 0 || (max > 0 && number > max);
    return {
      total: invalid ? 0 : number,
      scoreMissing: false,
      scoreInvalid: invalid,
      overallFeedbackMissing: !overallFeedback.trim(),
      overallFeedbackTooShort: Boolean(overallFeedback.trim()) && overallFeedback.trim().length < minOverallFeedbackLength,
    };
  }, [data?.source_max_score, directScore, overallFeedback]);

  const scoreState = useMemo(() => {
    if (isDirectGrading) {
      return {
        total: directScoreState.total,
        invalidCount: directScoreState.scoreInvalid ? 1 : 0,
        missingFeedbackCount: 0,
        missingScoreCount: directScoreState.scoreMissing ? 1 : 0,
        overallFeedbackMissing: directScoreState.overallFeedbackMissing,
        overallFeedbackTooShort: directScoreState.overallFeedbackTooShort,
      };
    }
    let invalidCount = 0;
    let missingFeedbackCount = 0;
    let missingScoreCount = 0;
    const total = criteria.reduce((sum, criterion) => {
      const value = scores[criterion.id]?.score;
      if (value === "" || value === undefined || value === null) {
        missingScoreCount += 1;
        return sum;
      }
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0 || number > Number(criterion.max_score)) {
        invalidCount += 1;
        return sum;
      }
      if (criterion.is_required_feedback && !String(scores[criterion.id]?.feedback || "").trim()) {
        missingFeedbackCount += 1;
      }
      return sum + number;
    }, 0);
    const overallFeedbackMissing = !overallFeedback.trim();
    const overallFeedbackTooShort = Boolean(overallFeedback.trim()) && overallFeedback.trim().length < minOverallFeedbackLength;
    return { total, invalidCount, missingFeedbackCount, missingScoreCount, overallFeedbackMissing, overallFeedbackTooShort };
  }, [criteria, scores, overallFeedback, isDirectGrading, directScoreState]);

  const canSubmit = isDirectGrading
    ? !isConfirmed &&
      !directScoreState.scoreMissing &&
      !directScoreState.scoreInvalid &&
      !directScoreState.overallFeedbackMissing &&
      !directScoreState.overallFeedbackTooShort
    : !isConfirmed &&
      criteria.length > 0 &&
      scoreState.invalidCount === 0 &&
      scoreState.missingFeedbackCount === 0 &&
      scoreState.missingScoreCount === 0 &&
      !scoreState.overallFeedbackMissing &&
      !scoreState.overallFeedbackTooShort;
  const canSaveDraft = isDirectGrading
    ? !isConfirmed && !directScoreState.scoreInvalid
    : !isConfirmed && criteria.length > 0 && scoreState.invalidCount === 0;

  const buildPayload = (includeAll) => {
    if (isDirectGrading) {
      return {
        target_type: targetTypeBySource[sourceType],
        target_id: Number(submissionId),
        direct_score: directScore === "" ? null : Number(directScore),
        overall_feedback: overallFeedback,
        scores: [],
      };
    }
    return {
    target_type: targetTypeBySource[sourceType],
    target_id: Number(submissionId),
    evaluation_session_id: evaluation?.id || undefined,
    overall_feedback: overallFeedback,
    scores: criteria
      .filter((criterion) => includeAll || scores[criterion.id]?.score !== "")
      .map((criterion) => ({
        criterion_id: Number(criterion.id),
        score: Number(scores[criterion.id]?.score),
        feedback: scores[criterion.id]?.feedback || "",
      })),
    };
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const res = await gradingService.saveDraft(buildPayload(false));
      const nextEvaluation = res?.data || null;
      setData((prev) => ({
        ...prev,
        evaluation: nextEvaluation,
        current_score: nextEvaluation?.total_score ?? prev?.current_score,
        current_feedback: nextEvaluation?.overall_feedback ?? prev?.current_feedback,
      }));
      toast.success(t("lecturer.gradingPage.toasts.draftSaved"));
    } catch (err) {
      toast.error(err.message || t("lecturer.gradingPage.toasts.draftError"));
    } finally {
      setSaving(false);
    }
  };

  const submitEvaluation = async () => {
    setConfirmOpen(false);
    setSaving(true);
    try {
      const res = await gradingService.submit(buildPayload(true));
      const nextEvaluation = res?.data || null;
      setData((prev) => ({
        ...prev,
        evaluation: nextEvaluation,
        submission_status: "graded",
        current_score: nextEvaluation?.total_score ?? prev?.current_score,
        current_feedback: nextEvaluation?.overall_feedback ?? prev?.current_feedback,
      }));
      toast.success(t("lecturer.gradingPage.toasts.submitSuccess"));
    } catch (err) {
      toast.error(err.message || t("lecturer.gradingPage.toasts.submitError"));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    if (isDirectGrading) {
      setDirectScore(
        data?.current_score != null && data?.current_score !== ""
          ? String(data.current_score)
          : evaluation?.total_score != null
            ? String(evaluation.total_score)
            : "",
      );
      setOverallFeedback(evaluation?.overall_feedback || data?.current_feedback || "");
      return;
    }
    setScores(getInitialScores(criteria, evaluation));
    setOverallFeedback(evaluation?.overall_feedback || "");
  };

  const trackAiApplied = (suggestionId, field) => {
    aiAppliedRef.current.suggestionId = suggestionId;
    aiAppliedRef.current.fields.add(field);
  };

  const markAiEdited = async (field) => {
    const applied = aiAppliedRef.current;
    if (!applied.suggestionId || !applied.fields.has(field) || applied.edited.has(field)) return;
    applied.edited.add(field);
    try {
      await aiEvaluationApi.recordAction(applied.suggestionId, { action: "edited", field_name: field });
    } catch {
      // Do not block manual grading when action logging fails.
    }
  };

  const handleScoreChange = (criterionId, value) => {
    setScores((prev) => ({ ...prev, [criterionId]: value }));
    markAiEdited(`criterion:${criterionId}`);
  };

  const applyAiCriterion = (item) => {
    setScores((prev) => {
      const current = prev[item.criterion_id] || { score: "", feedback: "" };
      return {
        ...prev,
        [item.criterion_id]: {
          score: item.suggested_score === null || item.suggested_score === undefined ? current.score : String(item.suggested_score),
          feedback: item.suggested_feedback || current.feedback || "",
        },
      };
    });
  };

  const applyAiOverall = (feedback) => {
    setOverallFeedback(feedback || "");
  };

  if (forbidden) return <PageForbidden />;
  if (loading) return <div className="rounded-2xl bg-surface p-8 text-center text-sm text-text-muted">{t("lecturer.gradingPage.form.loading")}</div>;
  if (error) return <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-sm font-semibold text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button type="button" onClick={() => navigate(backPath)} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary">
            <ArrowLeft size={16} />
            {t("lecturer.gradingPage.backToList")}
          </button>
          <h1 className="text-2xl font-bold text-text-primary">{data.source_title}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {data.class_code} · {data.group_name || "—"}
          </p>
        </div>
        <EvaluationStatusBadge value={isDirectGrading ? (data.submission_status === "graded" ? "confirmed" : evaluation?.status || "not_started") : (evaluation?.status || "not_started")} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="rounded-2xl bg-surface p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Info label={t("filterLabels.class")} value={data.class_code} />
              <Info label={t("filterLabels.subject")} value={`${data.subject_code || ""} ${data.subject_name || ""}`.trim() || "—"} />
              <Info label={t("filterLabels.group")} value={data.group_name || "—"} />
              <Info label={t("admin.columns.submitted")} value={<DateTimeCell value={data.submitted_at} multiline={false} />} />
              <Info label={t("filterLabels.deadline")} value={<DateTimeCell value={data.source_deadline} multiline={false} />} />
              <Info label={t("lecturer.gradingPage.form.projectTopic")} value={data.topic || "—"} />
              <Info label={t("lecturer.gradingPage.form.currentScore")} value={data.current_score ?? "—"} />
              <Info label={t("filterLabels.late")} value={data.is_late ? t("status.late") : "—"} />
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary">{t("lecturer.gradingPage.form.submissionFiles")}</h2>
            <SubmissionFileList files={data.files || []} />
          </section>

          {!isDirectGrading ? (
            <AiAssistantPanel
              targetType={targetTypeBySource[sourceType]}
              targetId={submissionId}
              criteria={criteria}
              disabled={isConfirmed || saving}
              onApplyCriterion={applyAiCriterion}
              onApplyOverall={applyAiOverall}
              onTrackApplied={trackAiApplied}
            />
          ) : null}

          {isDirectGrading ? (
            <DirectGradingForm
              score={directScore}
              feedback={overallFeedback}
              maxScore={data.source_max_score}
              disabled={saving}
              scoreInvalid={directScoreState.scoreInvalid}
              scoreMissing={false}
              feedbackMissing={directScoreState.overallFeedbackMissing}
              feedbackTooShort={directScoreState.overallFeedbackTooShort}
              minFeedbackLength={minOverallFeedbackLength}
              onScoreChange={setDirectScore}
              onFeedbackChange={setOverallFeedback}
            />
          ) : (
            <>
          <section className="space-y-3">
            <div className="rounded-2xl bg-surface p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">{data.rubric?.name}</h2>
                  <p className="mt-1 text-sm text-text-secondary">{t("lecturer.gradingPage.form.rubricVersionTotal", { version: data.rubric?.version || 1, total: data.rubric?.total_score })}</p>
                </div>
                <span className="rounded-full border border-accent-100 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
                  {data.scoring?.method || "sum"}
                </span>
              </div>
            </div>
            <RubricCriteriaScoringForm
              criteria={criteria}
              scores={scores}
              disabled={isConfirmed || saving}
              submitMode
              onChange={handleScoreChange}
            />
          </section>

          <section className="rounded-2xl bg-surface p-5 shadow-sm">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-text-secondary">{t("lecturer.gradingPage.form.overallFeedback")}</span>
              <textarea
                rows={4}
                value={overallFeedback}
                disabled={isConfirmed || saving}
                onChange={(event) => {
                  setOverallFeedback(event.target.value);
                  markAiEdited("overall_feedback");
                }}
                className={`w-full resize-y rounded-xl border px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-text-muted ${
                  scoreState.overallFeedbackMissing || scoreState.overallFeedbackTooShort
                    ? "border-red-200 focus:border-red-300 focus:ring-red-100"
                    : "border-border focus:border-accent-300 focus:ring-accent-100"
                }`}
              />
              {scoreState.overallFeedbackMissing ? <span className="mt-1 block text-xs text-red-600">{t("lecturer.gradingPage.form.overallFeedbackRequired")}</span> : null}
              {scoreState.overallFeedbackTooShort ? <span className="mt-1 block text-xs text-red-600">{t("lecturer.gradingPage.form.overallFeedbackMinLength", { min: minOverallFeedbackLength })}</span> : null}
            </label>
          </section>
            </>
          )}
        </div>

        <aside className="space-y-4">
          <ScoreSummary
            total={scoreState.total}
            rubricTotal={isDirectGrading ? null : data.rubric?.total_score}
            sourceMax={data.source_max_score}
            invalidCount={scoreState.invalidCount}
            missingFeedbackCount={scoreState.missingFeedbackCount}
            missingScoreCount={scoreState.missingScoreCount}
            directMode={isDirectGrading}
          />
          <div className="rounded-2xl bg-surface p-4 shadow-sm">
            <div className="grid gap-2">
              <button
                type="button"
                disabled={!canSaveDraft || saving}
                onClick={saveDraft}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={16} />
                {t("lecturer.gradingPage.actions.saveDraft")}
              </button>
              <button
                type="button"
                disabled={!canSubmit || saving}
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                {t("lecturer.gradingPage.actions.submitScore")}
              </button>
              <button
                type="button"
                disabled={isConfirmed || saving}
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={16} />
                {t("lecturer.gradingPage.actions.reset")}
              </button>
            </div>
            {isConfirmed ? <p className="mt-3 text-xs text-text-secondary">{t("lecturer.gradingPage.form.confirmedReadOnly")}</p> : null}
          </div>
          {!isDirectGrading ? <EvaluationDetailPanel evaluation={evaluation} /> : null}
        </aside>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title={t("lecturer.gradingPage.confirmSubmit.title")}
        subtitle={t("lecturer.gradingPage.confirmSubmit.subtitle")}
        variant="warning"
        color="orange"
        yesLabel={t("lecturer.gradingPage.confirmSubmit.yes")}
        noLabel={t("common.cancel")}
        onYes={submitEvaluation}
        onNo={() => setConfirmOpen(false)}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase text-text-muted">{label}</p>
      <div className="mt-1 truncate text-sm font-semibold text-text-primary">{value}</div>
    </div>
  );
}
