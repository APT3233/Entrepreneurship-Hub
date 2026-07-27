import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { Panel } from "@/pages/admin/mentor-analytics/components";
import { formatDate } from "@/utils/dateTimeDisplay";
import useDocumentTitle from "@/hooks/useDocumentTitle";

const PENDING = ["proposed", "pending_mentor"];

export default function MentorAssignmentDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [assignment, setAssignment] = useState(null);
  useDocumentTitle(assignment?.group_name || null, 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [respond, setRespond] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await MentorWorkflowApi.mentorGetAssignment(id);
      setAssignment(res?.data || null);
    } catch (err) {
      setError(err.message || t("mentorPortal.assignments.loadError"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await MentorWorkflowApi.mentorRespondAssignment(id, {
        response: respond,
        ...(respond === "decline" ? { rejection_reason: note } : { note }),
      });
      toast.success(t("mentorPortal.assignments.saved"));
      setRespond(null);
      setNote("");
      await load();
    } catch (err) {
      toast.error(err.message || t("mentorPortal.assignments.respondError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rounded-card border border-border bg-surface p-8 text-center text-sm text-text-muted">{t("common.loading") || "Loading..."}</div>;
  if (error) return <div className="rounded-card border border-border bg-surface p-8 text-center text-sm font-medium text-danger-text">{error}</div>;
  if (!assignment) return null;

  const canRespond = PENDING.includes(assignment.status);

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:bg-subtle">
        <ArrowLeft size={16} /> {t("mentorPortal.sessionDetail.back")}
      </button>

      <section className="rounded-card border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <button onClick={() => navigate(`/mentor/groups/${assignment.group_id}`)} className="text-h1 font-medium text-text-primary hover:text-accent">
              {assignment.group_name}
            </button>
            <p className="mt-1 text-sm text-text-secondary">
              {assignment.class_code} · {assignment.subject_code} · {assignment.semester_name}
            </p>
            {assignment.topic ? <p className="mt-3 text-sm font-medium text-text-primary">{assignment.topic}</p> : null}
            {assignment.topic_desc ? <p className="mt-1 text-sm text-text-secondary">{assignment.topic_desc}</p> : null}
          </div>
          <div className="flex gap-2">
            <StatusBadge value={assignment.assignment_type} />
            <StatusBadge value={assignment.status} />
          </div>
        </div>
        {canRespond ? (
          <div className="mt-5 flex gap-2 border-t border-border pt-4">
            <button onClick={() => { setRespond("accept"); setNote(""); }} className="inline-flex items-center gap-2 rounded-control bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
              <CheckCircle2 size={16} /> {t("mentorPortal.assignments.acceptTitle")}
            </button>
            <button onClick={() => { setRespond("decline"); setNote(""); }} className="inline-flex items-center gap-2 rounded-control border border-border px-4 py-2 text-sm font-medium text-danger-text hover:bg-danger-bg">
              <XCircle size={16} /> {t("mentorPortal.assignments.declineTitle")}
            </button>
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t("mentorPortal.assignmentDetail.terms")}>
          <div className="space-y-3 text-sm">
            {[
              [t("mentorPortal.assignments.start"), formatDate(assignment.start_date)],
              [t("mentorPortal.assignmentDetail.endDate"), formatDate(assignment.end_date)],
              [t("mentorPortal.assignments.expected"), assignment.expected_sessions ?? "-"],
              [t("mentorPortal.assignmentDetail.assignedBy"), assignment.assigned_by_name || "-"],
              [t("mentorPortal.assignmentDetail.note"), assignment.note || "-"],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[140px_1fr] gap-3">
                <span className="font-medium text-text-muted">{label}</span>
                <span className="font-medium text-text-primary">{value}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={t("mentorPortal.assignmentDetail.otherMentors")}>
          <AdminTable
            columns={[
              { key: "mentor_name", label: t("mentorPortal.assignmentDetail.mentor") },
              { key: "assignment_type", label: t("mentorPortal.assignments.type"), render: (row) => <StatusBadge value={row.assignment_type} /> },
              { key: "status", label: t("mentorPortal.assignments.status"), render: (row) => <StatusBadge value={row.status} /> },
            ]}
            rows={(assignment.existing_mentors || []).filter((row) => Number(row.id) !== Number(assignment.id))}
            emptyText={t("mentorPortal.assignmentDetail.noOtherMentors")}
          />
        </Panel>
      </div>

      <Panel title={t("mentorPortal.assignmentDetail.requests")}>
        <AdminTable
          columns={[
            { key: "support_needed", label: t("mentorPortal.assignmentDetail.supportNeeded"), render: (row) => <span className="font-medium text-text-primary">{row.support_needed}</span> },
            { key: "problem_statement", label: t("mentorPortal.assignmentDetail.problem"), render: (row) => row.problem_statement || "-" },
            { key: "requested_role", label: t("mentorPortal.assignmentDetail.requestedRole"), render: (row) => <StatusBadge value={row.requested_role} /> },
            { key: "priority", label: t("mentorPortal.assignmentDetail.priority"), render: (row) => <StatusBadge value={row.priority} /> },
          ]}
          rows={assignment.open_requests || []}
          emptyText={t("mentorPortal.assignmentDetail.noRequests")}
        />
      </Panel>

      <Panel title={t("mentorPortal.assignmentDetail.history")}>
        <AdminTable
          columns={[
            { key: "action", label: t("mentorPortal.assignmentDetail.action"), render: (row) => <StatusBadge value={row.action} /> },
            { key: "note", label: t("mentorPortal.assignmentDetail.note"), render: (row) => row.note || "-" },
            { key: "created_at", label: t("mentorPortal.sessionDetail.noteCreated"), render: (row) => formatDate(row.created_at) },
          ]}
          rows={assignment.history || []}
          emptyText={t("mentorPortal.assignmentDetail.noHistory")}
        />
      </Panel>

      <FormModal
        open={!!respond}
        title={respond === "accept" ? t("mentorPortal.assignments.acceptTitle") : t("mentorPortal.assignments.declineTitle")}
        submitLabel={t("mentorPortal.assignments.confirm")}
        saving={saving}
        onClose={() => setRespond(null)}
        onSubmit={submit}
      >
        <Field label={respond === "decline" ? t("mentorPortal.assignmentDetail.declineReason") : t("mentorPortal.assignmentDetail.note")}>
          <textarea className={inputClass} rows={3} value={note} onChange={(e) => setNote(e.target.value)} required={respond === "decline"} />
        </Field>
      </FormModal>
    </div>
  );
}
