import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GroupApi from "@/api/group";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function StudentMentoringPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const groupsRes = await GroupApi.getMyGroups(); const groups = groupsRes?.data || []; const sessions = await Promise.all(groups.map((group) => MentorWorkflowApi.groupSessions(group.id, { limit: 100 }))); setRows(sessions.flatMap((res) => res?.data || [])); } catch (err) { setError(err.message || "Unable to load mentoring sessions"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const columns = useMemo(() => [{ key: "title", label: "Title", render: (row) => <span className="font-black text-slate-900">{row.title}</span> }, { key: "group_name", label: "Group" }, { key: "mentor_name", label: "Mentor" }, { key: "scheduled_start_at", label: "Scheduled", render: (row) => formatDate(row.scheduled_start_at) }, { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> }, { key: "session_type", label: "Type", render: (row) => <StatusBadge value={row.session_type} /> }], []);
  return <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText="No mentoring sessions" onRowClick={(row) => navigate(`/student/mentoring/sessions/${row.id}`)} />;
}
