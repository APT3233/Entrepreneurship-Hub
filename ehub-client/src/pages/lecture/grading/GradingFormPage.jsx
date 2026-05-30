import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RotateCcw, Save, Send } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ConfirmModal from "@/components/modal/ConfirmModal";
import PageForbidden from "@/components/PageForbidden";
import DateTimeCell from "@/components/ui/DateTimeCell";
import { useToast } from "@/components/ui/Toast";
import gradingService from "@/api/grading";
import EvaluationStatusBadge from "./components/EvaluationStatusBadge";
import RubricCriteriaScoringForm from "./components/RubricCriteriaScoringForm";
import ScoreSummary from "./components/ScoreSummary";
import SubmissionFileList from "./components/SubmissionFileList";
import EvaluationDetailPanel from "./components/EvaluationDetailPanel";

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
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [scores, setScores] = useState({});
  const [overallFeedback, setOverallFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const criteria = data?.rubric?.criteria || [];
  const evaluation = data?.evaluation || null;
  const isConfirmed = evaluation?.status === "confirmed";
  const backPath = location.state?.from || "/lecturer/grading";

  const load = async () => {
    setLoading(true);
    setError("");
    setForbidden(false);
    try {
      const res = await gradingService.gradingForm(targetTypeBySource[sourceType], submissionId);
      const next = res?.data || null;
      setData(next);
      setScores(getInitialScores(next?.rubric?.criteria || [], next?.evaluation));
      setOverallFeedback(next?.evaluation?.overall_feedback || "");
    } catch (err) {
      if (err.status === 403) setForbidden(true);
      else setError(err.message || "Không tải được form chấm điểm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [sourceType, submissionId]);

  const scoreState = useMemo(() => {
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
  }, [criteria, scores, overallFeedback]);

  const canSubmit =
    !isConfirmed &&
    criteria.length > 0 &&
    scoreState.invalidCount === 0 &&
    scoreState.missingFeedbackCount === 0 &&
    scoreState.missingScoreCount === 0 &&
    !scoreState.overallFeedbackMissing &&
    !scoreState.overallFeedbackTooShort;
  const canSaveDraft = !isConfirmed && criteria.length > 0 && scoreState.invalidCount === 0;

  const buildPayload = (includeAll) => ({
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
  });

  const saveDraft = async () => {
    setSaving(true);
    try {
      const res = await gradingService.saveDraft(buildPayload(false));
      setData((prev) => ({ ...prev, evaluation: res?.data || null }));
      toast.success("Đã lưu draft evaluation");
    } catch (err) {
      toast.error(err.message || "Không lưu được draft.");
    } finally {
      setSaving(false);
    }
  };

  const submitEvaluation = async () => {
    setConfirmOpen(false);
    setSaving(true);
    try {
      const res = await gradingService.submit(buildPayload(true));
      setData((prev) => ({ ...prev, evaluation: res?.data || null }));
      toast.success("Đã submit điểm chính thức");
    } catch (err) {
      toast.error(err.message || "Không submit được evaluation.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setScores(getInitialScores(criteria, evaluation));
    setOverallFeedback(evaluation?.overall_feedback || "");
  };

  if (forbidden) return <PageForbidden />;
  if (loading) return <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400">Đang tải form chấm điểm...</div>;
  if (error) return <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-sm font-semibold text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button type="button" onClick={() => navigate(backPath)} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800">
            <ArrowLeft size={16} />
            Quay lại danh sách bài nộp
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{data.source_title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data.class_code} · {data.group_code} - {data.group_name}
          </p>
        </div>
        <EvaluationStatusBadge value={evaluation?.status || "not_started"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Info label="Class" value={data.class_code} />
              <Info label="Subject" value={`${data.subject_code || ""} ${data.subject_name || ""}`.trim() || "—"} />
              <Info label="Group" value={`${data.group_code} - ${data.group_name}`} />
              <Info label="Submitted" value={<DateTimeCell value={data.submitted_at} />} />
              <Info label="Deadline" value={<DateTimeCell value={data.source_deadline} />} />
              <Info label="Project/topic" value={data.topic || "—"} />
              <Info label="Current score" value={data.current_score ?? "—"} />
              <Info label="Late" value={data.is_late ? "Late" : "—"} />
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">Submission files</h2>
            <SubmissionFileList files={data.files || []} />
          </section>

          <section className="space-y-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{data.rubric?.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">Version {data.rubric?.version || 1} · Total {data.rubric?.total_score}</p>
                </div>
                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {data.scoring?.method || "sum"}
                </span>
              </div>
            </div>
            <RubricCriteriaScoringForm
              criteria={criteria}
              scores={scores}
              disabled={isConfirmed || saving}
              submitMode
              onChange={(criterionId, value) => setScores((prev) => ({ ...prev, [criterionId]: value }))}
            />
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-gray-700">Feedback tổng</span>
              <textarea
                rows={4}
                value={overallFeedback}
                disabled={isConfirmed || saving}
                onChange={(event) => setOverallFeedback(event.target.value)}
                className={`w-full resize-y rounded-xl border px-3 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-400 ${
                  scoreState.overallFeedbackMissing || scoreState.overallFeedbackTooShort
                    ? "border-red-200 focus:border-red-300 focus:ring-red-100"
                    : "border-gray-200 focus:border-indigo-300 focus:ring-indigo-100"
                }`}
              />
              {scoreState.overallFeedbackMissing ? <span className="mt-1 block text-xs text-red-600">Feedback tổng là bắt buộc khi submit.</span> : null}
              {scoreState.overallFeedbackTooShort ? <span className="mt-1 block text-xs text-red-600">Feedback tổng cần ít nhất {minOverallFeedbackLength} ký tự.</span> : null}
            </label>
          </section>
        </div>

        <aside className="space-y-4">
          <ScoreSummary
            total={scoreState.total}
            rubricTotal={data.rubric?.total_score}
            sourceMax={data.source_max_score}
            invalidCount={scoreState.invalidCount}
            missingFeedbackCount={scoreState.missingFeedbackCount}
            missingScoreCount={scoreState.missingScoreCount}
          />
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="grid gap-2">
              <button
                type="button"
                disabled={!canSaveDraft || saving}
                onClick={saveDraft}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={16} />
                Lưu draft
              </button>
              <button
                type="button"
                disabled={!canSubmit || saving}
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                Submit điểm
              </button>
              <button
                type="button"
                disabled={isConfirmed || saving}
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Đặt lại
              </button>
            </div>
            {isConfirmed ? <p className="mt-3 text-xs text-gray-500">Evaluation đã confirmed, chỉ được xem.</p> : null}
          </div>
          <EvaluationDetailPanel evaluation={evaluation} />
        </aside>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Submit điểm chính thức?"
        subtitle="Điểm sẽ được ghi chính thức vào bài nộp. Hãy kiểm tra kỹ trước khi xác nhận."
        variant="warning"
        color="orange"
        yesLabel="Submit điểm"
        noLabel="Huỷ"
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
      <p className="text-xs font-semibold uppercase text-gray-400">{label}</p>
      <div className="mt-1 truncate text-sm font-semibold text-gray-800">{value}</div>
    </div>
  );
}
