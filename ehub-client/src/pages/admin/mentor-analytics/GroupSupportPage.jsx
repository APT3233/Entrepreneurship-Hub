import { useCallback, useEffect, useMemo, useState } from "react";
import MentorAnalyticsApi from "@/api/mentorAnalytics";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function GroupSupportPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "" });
  const [rows, setRows] = useState([]); const [meta, setMeta] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const res = await MentorAnalyticsApi.groupSupport(query); setRows(res?.data || []); setMeta(res?.meta || null); } catch (err) { setError(err.message || "Unable to load group support"); } finally { setLoading(false); } }, [query]);
  useEffect(() => { load(); }, [load]);
  const columns = useMemo(() => [
    { key: "group_name", label: "Group", render: (row) => <span className="font-black text-slate-900">{row.group_name}</span> },
    { key: "topic", label: "Project topic", render: (row) => row.topic || "-" },
    { key: "class_code", label: "Class" },
    { key: "mentor_assigned", label: "Mentor", render: (row) => row.mentor_assigned ? "Yes" : "No" },
    { key: "active_mentors", label: "Active mentors" },
    { key: "sessions_completed", label: "Completed sessions" },
    { key: "last_session", label: "Last session", render: (row) => formatDate(row.last_session) },
    { key: "feedback_status", label: "Feedback", render: (row) => <StatusBadge value={row.feedback_status} /> },
    { key: "support_status", label: "Support", render: (row) => <StatusBadge value={row.support_status} /> },
  ], []);
  return <><FilterBar><SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder="Group, topic, class..." /></FilterBar><AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText="No group support data" meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} /></>;
}
