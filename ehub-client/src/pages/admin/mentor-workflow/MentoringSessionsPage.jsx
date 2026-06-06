import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import { MetricCard, sessionStatusOptions } from "./components";

export default function MentoringSessionsPage() {
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
    } catch (err) { setError(err.message || "Unable to load mentoring sessions"); }
    finally { setLoading(false); }
  }, [query]);

  useEffect(() => { load(); }, [load]);

  const columns = useMemo(() => [
    { key: "title", label: "Title", width: 220, render: (row) => <span className="font-black text-slate-900">{row.title}</span> },
    { key: "group_name", label: "Group", width: 170 },
    { key: "topic", label: "Project topic", width: 240, render: (row) => row.topic || "-" },
    { key: "class_code", label: "Class", width: 100 },
    { key: "scheduled_start_at", label: "Scheduled", width: 160, render: (row) => formatDate(row.scheduled_start_at) },
    { key: "duration_minutes", label: "Duration", width: 100, render: (row) => row.duration_minutes ? `${row.duration_minutes}m` : "-" },
    { key: "status", label: "Status", width: 120, render: (row) => <StatusBadge value={row.status} /> },
    { key: "session_type", label: "Type", width: 110, render: (row) => <StatusBadge value={row.session_type} /> },
    { key: "meeting_link", label: "Link", width: 80, render: (row) => row.meeting_link ? <a className="inline-flex rounded-lg p-2 text-teal-600 hover:bg-teal-50" href={row.meeting_link} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a> : "-" },
    { key: "feedback_count", label: "Feedback", width: 100, render: (row) => row.feedback_count || 0 },
  ], []);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6"><MetricCard label="Sessions" value={stats?.total_sessions} /><MetricCard label="Completed" value={stats?.completed_sessions} /><MetricCard label="Cancelled" value={stats?.cancelled_sessions} /><MetricCard label="Hours" value={Math.round(Number(stats?.mentoring_minutes || 0) / 60)} /><MetricCard label="No sessions" value={stats?.groups_without_sessions} /><MetricCard label="Missing feedback" value={stats?.sessions_missing_feedback} /></div>
      <FilterBar><SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder="Session, group, topic..." /><FilterSelect label="Status" value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={[{ value: "", label: "All" }, ...sessionStatusOptions]} /></FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText="No mentoring sessions" meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} />
    </div>
  );
}
