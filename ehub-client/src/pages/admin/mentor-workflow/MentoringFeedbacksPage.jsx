import { useCallback, useEffect, useMemo, useState } from "react";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function MentoringFeedbacksPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "" });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const res = await MentorWorkflowApi.adminFeedbacks(query); setRows(res?.data || []); setMeta(res?.meta || null); } catch (err) { setError(err.message || "Unable to load feedback"); } finally { setLoading(false); } }, [query]);
  useEffect(() => { load(); }, [load]);
  const columns = useMemo(() => [
    { key: "session_title", label: "Session", render: (row) => <span className="font-black text-slate-900">{row.session_title}</span> },
    { key: "group_name", label: "Group" },
    { key: "mentor_name", label: "Mentor" },
    { key: "from_role", label: "From", render: (row) => <StatusBadge value={row.from_role} /> },
    { key: "rating", label: "Rating", render: (row) => row.rating || "-" },
    { key: "feedback", label: "Feedback", render: (row) => row.feedback || "-" },
    { key: "created_at", label: "Created", render: (row) => formatDate(row.created_at) },
  ], []);
  return <><FilterBar><SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder="Session, group, mentor..." /></FilterBar><AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText="No mentoring feedback" meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} /></>;
}
