import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, X } from "lucide-react";
import { adminEvaluationService } from "@/api/adminEvaluationOps";
import { useToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import JsonDiffViewer from "@/pages/admin/evaluation-ops/components/JsonDiffViewer";
import { formatDate, formatDateTimeText, formatScore } from "@/pages/admin/evaluation-ops/shared";
import { useTranslation } from "@/context/TranslationContext";
import { useAdminColumns } from "@/utils/adminLabels";

export default function EvaluationDetailDrawer({ sessionId, open, onClose, onChanged }) {
  const { t, language } = useTranslation();
  const c = useAdminColumns();
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
      setError(err.message || t("admin.evaluationOps.drawer.loadError"));
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
      toast.success(confirm.type === "confirm" ? t("admin.evaluationOps.drawer.confirmToast") : t("admin.evaluationOps.drawer.reopenToast"));
      onChanged?.();
    } catch (err) {
      toast.error(err.message || t("admin.evaluationOps.drawer.updateError"));
    } finally {
      setConfirm(null);
    }
  };

  const scoreColumns = useMemo(() => [
    { key: "criterion_name", label: c.criterion, render: (row) => <span className="font-semibold text-gray-900">{row.criterion_name}</span> },
    { key: "max_score", label: c.max, width: 90, render: (row) => Number(row.max_score || 0).toFixed(2) },
    { key: "weight", label: c.weight, width: 90, render: (row) => Number(row.weight || 0).toFixed(2) },
    { key: "score", label: c.score, width: 90, render: (row) => Number(row.score || 0).toFixed(2) },
    { key: "feedback", label: c.feedback, render: (row) => <span className="line-clamp-2">{row.feedback || "—"}</span> },
    { key: "required", label: c.required, width: 100, render: (row) => row.is_required_feedback ? t("admin.evaluationOps.drawer.yes") : t("admin.evaluationOps.drawer.no") },
  ], [c, t]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[1px]" onClick={(event) => event.target === event.currentTarget && onClose?.()}>
      <aside className="flex h-full w-full max-w-5xl flex-col overflow-hidden bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{t("admin.evaluationOps.drawer.title")}</p>
            <h2 className="mt-1 text-xl font-black text-gray-900">{detail?.target_title || `${c.session} #${sessionId}`}</h2>
            {detail ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <StatusBadge value={detail.source_type} />
                <StatusBadge value={detail.status} />
                <span>{detail.class_code}</span>
                <span>{detail.group_name || "—"}</span>
              </div>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-[#f0f4f8] p-6">
          {loading ? <div className="rounded-card bg-surface p-8 text-center text-sm text-gray-400">{t("admin.evaluationOps.drawer.loading")}</div> : null}
          {error ? <div className="rounded-card border border-red-100 bg-red-50 p-8 text-center text-sm font-semibold text-red-600">{error}</div> : null}
          {detail && !loading ? (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <section className="rounded-card border border-border bg-surface p-5">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Info label={c.class} value={`${detail.class_code} · ${detail.subject_code} · ${detail.semester_code}`} />
                    <Info label={c.group} value={detail.group_name || "—"} />
                    <Info label={c.projectTopic} value={detail.topic || "—"} />
                    <Info label={t("admin.evaluationOps.drawer.submission")} value={`${detail.submission_status} · ${formatDateTimeText(detail.submitted_at, language)}`} />
                    <Info label={c.rubric} value={`${detail.rubric_name} v${detail.rubric_version || 1}`} />
                    <Info label={c.evaluator} value={detail.evaluator_name || detail.evaluator_email || "—"} />
                  </div>
                </section>
                <section className="rounded-card border border-border bg-surface p-5">
                  <p className="text-sm font-semibold text-gray-500">{t("admin.evaluationOps.drawer.totalScore")}</p>
                  <p className="mt-2 text-4xl font-black text-gray-900">{formatScore(detail.total_score, detail.max_score)}</p>
                  <p className="mt-3 text-sm text-gray-500">{t("admin.evaluationOps.drawer.evaluated")}: {formatDate(detail.evaluated_at)}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" disabled={detail.status === "confirmed"} onClick={() => setConfirm({ type: "confirm" })} className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">
                      <CheckCircle2 size={16} /> {t("admin.evaluationOps.drawer.confirm")}
                    </button>
                    <button type="button" disabled={detail.status === "draft"} onClick={() => setConfirm({ type: "reopen" })} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40">
                      <RotateCcw size={16} /> {t("admin.evaluationOps.drawer.reopen")}
                    </button>
                  </div>
                </section>
              </div>

              <section className="rounded-card border border-border bg-surface p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{t("admin.evaluationOps.drawer.overallFeedback")}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{detail.overall_feedback || "—"}</p>
              </section>

              <AdminTable columns={scoreColumns} rows={detail.scores || []} loading={false} emptyText={t("admin.evaluationOps.drawer.emptyCriteriaScores")} />

              <section className="rounded-card border border-border bg-surface p-5">
                <h3 className="text-lg font-bold text-gray-900">{t("admin.evaluationOps.drawer.submissionFiles")}</h3>
                <div className="mt-3 divide-y divide-border">
                  {(detail.files || []).length ? detail.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <span className="font-semibold text-gray-800">{file.file_name}</span>
                      <span className="text-gray-400">{formatDate(file.uploaded_at)}</span>
                    </div>
                  )) : <p className="text-sm text-gray-400">{t("admin.evaluationOps.drawer.noFiles")}</p>}
                </div>
              </section>

              <section className="rounded-card border border-border bg-surface p-5">
                <h3 className="text-lg font-bold text-gray-900">{t("admin.evaluationOps.drawer.recentAudit")}</h3>
                <div className="mt-3 space-y-3">
                  {(detail.audit_logs || []).length ? detail.audit_logs.map((log) => (
                    <div key={log.id} className="rounded-xl border border-border bg-gray-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="font-mono text-xs font-bold text-accent">{log.action}</span>
                        <span className="text-gray-400">{formatDate(log.created_at)}</span>
                      </div>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        <JsonDiffViewer payload={log.old_values} />
                        <JsonDiffViewer payload={log.new_values} />
                      </div>
                    </div>
                  )) : <p className="text-sm text-gray-400">{t("admin.evaluationOps.drawer.noAudit")}</p>}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </aside>

      <ConfirmDialog
        isOpen={Boolean(confirm)}
        title={confirm?.type === "confirm" ? t("admin.evaluationOps.drawer.confirmTitle") : t("admin.evaluationOps.drawer.reopenTitle")}
        subtitle={confirm?.type === "confirm" ? t("admin.evaluationOps.drawer.confirmSubtitle") : t("admin.evaluationOps.drawer.reopenSubtitle")}
        color={confirm?.type === "confirm" ? "indigo" : "orange"}
        yesLabel={confirm?.type === "confirm" ? t("admin.evaluationOps.drawer.confirmYes") : t("admin.evaluationOps.drawer.reopenYes")}
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
