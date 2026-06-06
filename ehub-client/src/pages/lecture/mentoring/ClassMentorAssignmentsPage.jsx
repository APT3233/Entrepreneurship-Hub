import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function ClassMentorAssignmentsPage() {
  const { classId } = useParams();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const res = await MentorWorkflowApi.lecturerClassAssignments(classId, query); setRows(res?.data || []); setMeta(res?.meta || null); } catch (err) { setError(err.message || "Unable to load mentor assignments"); } finally { setLoading(false); } }, [classId, query]);
  useEffect(() => { load(); }, [load]);
  const columns = useMemo(() => [{ key: "mentor_name", label: "Mentor", render: (row) => <span className="font-black text-slate-900">{row.mentor_name}</span> }, { key: "group_name", label: "Group" }, { key: "topic", label: "Topic", render: (row) => row.topic || "-" }, { key: "assignment_type", label: "Type", render: (row) => <StatusBadge value={row.assignment_type} /> }, { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> }, { key: "start_date", label: "Start", render: (row) => formatDate(row.start_date) }], []);
  return <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText="No mentor assignments" meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} />;
}
