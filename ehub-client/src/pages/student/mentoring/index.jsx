import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GroupApi from "@/api/group";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Avatar from "@/components/ui/Avatar";
import { CalendarClock } from "lucide-react";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function StudentMentoringPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const groupsRes = await GroupApi.getMyGroups(); const groups = groupsRes?.data || []; const sessions = await Promise.all(groups.map((group) => MentorWorkflowApi.groupSessions(group.id, { limit: 100 }))); setRows(sessions.flatMap((res) => res?.data || [])); } catch (err) { setError(err.message || "Unable to load mentoring sessions"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const columns = useMemo(() => [{ key: "title", label: "Tiêu đề", render: (row) => <span className="font-semibold text-text-primary">{row.title}</span> }, { key: "group_name", label: "Nhóm", render: (row) => (<div className="flex items-center gap-2.5 min-w-0"><Avatar name={row.group_name} /><span className="text-text-secondary truncate">{row.group_name || "—"}</span></div>) }, { key: "mentor_name", label: "Mentor", render: (row) => (<div className="flex items-center gap-2.5 min-w-0"><Avatar name={row.mentor_name} /><span className="text-text-secondary truncate">{row.mentor_name || "—"}</span></div>) }, { key: "scheduled_start_at", label: "Thời gian", render: (row) => formatDate(row.scheduled_start_at) }, { key: "status", label: "Trạng thái", render: (row) => <StatusBadge value={row.status} /> }, { key: "session_type", label: "Loại", render: (row) => <StatusBadge value={row.session_type} /> }], []);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Mentoring" description="Các buổi mentoring của nhóm bạn" />
      {!loading && !error && rows.length === 0 ? (
        <EmptyState
          icon={<CalendarClock size={24} />}
          title="Đặt buổi mentoring đầu tiên"
          description="Chọn khung giờ trống của mentor để đặt buổi mentoring cho nhóm bạn."
        />
      ) : (
        <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText="No mentoring sessions" onRowClick={(row) => navigate(`/student/mentoring/sessions/${row.id}`)} />
      )}
    </div>
  );
}
