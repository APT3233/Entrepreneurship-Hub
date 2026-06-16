import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Clipboard, Copy, RefreshCw, Sparkles, X } from "lucide-react";
import aiEvaluationApi from "@/api/aiEvaluation";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";

const statusTextKeys = {
  pending: "ai.suggestions.statusPending",
  processing: "ai.suggestions.statusProcessing",
  completed: "ai.suggestions.statusCompleted",
  failed: "ai.suggestions.statusFailed",
};

const confidenceText = (value) => {
  if (value === null || value === undefined) return "—";
  return `${Math.round(Number(value) * 100)}%`;
};

const getActionClasses = (status) => {
  if (status === "accepted") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (status === "copied") return "border-blue-100 bg-blue-50 text-blue-700";
  if (status === "ignored") return "border-gray-200 bg-gray-50 text-gray-500";
  return "border-gray-100 bg-gray-50 text-gray-500";
};

const getActionLabelKey = (status) => {
  if (status === "accepted") return "ai.assistant.appliedStatus";
  if (status === "copied") return "ai.assistant.copiedStatus";
  if (status === "ignored") return "ai.assistant.ignoredStatus";
  return "ai.assistant.notAppliedStatus";
};

function ListBlock({ title, items = [] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="text-sm font-bold text-gray-800">{title}</h4>
      <ul className="mt-2 space-y-1.5 text-sm leading-6 text-gray-600">
        {items.map((item, index) => <li key={`${title}-${index}`}>• {item}</li>)}
      </ul>
    </div>
  );
}

// Premium Skeleton Loader for AI Assistant Panel
function SkeletonLoader() {
  return (
    <div className="mt-5 space-y-6 animate-pulse">
      {/* Summary Skeleton */}
      <div className="space-y-2">
        <div className="h-5 w-24 bg-gray-200 rounded-lg"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded-lg w-full"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-11/12"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-4/5"></div>
        </div>
      </div>
      
      {/* Strengths/Weaknesses Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100/50">
            <div className="h-4 w-20 bg-gray-200 rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded-lg w-full"></div>
              <div className="h-3 bg-gray-200 rounded-lg w-5/6"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Project Potential Skeleton */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
        <div className="h-4 w-32 bg-gray-200 rounded-lg"></div>
        <div className="h-3 bg-gray-200 rounded-lg w-1/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded-lg w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded-lg w-1/3"></div>
        </div>
      </div>

      {/* Overall Feedback Skeleton */}
      <div className="rounded-xl border border-gray-100 p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-4 w-28 bg-gray-200 rounded-lg"></div>
          <div className="flex gap-2">
            <div className="h-7 w-16 bg-gray-200 rounded-lg"></div>
            <div className="h-7 w-16 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded-lg w-full"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-5/6"></div>
        </div>
      </div>
    </div>
  );
}

export default function AiAssistantPanel({
  targetType,
  targetId,
  criteria = [],
  disabled = false,
  onApplyCriterion,
  onApplyOverall,
  onTrackApplied,
}) {
  const toast = useToast();
  const { t, language } = useTranslation();
  const [suggestion, setSuggestion] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [actionState, setActionState] = useState({});

  const criterionById = useMemo(() => new Map(criteria.map((criterion) => [Number(criterion.id), criterion])), [criteria]);
  const isBusy = analyzing || ["pending", "processing"].includes(job?.status);

  const loadLatest = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await aiEvaluationApi.getLatestSuggestion(targetType, targetId);
      const data = res?.data || {};
      setSuggestion(data.suggestion || null);
      if (data.activeJob) {
        setJob(data.activeJob);
      }
    } catch (err) {
      setError(err.message || t("ai.assistant.failAnalyze"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSuggestion(null);
    setJob(null);
    setActionState({});
    loadLatest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);

  useEffect(() => {
    setActionState({});
  }, [suggestion?.id]);

  useEffect(() => {
    if (!job?.id || !["pending", "processing"].includes(job.status)) return undefined;
    const timer = setInterval(async () => {
      try {
        const res = await aiEvaluationApi.getJob(job.id);
        const nextJob = res?.data?.job;
        setJob(nextJob || null);
        if (res?.data?.suggestion) {
          setSuggestion(res.data.suggestion);
        }
        if (nextJob?.status === "failed") {
          setError(nextJob.error_message || t("ai.assistant.failAnalyze"));
        }
      } catch (err) {
        setError(err.message || t("ai.assistant.failAnalyze"));
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [job?.id, job?.status, t]);

  const analyze = async (forceRefresh = false) => {
    setAnalyzing(true);
    setError("");
    setSuggestion(null); // Clear old suggestion to show skeleton during active analysis
    try {
      const res = await aiEvaluationApi.analyze({
        target_type: targetType,
        target_id: Number(targetId),
        force_refresh: forceRefresh,
        locale: language || "vi",
      });
      const data = res?.data || {};
      setJob(data.job || null);
      if (data.suggestion) {
        setSuggestion(data.suggestion);
        setActionState({});
      }
      toast.success(data.suggestion ? t("ai.assistant.toastLoaded") : t("ai.assistant.toastQueued"));
    } catch (err) {
      setError(err.message || t("ai.assistant.errorTryAgain"));
      toast.error(err.message || t("ai.assistant.errorTryAgain"));
    } finally {
      setAnalyzing(false);
    }
  };

  const logAction = async (action, fieldName) => {
    if (!suggestion?.id) return;
    try {
      await aiEvaluationApi.recordAction(suggestion.id, { action, field_name: fieldName || null });
    } catch {
      // Action logging should not block grading flow.
    }
  };

  const setFieldAction = (fieldName, action) => {
    setActionState((prev) => ({ ...prev, [fieldName]: action }));
  };

  const ignoreField = async (fieldName) => {
    setFieldAction(fieldName, "ignored");
    await logAction("ignored", fieldName);
    toast.success(t("ai.assistant.ignoredToast"));
  };

  const applyCriterion = async (item) => {
    const fieldName = `criterion:${item.criterion_id}`;
    onApplyCriterion?.(item, suggestion.id);
    onTrackApplied?.(suggestion.id, fieldName);
    setFieldAction(fieldName, "accepted");
    await logAction("accepted", fieldName);
    toast.success(t("ai.assistant.applied"));
  };

  const applyOverall = async () => {
    const fieldName = "overall_feedback";
    onApplyOverall?.(suggestion.suggested_overall_feedback || "", suggestion.id);
    onTrackApplied?.(suggestion.id, fieldName);
    setFieldAction(fieldName, "accepted");
    await logAction("accepted", fieldName);
    toast.success(t("ai.assistant.applied"));
  };

  const copyOverall = async () => {
    try {
      await navigator.clipboard.writeText(suggestion?.suggested_overall_feedback || "");
      setFieldAction("overall_feedback", "copied");
      await logAction("copied", "overall_feedback");
      toast.success(t("ai.assistant.feedbackCopied"));
    } catch {
      toast.error(t("ai.assistant.copyFailed"));
    }
  };

  return (
    <section className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Sparkles size={18} /></span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("ai.assistant.panelTitle")}</h2>
              <p className="text-sm text-gray-500">{t("ai.assistant.warningText")}</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => analyze(Boolean(suggestion))}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={16} className={isBusy ? "animate-spin" : ""} />
          {suggestion ? t("ai.assistant.reAnalyze") : t("ai.assistant.analyzeNow")}
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
        <div className="flex gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{t("ai.assistant.warningText")}</span>
        </div>
      </div>

      {error ? <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p> : null}

      {/* Show Skeleton Loader when fetching or during background processing */}
      {loading || isBusy ? (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-indigo-700 animate-pulse">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping"></span>
            <span>
              {job?.status ? `${t("ai.assistant.statusPrefix", "Job")} #${job.id}: ${t(statusTextKeys[job.status] || job.status)}` : t("ai.assistant.analyzing")}
            </span>
          </div>
          <SkeletonLoader />
        </div>
      ) : null}

      {!loading && !isBusy && !suggestion ? (
        <div className="mt-4 rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
          {t("ai.assistant.notGenerated")}
        </div>
      ) : null}

      {!loading && !isBusy && suggestion ? (
        <div className="mt-5 space-y-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">Summary</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600 whitespace-pre-wrap">
              {suggestion.summary}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <ListBlock title={t("ai.assistant.strengths")} items={suggestion.strengths} />
            <ListBlock title={t("ai.assistant.weaknesses")} items={suggestion.weaknesses} />
            <ListBlock title={t("ai.assistant.missingRequirements")} items={suggestion.missing_requirements} />
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <h4 className="text-sm font-bold text-gray-800">{t("ai.assistant.projectPotential")}</h4>
            <p className="mt-1 text-sm font-semibold text-indigo-700">
              {suggestion.project_potential_level || "unknown"} · {confidenceText(suggestion.project_potential_confidence_score)}
            </p>
            <ListBlock title={t("ai.assistant.potentialReasons")} items={suggestion.project_potential_reasons} />
            <ListBlock title={t("ai.assistant.potentialNextSteps")} items={suggestion.project_potential_next_steps} />
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-800">{t("ai.assistant.overallFeedback")}</h4>
                  <ActionBadge status={actionState.overall_feedback} t={t} />
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600 whitespace-pre-wrap">
                  {suggestion.suggested_overall_feedback}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={applyOverall}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${actionState.overall_feedback === "accepted" ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"}`}
                >
                  <Check size={14} />
                  {actionState.overall_feedback === "accepted" ? t("ai.assistant.appliedButton") : t("ai.assistant.apply")}
                </button>
                <button
                  type="button"
                  onClick={copyOverall}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700"
                >
                  <Copy size={14} />
                  {t("ai.assistant.copyFeedback")}
                </button>
                <button
                  type="button"
                  disabled={actionState.overall_feedback === "ignored"}
                  onClick={() => ignoreField("overall_feedback")}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <X size={14} />
                  {actionState.overall_feedback === "ignored" ? t("ai.assistant.ignoredButton") : t("ai.assistant.ignore")}
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-800">{t("ai.assistant.rubricCriteria")}</h4>
            {(suggestion.criterion_suggestions || []).map((item) => {
              const criterion = criterionById.get(Number(item.criterion_id));
              const fieldName = `criterion:${item.criterion_id}`;
              const fieldStatus = actionState[fieldName];
              return (
                <div key={item.id || item.criterion_id} className={`rounded-xl border p-4 ${fieldStatus === "accepted" ? "border-emerald-100 bg-emerald-50/30" : fieldStatus === "ignored" ? "border-gray-100 bg-gray-50" : "border-gray-100"}`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900">{criterion?.name || item.criterion_name || `Criterion ${item.criterion_id}`}</p>
                        <ActionBadge status={fieldStatus} t={t} />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {t("ai.suggestions.colSuggestedScore")}: <span className="font-semibold text-indigo-700">{item.suggested_score ?? "—"}</span> / {criterion?.max_score ?? item.max_score ?? "—"} · {t("ai.suggestions.colConfidence")} {confidenceText(item.confidence_score)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-gray-600 whitespace-pre-wrap">
                        {item.suggested_feedback}
                      </p>
                      {item.evidence_text ? (
                        <p className="mt-2 rounded-lg bg-gray-50 p-2 text-xs leading-5 text-gray-500">
                          <Clipboard size={13} className="mr-1 inline" />
                          {item.evidence_text}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => applyCriterion(item)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 ${fieldStatus === "accepted" ? "bg-emerald-600" : "bg-indigo-600"}`}
                      >
                        <Check size={14} />
                        {fieldStatus === "accepted" ? t("ai.assistant.appliedButton") : t("ai.assistant.apply")}
                      </button>
                      <button
                        type="button"
                        disabled={fieldStatus === "ignored"}
                        onClick={() => ignoreField(fieldName)}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <X size={14} />
                        {fieldStatus === "ignored" ? t("ai.assistant.ignoredButton") : t("ai.assistant.ignore")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ActionBadge({ status, t }) {
  if (!status) return null;
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getActionClasses(status)}`}>
      {t(getActionLabelKey(status))}
    </span>
  );
}
