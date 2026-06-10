import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import { MetricCard } from "./components";

export default function AssignmentDetailPage() {
  const { t } = useTranslation();
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
      setError(err.message || t("admin.mentorWorkflow.assignmentDetail.loadError"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async () => {
    if (!confirm) return;
    try {
      await MentorWorkflowApi.adminUpdateAssignmentStatus(id, { status: confirm.status, rejection_reason: confirm.status === "cancelled" ? t("admin.mentorWorkflow.common.cancelledByAdmin") : undefined });
      toast.success(t("admin.mentorWorkflow.assignmentDetail.updated"));
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.mentorWorkflow.assignmentDetail.actionFailed"));
    }
  };

  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">{t("common.loading")}...</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  if (!assignment) return null;

  const historyColumns = [
    { key: "action", label: t("admin.mentorWorkflow.assignmentDetail.fields.action"), render: (row) => <StatusBadge value={row.action} /> },
    { key: "actor_name", label: t("admin.mentorWorkflow.assignmentDetail.fields.actor"), render: (row) => row.actor_name || row.actor_email || "-" },
    { key: "note", label: t("admin.mentorWorkflow.assignmentDetail.fields.note"), render: (row) => row.note || "-" },
    { key: "created_at", label: t("admin.mentorWorkflow.assignmentDetail.fields.created"), render: (row) => formatDate(row.created_at) },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => navigate("/admin/mentor-assignments")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={16} /> {t("common.back")}</button>
        <div className="flex gap-2">
          {!["active", "completed", "cancelled", "rejected"].includes(assignment.status) ? <button onClick={() => setConfirm({ status: "active", title: t("admin.mentorWorkflow.assignmentDetail.approveTitle"), color: "green" })} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white"><CheckCircle2 size={16} /> {t("admin.mentorWorkflow.assignmentDetail.approve")}</button> : null}
          {!["completed", "cancelled"].includes(assignment.status) ? <button onClick={() => setConfirm({ status: "cancelled", title: t("admin.mentorWorkflow.assignmentDetail.cancelTitle"), color: "red" })} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-bold text-white"><XCircle size={16} /> {t("admin.mentorWorkflow.assignmentDetail.cancel")}</button> : null}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="text-xl font-black text-slate-900">{assignment.mentor_name}</h2><p className="mt-1 text-sm text-slate-500">{assignment.group_name} · {assignment.topic || t("admin.mentorWorkflow.common.noTopic")}</p></div>
          <div className="flex gap-2"><StatusBadge value={assignment.assignment_type} /><StatusBadge value={assignment.status} /></div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label={t("admin.mentorWorkflow.assignmentDetail.metrics.sessions")} value={assignment.total_sessions} />
        <MetricCard label={t("admin.mentorWorkflow.assignmentDetail.metrics.completed")} value={assignment.completed_sessions} />
        <MetricCard label={t("admin.mentorWorkflow.assignmentDetail.metrics.minutes")} value={assignment.total_minutes} />
        <MetricCard label={t("admin.mentorWorkflow.assignmentDetail.metrics.expected")} value={assignment.expected_sessions || 0} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Info title={t("admin.mentorWorkflow.assignmentDetail.sections.assignment")} rows={[[t("admin.mentorWorkflow.assignmentDetail.fields.mentorType"), <StatusBadge key="type" value={assignment.mentor_type} />], [t("admin.mentorWorkflow.assignmentDetail.fields.class"), assignment.class_code], [t("admin.mentorWorkflow.assignmentDetail.fields.semester"), assignment.semester_name || assignment.semester_code], [t("admin.mentorWorkflow.assignmentDetail.fields.subject"), assignment.subject_code], [t("admin.mentorWorkflow.assignmentDetail.fields.start"), formatDate(assignment.start_date)], [t("admin.mentorWorkflow.assignmentDetail.fields.end"), formatDate(assignment.end_date)], [t("admin.mentorWorkflow.assignmentDetail.fields.assignedBy"), assignment.assigned_by_name || "-"], [t("admin.mentorWorkflow.assignmentDetail.fields.approvedBy"), assignment.approved_by_name || "-"], [t("admin.mentorWorkflow.assignmentDetail.fields.note"), assignment.note || "-"]]} />
        <Info title={t("admin.mentorWorkflow.assignmentDetail.sections.group")} rows={[[t("admin.mentorWorkflow.assignmentDetail.fields.group"), assignment.group_name], [t("admin.mentorWorkflow.assignmentDetail.fields.topic"), assignment.topic || "-"], [t("admin.mentorWorkflow.assignmentDetail.fields.category"), assignment.category || "-"], [t("admin.mentorWorkflow.assignmentDetail.fields.description"), assignment.topic_desc || "-"]]} />
      </div>
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h3 className="mb-4 text-sm font-black text-slate-900">{t("admin.mentorWorkflow.assignmentDetail.sections.history")}</h3><AdminTable columns={historyColumns} rows={assignment.history || []} emptyText={t("admin.mentorWorkflow.assignmentDetail.emptyHistory")} /></section>
      <ConfirmDialog isOpen={!!confirm} title={confirm?.title} subtitle={`${assignment.mentor_name} · ${assignment.group_name}`} variant="confirm" color={confirm?.color} yesLabel={t("common.confirm")} noLabel={t("common.cancel")} onYes={updateStatus} onNo={() => setConfirm(null)} onClose={() => setConfirm(null)} />
    </div>
  );
}

function Info({ title, rows }) {
  return <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h3 className="mb-4 text-sm font-black text-slate-900">{title}</h3><div className="space-y-3">{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[130px_1fr] gap-3 text-sm"><span className="font-bold text-slate-400">{label}</span><span className="font-medium text-slate-800">{value}</span></div>)}</div></section>;
}
