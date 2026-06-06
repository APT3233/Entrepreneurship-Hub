import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useToast } from "@/components/ui/Toast";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import { MetricCard } from "./components";

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await MentorWorkflowApi.adminGetAssignment(id);
      setAssignment(res?.data || null);
    } catch (err) {
      setError(err.message || "Unable to load assignment");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async () => {
    if (!confirm) return;
    try {
      await MentorWorkflowApi.adminUpdateAssignmentStatus(id, { status: confirm.status, rejection_reason: confirm.status === "cancelled" ? "Cancelled by admin" : undefined });
      toast.success("Assignment updated");
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err.message || "Action failed");
    }
  };

  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">Loading...</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  if (!assignment) return null;

  const historyColumns = [
    { key: "action", label: "Action", render: (row) => <StatusBadge value={row.action} /> },
    { key: "actor_name", label: "Actor", render: (row) => row.actor_name || row.actor_email || "-" },
    { key: "note", label: "Note", render: (row) => row.note || "-" },
    { key: "created_at", label: "Created", render: (row) => formatDate(row.created_at) },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => navigate("/admin/mentor-assignments")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={16} /> Back</button>
        <div className="flex gap-2">
          {!['active', 'completed', 'cancelled', 'rejected'].includes(assignment.status) ? <button onClick={() => setConfirm({ status: "active", title: "Approve assignment", color: "green" })} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white"><CheckCircle2 size={16} /> Approve</button> : null}
          {!['completed', 'cancelled'].includes(assignment.status) ? <button onClick={() => setConfirm({ status: "cancelled", title: "Cancel assignment", color: "red" })} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-bold text-white"><XCircle size={16} /> Cancel</button> : null}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="text-xl font-black text-slate-900">{assignment.mentor_name}</h2><p className="mt-1 text-sm text-slate-500">{assignment.group_name} · {assignment.topic || "No topic"}</p></div>
          <div className="flex gap-2"><StatusBadge value={assignment.assignment_type} /><StatusBadge value={assignment.status} /></div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4"><MetricCard label="Sessions" value={assignment.total_sessions} /><MetricCard label="Completed" value={assignment.completed_sessions} /><MetricCard label="Minutes" value={assignment.total_minutes} /><MetricCard label="Expected" value={assignment.expected_sessions || 0} /></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Info title="Assignment" rows={[['Mentor type', assignment.mentor_type], ['Class', assignment.class_code], ['Semester', assignment.semester_name || assignment.semester_code], ['Subject', assignment.subject_code], ['Start', formatDate(assignment.start_date)], ['End', formatDate(assignment.end_date)], ['Assigned by', assignment.assigned_by_name || '-'], ['Approved by', assignment.approved_by_name || '-'], ['Note', assignment.note || '-']]} />
        <Info title="Group" rows={[['Group', assignment.group_name], ['Topic', assignment.topic || '-'], ['Category', assignment.category || '-'], ['Description', assignment.topic_desc || '-']]} />
      </div>
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h3 className="mb-4 text-sm font-black text-slate-900">History</h3><AdminTable columns={historyColumns} rows={assignment.history || []} emptyText="No history" /></section>
      <ConfirmDialog isOpen={!!confirm} title={confirm?.title} subtitle={`${assignment.mentor_name} · ${assignment.group_name}`} variant="confirm" color={confirm?.color} yesLabel="Confirm" noLabel="Cancel" onYes={updateStatus} onNo={() => setConfirm(null)} onClose={() => setConfirm(null)} />
    </div>
  );
}

function Info({ title, rows }) {
  return <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h3 className="mb-4 text-sm font-black text-slate-900">{title}</h3><div className="space-y-3">{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[130px_1fr] gap-3 text-sm"><span className="font-bold text-slate-400">{label}</span><span className="font-medium text-slate-800">{value}</span></div>)}</div></section>;
}
