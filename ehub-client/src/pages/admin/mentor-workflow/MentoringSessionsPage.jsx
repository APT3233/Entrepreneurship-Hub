import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import { MetricCard, useSessionStatusOptions } from "./components";

export default function MentoringSessionsPage() {
  const { t } = useTranslation();
  const sessionStatusOptions = useSessionStatusOptions();
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", status: "" });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await MentorWorkflowApi.adminSessions(query);
      setRows(res?.data || []); setMeta(res?.meta || null); setStats(res?.stats || null);
    } catch (err) { setError(err.message || t("admin.mentorWorkflow.sessions.loadError")); }
    finally { setLoading(false); }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  const columns = useMemo(() => [
    { key: "title", label: t("admin.mentorWorkflow.sessions.columns.title"), width: 220, render: (row) => <span className="font-black text-slate-900">{row.title}</span> },
    { key: "group_name", label: t("admin.mentorWorkflow.sessions.columns.group"), width: 170 },
    { key: "topic", label: t("admin.mentorWorkflow.sessions.columns.topic"), width: 240, render: (row) => row.topic || "-" },
    { key: "class_code", label: t("admin.mentorWorkflow.sessions.columns.class"), width: 100 },
    { key: "scheduled_start_at", label: t("admin.mentorWorkflow.sessions.columns.scheduled"), width: 160, render: (row) => formatDate(row.scheduled_start_at) },
    { key: "duration_minutes", label: t("admin.mentorWorkflow.sessions.columns.duration"), width: 100, render: (row) => row.duration_minutes ? t("admin.mentorWorkflow.sessions.columns.minutes", { count: row.duration_minutes }) : "-" },
    { key: "status", label: t("admin.mentorWorkflow.sessions.columns.status"), width: 120, render: (row) => <StatusBadge value={row.status} /> },
    { key: "session_type", label: t("admin.mentorWorkflow.sessions.columns.type"), width: 110, render: (row) => <StatusBadge value={row.session_type} /> },
    { key: "meeting_link", label: t("admin.mentorWorkflow.sessions.columns.link"), width: 80, render: (row) => row.meeting_link ? <a className="inline-flex rounded-lg p-2 text-accent hover:bg-accent-bg" href={row.meeting_link} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a> : "-" },
    { key: "feedback_count", label: t("admin.mentorWorkflow.sessions.columns.feedback"), width: 100, render: (row) => row.feedback_count || 0 },
  ], [t]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label={t("admin.mentorWorkflow.sessions.metrics.sessions")} value={stats?.total_sessions} />
        <MetricCard label={t("admin.mentorWorkflow.sessions.metrics.completed")} value={stats?.completed_sessions} />
        <MetricCard label={t("admin.mentorWorkflow.sessions.metrics.cancelled")} value={stats?.cancelled_sessions} />
        <MetricCard label={t("admin.mentorWorkflow.sessions.metrics.hours")} value={Math.round(Number(stats?.mentoring_minutes || 0) / 60)} />
        <MetricCard label={t("admin.mentorWorkflow.sessions.metrics.noSessions")} value={stats?.groups_without_sessions} />
        <MetricCard label={t("admin.mentorWorkflow.sessions.metrics.missingFeedback")} value={stats?.sessions_missing_feedback} />
      </div>
      <FilterBar>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.mentorWorkflow.sessions.searchPlaceholder")} />
        <FilterSelect label={t("admin.mentorWorkflow.sessions.columns.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={[{ value: "", label: t("common.all") }, ...sessionStatusOptions]} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.mentorWorkflow.sessions.emptyText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} />
    </div>
  );
}
