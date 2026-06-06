import { useCallback, useEffect, useMemo, useState } from "react";
import MentorAnalyticsApi from "@/api/mentorAnalytics";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function MentorWorkloadPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "" });
  const [rows, setRows] = useState([]); const [meta, setMeta] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const res = await MentorAnalyticsApi.workload(query); setRows(res?.data || []); setMeta(res?.meta || null); } catch (err) { setError(err.message || "Unable to load workload"); } finally { setLoading(false); } }, [query]);
  useEffect(() => { load(); }, [load]);
  const columns = useMemo(() => [
    { key: "full_name", label: "Mentor", render: (row) => <span className="font-black text-slate-900">{row.full_name}</span> },
    { key: "mentor_type", label: "Type", render: (row) => <StatusBadge value={row.mentor_type} /> },
    { key: "organization", label: "Organization", render: (row) => row.organization || "-" },
    { key: "active_assignments", label: "Active assignments" },
    { key: "scheduled_sessions", label: "Scheduled" },
    { key: "completed_sessions", label: "Completed" },
    { key: "total_hours", label: "Hours" },
    { key: "average_rating", label: "Rating", render: (row) => row.average_rating ? Number(row.average_rating).toFixed(1) : "-" },
    { key: "pending_feedback_count", label: "Missing feedback" },
    { key: "last_session_at", label: "Last session", render: (row) => formatDate(row.last_session_at) },
    { key: "workload_status", label: "Workload", render: (row) => <StatusBadge value={row.workload_status} /> },
  ], []);
  return <><FilterBar><SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder="Mentor or organization..." /></FilterBar><AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText="No workload data" meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} /></>;
}
