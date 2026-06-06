import { useCallback, useEffect, useMemo, useState } from "react";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";

const statusOptions = ["open", "in_progress", "done", "cancelled"].map((value) => ({ value, label: value }));

export default function MentoringActionItemsPage() {
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", status: "" });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const res = await MentorWorkflowApi.adminActionItems(query); setRows(res?.data || []); setMeta(res?.meta || null); } catch (err) { setError(err.message || "Unable to load action items"); } finally { setLoading(false); } }, [query]);
  useEffect(() => { load(); }, [load]);
  const columns = useMemo(() => [
    { key: "title", label: "Action item", render: (row) => <span className="font-black text-slate-900">{row.title}</span> },
    { key: "session_title", label: "Session" },
    { key: "group_name", label: "Group" },
    { key: "assigned_to_name", label: "Assigned to", render: (row) => row.assigned_to_name || "-" },
    { key: "due_date", label: "Due", render: (row) => formatDate(row.due_date) },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "created_at", label: "Created", render: (row) => formatDate(row.created_at) },
  ], []);
  return <><FilterBar><SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder="Action item, group, session..." /><FilterSelect label="Status" value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={[{ value: "", label: "All" }, ...statusOptions]} /></FilterBar><AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText="No action items" meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} /></>;
}
