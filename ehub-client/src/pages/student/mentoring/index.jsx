import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GroupApi from "@/api/group";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { CalendarClock } from "lucide-react";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function StudentMentoringPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const groupsRes = await GroupApi.getMyGroups(); const groups = groupsRes?.data || []; const [sessions, groupMentors] = await Promise.all([Promise.all(groups.map((group) => MentorWorkflowApi.groupSessions(group.id, { limit: 100 }))), Promise.all(groups.map((group) => MentorWorkflowApi.groupMentors(group.id).then((res) => (res?.data || []).map((row) => ({ ...row, group_name: group.group_name })))))]); setRows(sessions.flatMap((res) => res?.data || [])); setMentors(groupMentors.flat()); } catch (err) { setError(err.message || "Unable to load mentoring sessions"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const columns = useMemo(() => [{ key: "title", label: "Tiêu đề", render: (row) => <span className="font-black text-slate-900">{row.title}</span> }, { key: "group_name", label: "Nhóm" }, { key: "mentor_name", label: "Mentor" }, { key: "scheduled_start_at", label: "Thời gian", render: (row) => formatDate(row.scheduled_start_at) }, { key: "status", label: "Trạng thái", render: (row) => <StatusBadge value={row.status} /> }, { key: "session_type", label: "Loại", render: (row) => <StatusBadge value={row.session_type} /> }], []);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Mentoring" description="Mentor và các buổi mentoring của nhóm bạn" />

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-slate-900">Mentor của nhóm</h3>
        <AdminTable
          columns={[
            { key: "mentor_name", label: "Mentor", render: (row) => <span className="font-black text-slate-900">{row.mentor_name}</span> },
            { key: "organization", label: "Tổ chức", render: (row) => row.organization || "-" },
            { key: "group_name", label: "Nhóm" },
            { key: "assignment_type", label: "Vai trò", render: (row) => <StatusBadge value={row.assignment_type} /> },
            { key: "status", label: "Trạng thái", render: (row) => <StatusBadge value={row.status} /> },
            { key: "completed_sessions", label: "Buổi đã học", render: (row) => `${row.completed_sessions}/${row.total_sessions}` },
          ]}
          rows={mentors}
          loading={loading}
          emptyText="Nhóm bạn chưa được ghép mentor"
        />
      </section>

      {!loading && !error && rows.length === 0 ? (
        <EmptyState
          icon={<CalendarClock size={24} />}
          title="Chưa có buổi mentoring nào"
          description="Mentor hoặc giảng viên sẽ xếp lịch cho nhóm bạn. Bạn sẽ nhận được email khi có lịch."
        />
      ) : (
        <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText="No mentoring sessions" onRowClick={(row) => navigate(`/student/mentoring/sessions/${row.id}`)} />
      )}
    </div>
  );
}
