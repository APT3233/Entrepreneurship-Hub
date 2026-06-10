import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import MentorMatchingApi from "@/api/mentorMatching";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { MetricCard } from "@/pages/admin/mentor-workflow/components";
import { formatDate } from "@/utils/dateTimeDisplay";
import { ScoreBadge, SuggestionSummary } from "./components";

export default function MatchingDetailPage() {
  const { t } = useTranslation();
  const { requestId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const res = await MentorMatchingApi.getRequest(requestId); setRequest(res?.data || null); }
    catch (err) { setError(err.message || t("admin.mentorMatching.detailLoadError")); }
    finally { setLoading(false); }
  }, [requestId, t]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    try {
      const res = await MentorMatchingApi.generate(requestId, { matching_method: "hybrid", limit: 10 });
      toast.success((res?.data?.warnings || []).length ? t("admin.mentorMatching.generateSuccessAi") : t("admin.mentorMatching.generateSuccess"));
      await load();
    } catch (err) { toast.error(err.message || t("admin.mentorMatching.generateError")); }
  };

  const runAction = async () => {
    if (!confirm) return;
    try {
      if (confirm.type === "convert") await MentorMatchingApi.convertToAssignment(confirm.row.id, { assignment_type: confirm.row.recommended_assignment_type || "supporting", status: "proposed" });
      else await MentorMatchingApi.recordAction(confirm.row.id, { action: confirm.type });
      toast.success(t("admin.mentorMatching.actionSaved")); setConfirm(null); await load();
    } catch (err) { toast.error(err.message || t("admin.mentorMatching.actionFailed")); }
  };

  const suggestions = request?.suggestions || [];
  const columns = useMemo(() => [
    { key: "mentor_name", label: t("admin.mentorMatching.columns.mentor"), width: 180, render: (row) => <span className="font-black text-slate-900">{row.mentor_name}</span> },
    { key: "mentor_type", label: t("admin.mentorMatching.columns.type"), render: (row) => <StatusBadge value={row.mentor_type} /> },
    { key: "organization", label: t("admin.mentorMatching.columns.organization"), render: (row) => row.organization || "-" },
    { key: "expertise_names", label: t("admin.mentorMatching.columns.expertise"), width: 240, render: (row) => row.expertise_names || "-" },
    { key: "score", label: t("admin.mentorMatching.columns.score"), render: (row) => <ScoreBadge score={row.score} /> },
    { key: "match_level", label: t("admin.mentorMatching.columns.level"), render: (row) => <StatusBadge value={row.match_level} /> },
    { key: "active_assignment_count", label: t("admin.mentorMatching.columns.workload") },
    { key: "average_rating", label: t("admin.mentorMatching.columns.rating"), render: (row) => row.average_rating ? Number(row.average_rating).toFixed(1) : "-" },
    { key: "latest_action", label: t("admin.mentorMatching.columns.action"), render: (row) => row.latest_action ? <StatusBadge value={row.latest_action} /> : "-" },
    { key: "actions", label: "", width: 180, render: (row) => <div className="flex justify-end gap-1"><button className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" onClick={(e) => { e.stopPropagation(); setConfirm({ row, type: "approved", title: t("admin.mentorMatching.approveSuggestion") }); }}><CheckCircle2 size={16} /></button><button className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" onClick={(e) => { e.stopPropagation(); setConfirm({ row, type: "rejected", title: t("admin.mentorMatching.rejectSuggestion") }); }}><XCircle size={16} /></button><button className="rounded-lg px-2 py-1 text-xs font-black text-indigo-600 hover:bg-indigo-50" onClick={(e) => { e.stopPropagation(); setConfirm({ row, type: "convert", title: t("admin.mentorMatching.convertTitle") }); }}>{t("admin.mentorMatching.convert")}</button></div> },
  ], [t]);

  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">{t("common.loading")}...</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  if (!request) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700"><ArrowLeft size={16} /> {t("admin.mentorMatching.back")}</button>
        <button onClick={generate} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-black text-white hover:bg-teal-700"><Sparkles size={16} /> {t("admin.mentorMatching.generateSuggestions")}</button>
      </div>
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-xl font-black text-slate-900">{request.group_name}</h2><p className="mt-1 text-sm font-medium text-slate-500">{request.topic || t("admin.mentorWorkflow.common.noTopic")}</p></div>
          <div className="flex gap-2"><StatusBadge value={request.status} /><StatusBadge value={request.priority} /></div>
        </div>
        <p className="mt-4 text-sm text-slate-700">{request.support_needed}</p>
      </section>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label={t("admin.mentorMatching.metrics.suggestions")} value={suggestions.length} />
        <MetricCard label={t("admin.mentorMatching.metrics.topScore")} value={suggestions[0]?.score ? Number(suggestions[0].score).toFixed(1) : 0} />
        <MetricCard label={t("admin.mentorMatching.metrics.preferred")} value={t(`status.${request.preferred_mentor_type}`)} />
        <MetricCard label={t("admin.mentorMatching.metrics.created")} value={formatDate(request.created_at)} />
      </div>
      {suggestions[0] ? <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h3 className="mb-4 text-sm font-black text-slate-900">{t("admin.mentorMatching.topSuggestion")}</h3><SuggestionSummary suggestion={suggestions[0]} /></section> : null}
      <AdminTable columns={columns} rows={suggestions} emptyText={t("admin.mentorMatching.emptySuggestions")} />
      <ConfirmDialog isOpen={!!confirm} title={confirm?.title} subtitle={confirm?.row ? `${confirm.row.mentor_name} · ${request.group_name}` : ""} variant="confirm" color={confirm?.type === "rejected" ? "red" : "green"} yesLabel={t("common.confirm")} noLabel={t("common.cancel")} onYes={runAction} onNo={() => setConfirm(null)} onClose={() => setConfirm(null)} />
    </div>
  );
}
