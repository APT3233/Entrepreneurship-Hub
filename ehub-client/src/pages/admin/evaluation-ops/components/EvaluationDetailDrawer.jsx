import { useEffect, useState } from "react";
import { CheckCircle2, RotateCcw, X } from "lucide-react";
import { adminEvaluationService } from "@/api/adminEvaluationOps";
import { useToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import JsonDiffViewer from "@/pages/admin/evaluation-ops/components/JsonDiffViewer";
import { formatDate, formatScore } from "@/pages/admin/evaluation-ops/shared";

export default function EvaluationDetailDrawer({ sessionId, open, onClose, onChanged }) {
  const toast = useToast();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    if (!sessionId || !open) return;
    setLoading(true);
    setError("");
    try {
      const res = await adminEvaluationService.sessionDetail(sessionId);
      setDetail(res?.data || null);
    } catch (err) {
      setError(err.message || "Không tải được evaluation detail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [sessionId, open]);

  const runAction = async () => {
    if (!confirm || !detail) return;
    try {
      const fn = confirm.type === "confirm" ? adminEvaluationService.confirmSession : adminEvaluationService.reopenSession;
      const res = await fn(detail.session_id, { reason: confirm.reason || "" });
      setDetail(res?.data || detail);
      toast.success(confirm.type === "confirm" ? "Đã confirm evaluation." : "Đã reopen evaluation.");
      onChanged?.();
    } catch (err) {
      toast.error(err.message || "Không cập nhật được evaluation.");
    } finally {
      setConfirm(null);
    }
  };

  if (!open) return null;

  const scoreColumns = [
    { key: "criterion_name", label: "Criterion", render: (row) => <span className="font-semibold text-gray-900">{row.criterion_name}</span> },
    { key: "max_score", label: "Max", width: 90, render: (row) => Number(row.max_score || 0).toFixed(2) },
    { key: "weight", label: "Weight", width: 90, render: (row) => Number(row.weight || 0).toFixed(2) },
    { key: "score", label: "Score", width: 90, render: (row) => Number(row.score || 0).toFixed(2) },
    { key: "feedback", label: "Feedback", render: (row) => <span className="line-clamp-2">{row.feedback || "—"}</span> },
    { key: "required", label: "Required", width: 100, render: (row) => row.is_required_feedback ? "Yes" : "No" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[1px]" onClick={(event) => event.target === event.currentTarget && onClose?.()}>
      <aside className="flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Evaluation detail</p>
            <h2 className="mt-1 text-xl font-black text-gray-900">{detail?.target_title || `Session #${sessionId}`}</h2>
            {detail ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <StatusBadge value={detail.source_type} />
                <StatusBadge value={detail.status} />
                <span>{detail.class_code}</span>
                <span>{detail.group_code} - {detail.group_name}</span>
              </div>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-[#f0f4f8] p-6">
          {loading ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-400">Đang tải evaluation...</div> : null}
          {error ? <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-sm font-semibold text-red-600">{error}</div> : null}
          {detail && !loading ? (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Info label="Class" value={`${detail.class_code} · ${detail.subject_code} · ${detail.semester_code}`} />
                    <Info label="Group" value={`${detail.group_code} - ${detail.group_name}`} />
                    <Info label="Project/topic" value={detail.topic || "—"} />
                    <Info label="Submission" value={`${detail.submission_status} · ${formatDate(detail.submitted_at)}`} />
                    <Info label="Rubric" value={`${detail.rubric_name} v${detail.rubric_version || 1}`} />
                    <Info label="Evaluator" value={detail.evaluator_name || detail.evaluator_email || "—"} />
                  </div>
                </section>
                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-gray-500">Total score</p>
                  <p className="mt-2 text-4xl font-black text-gray-900">{formatScore(detail.total_score, detail.max_score)}</p>
                  <p className="mt-3 text-sm text-gray-500">Evaluated: {formatDate(detail.evaluated_at)}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" disabled={detail.status === "confirmed"} onClick={() => setConfirm({ type: "confirm" })} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">
                      <CheckCircle2 size={16} /> Confirm
                    </button>
                    <button type="button" disabled={detail.status === "draft"} onClick={() => setConfirm({ type: "reopen" })} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40">
                      <RotateCcw size={16} /> Reopen
                    </button>
                  </div>
                </section>
              </div>

              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Overall feedback</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{detail.overall_feedback || "—"}</p>
              </section>

              <AdminTable columns={scoreColumns} rows={detail.scores || []} loading={false} emptyText="Chưa có điểm criteria." />

              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">Submission files</h3>
                <div className="mt-3 divide-y divide-gray-100">
                  {(detail.files || []).length ? detail.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <span className="font-semibold text-gray-800">{file.file_name}</span>
                      <span className="text-gray-400">{formatDate(file.uploaded_at)}</span>
                    </div>
                  )) : <p className="text-sm text-gray-400">Submission chưa có file.</p>}
                </div>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">Audit gần nhất</h3>
                <div className="mt-3 space-y-3">
                  {(detail.audit_logs || []).length ? detail.audit_logs.map((log) => (
                    <div key={log.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="font-mono text-xs font-bold text-indigo-700">{log.action}</span>
                        <span className="text-gray-400">{formatDate(log.created_at)}</span>
                      </div>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        <JsonDiffViewer payload={log.old_values} />
                        <JsonDiffViewer payload={log.new_values} />
                      </div>
                    </div>
                  )) : <p className="text-sm text-gray-400">Chưa có audit log liên quan.</p>}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </aside>

      <ConfirmDialog
        isOpen={Boolean(confirm)}
        title={confirm?.type === "confirm" ? "Confirm evaluation?" : "Reopen evaluation?"}
        subtitle={confirm?.type === "confirm" ? "Evaluation sẽ được đánh dấu đã xác nhận." : "Evaluation sẽ quay về trạng thái draft để xử lý lại."}
        color={confirm?.type === "confirm" ? "indigo" : "orange"}
        yesLabel={confirm?.type === "confirm" ? "Confirm" : "Reopen"}
        onYes={runAction}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}
