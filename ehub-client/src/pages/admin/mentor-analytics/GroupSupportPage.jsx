import { useCallback, useEffect, useMemo, useState } from "react";
import MentorAnalyticsApi from "@/api/mentorAnalytics";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function GroupSupportPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "" });
  const [rows, setRows] = useState([]); const [meta, setMeta] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const res = await MentorAnalyticsApi.groupSupport(query); setRows(res?.data || []); setMeta(res?.meta || null); } catch (err) { setError(err.message || t("admin.mentorAnalytics.groupSupport.loadError")); } finally { setLoading(false); } }, [query, t]);
  useEffect(() => { load(); }, [load]);
  const columns = useMemo(() => [
    { key: "group_name", label: t("admin.mentorAnalytics.groupSupport.columns.group"), render: (row) => <span className="font-black text-slate-900">{row.group_name}</span> },
    { key: "topic", label: t("admin.mentorAnalytics.groupSupport.columns.topic"), render: (row) => row.topic || "-" },
    { key: "class_code", label: t("admin.mentorAnalytics.groupSupport.columns.class") },
    { key: "mentor_assigned", label: t("admin.mentorAnalytics.groupSupport.columns.mentorAssigned"), render: (row) => row.mentor_assigned ? t("admin.mentorWorkflow.common.yes") : t("admin.mentorWorkflow.common.no") },
    { key: "active_mentors", label: t("admin.mentorAnalytics.groupSupport.columns.activeMentors") },
    { key: "sessions_completed", label: t("admin.mentorAnalytics.groupSupport.columns.completedSessions") },
    { key: "last_session", label: t("admin.mentorAnalytics.groupSupport.columns.lastSession"), render: (row) => formatDate(row.last_session) },
    { key: "feedback_status", label: t("admin.mentorAnalytics.groupSupport.columns.feedback"), render: (row) => <StatusBadge value={row.feedback_status} /> },
    { key: "support_status", label: t("admin.mentorAnalytics.groupSupport.columns.support"), render: (row) => <StatusBadge value={row.support_status} /> },
  ], [t]);
  return (
    <>
      <FilterBar><SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.mentorAnalytics.groupSupport.searchPlaceholder")} /></FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.mentorAnalytics.groupSupport.emptyText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} />
    </>
  );
}
