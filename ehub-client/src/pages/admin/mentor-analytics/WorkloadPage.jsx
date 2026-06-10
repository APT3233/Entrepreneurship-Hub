import { useCallback, useEffect, useMemo, useState } from "react";
import MentorAnalyticsApi from "@/api/mentorAnalytics";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function MentorWorkloadPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "" });
  const [rows, setRows] = useState([]); const [meta, setMeta] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const res = await MentorAnalyticsApi.workload(query); setRows(res?.data || []); setMeta(res?.meta || null); } catch (err) { setError(err.message || t("admin.mentorAnalytics.workload.loadError")); } finally { setLoading(false); } }, [query, t]);
  useEffect(() => { load(); }, [load]);
  const columns = useMemo(() => [
    { key: "full_name", label: t("admin.mentorAnalytics.workload.columns.mentor"), render: (row) => <span className="font-black text-slate-900">{row.full_name}</span> },
    { key: "mentor_type", label: t("admin.mentorAnalytics.workload.columns.type"), render: (row) => <StatusBadge value={row.mentor_type} /> },
    { key: "organization", label: t("admin.mentorAnalytics.workload.columns.organization"), render: (row) => row.organization || "-" },
    { key: "active_assignments", label: t("admin.mentorAnalytics.workload.columns.activeAssignments") },
    { key: "scheduled_sessions", label: t("admin.mentorAnalytics.workload.columns.scheduled") },
    { key: "completed_sessions", label: t("admin.mentorAnalytics.workload.columns.completed") },
    { key: "total_hours", label: t("admin.mentorAnalytics.workload.columns.hours") },
    { key: "average_rating", label: t("admin.mentorAnalytics.workload.columns.rating"), render: (row) => row.average_rating ? Number(row.average_rating).toFixed(1) : "-" },
    { key: "pending_feedback_count", label: t("admin.mentorAnalytics.workload.columns.missingFeedback") },
    { key: "last_session_at", label: t("admin.mentorAnalytics.workload.columns.lastSession"), render: (row) => formatDate(row.last_session_at) },
    { key: "workload_status", label: t("admin.mentorAnalytics.workload.columns.workload"), render: (row) => <StatusBadge value={row.workload_status} /> },
  ], [t]);
  return (
    <>
      <FilterBar><SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.mentorAnalytics.workload.searchPlaceholder")} /></FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.mentorAnalytics.workload.emptyText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} />
    </>
  );
}
