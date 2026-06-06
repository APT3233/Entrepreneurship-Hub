import { useCallback, useEffect, useMemo, useState } from "react";
import MentorAnalyticsApi from "@/api/mentorAnalytics";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";

const fmt = (value) => value == null ? "-" : Number(value).toFixed(1);

export default function MentorEffectivenessPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const [rows, setRows] = useState([]); const [meta, setMeta] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const res = await MentorAnalyticsApi.effectiveness(query); setRows(res?.data || []); setMeta(res?.meta || null); } catch (err) { setError(err.message || "Unable to load effectiveness"); } finally { setLoading(false); } }, [query]);
  useEffect(() => { load(); }, [load]);
  const columns = useMemo(() => [
    { key: "full_name", label: "Mentor", render: (row) => <span className="font-black text-slate-900">{row.full_name}</span> },
    { key: "mentor_type", label: "Type", render: (row) => <StatusBadge value={row.mentor_type} /> },
    { key: "total_groups_supported", label: "Groups" },
    { key: "average_group_score_before", label: "Score before", render: (row) => fmt(row.average_group_score_before) },
    { key: "average_group_score_after", label: "Score after", render: (row) => fmt(row.average_group_score_after) },
    { key: "average_session_rating", label: "Session rating", render: (row) => fmt(row.average_session_rating) },
    { key: "student_feedback_score", label: "Student score", render: (row) => fmt(row.student_feedback_score) },
    { key: "lecturer_feedback_score", label: "Lecturer score", render: (row) => fmt(row.lecturer_feedback_score) },
    { key: "completed_action_items_rate", label: "Action done %", render: (row) => fmt(row.completed_action_items_rate) },
    { key: "continuation_rate", label: "Continuation", render: (row) => `${Number(row.continuation_rate || 0)}%` },
  ], []);
  return <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText="No effectiveness data" meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} />;
}
