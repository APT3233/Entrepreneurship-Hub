import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import useDocumentTitle from "@/hooks/useDocumentTitle";

export default function SessionDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [session, setSession] = useState(null);
  useDocumentTitle(session?.title || null, 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await MentorWorkflowApi.getSession(id);
      setSession(res?.data || null);
    } catch (err) {
      setError(err.message || t("mentorPortal.sessionDetail.loadError"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === "note") await MentorWorkflowApi.addNote(id, { note_type: form.note_type || "mentor_note", visibility: form.visibility || "internal", content: form.content });
      if (modal === "feedback") await MentorWorkflowApi.addFeedback(id, { target_type: form.target_type || "session", target_id: form.target_id || id, rating: form.rating ? Number(form.rating) : null, feedback: form.feedback, strengths: form.strengths, improvements: form.improvements });
      if (modal === "action") await MentorWorkflowApi.addActionItem(id, { title: form.title, description: form.description, due_date: form.due_date || null });
      toast.success(t("mentorPortal.sessionDetail.saved"));
      setModal(null);
      setForm({});
      await load();
    } catch (err) {
      toast.error(err.message || t("mentorPortal.sessionDetail.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rounded-card border border-border bg-surface p-8 text-center text-sm text-text-muted">{t("common.loading") || "Loading..."}</div>;
  if (error) return <div className="rounded-card border border-border bg-surface p-8 text-center text-sm font-medium text-danger-text">{error}</div>;
  if (!session) return null;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:bg-subtle">
        <ArrowLeft size={16} /> {t("mentorPortal.sessionDetail.back")}
      </button>
      <section className="rounded-card border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-h1 font-medium text-text-primary">{session.title}</h2>
            <p className="mt-1 text-sm text-text-secondary">{session.group_name} · {session.topic || t("mentorPortal.sessionDetail.noTopic")}</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge value={session.status} />
            <StatusBadge value={session.session_type} />
          </div>
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Info
          title={t("mentorPortal.sessionDetail.schedule")}
          rows={[
            [t("mentorPortal.sessionDetail.scheduled"), `${formatDate(session.scheduled_start_at)} - ${formatDate(session.scheduled_end_at)}`],
            [t("mentorPortal.sessionDetail.actual"), session.actual_start_at ? `${formatDate(session.actual_start_at)} - ${formatDate(session.actual_end_at)}` : "-"],
            [t("mentorPortal.sessionDetail.duration"), session.duration_minutes ? `${session.duration_minutes} ${t("mentorPortal.sessions.duration").toLowerCase()}` : "-"],
            [t("mentorPortal.sessionDetail.meeting"), session.meeting_link || session.location || "-"]
          ]}
        />
        <Info
          title={t("mentorPortal.sessionDetail.assignment")}
          rows={[
            [t("mentorPortal.sessionDetail.mentor"), session.mentor_name],
            [t("mentorPortal.sessionDetail.group"), session.group_name],
            [t("mentorPortal.sessionDetail.class"), session.class_code],
            [t("mentorPortal.sessionDetail.type"), session.assignment_type]
          ]}
        />
      </div>
      <Panel
        title={t("mentorPortal.sessionDetail.notes")}
        onAdd={() => { setModal("note"); setForm({ note_type: "mentor_note", visibility: "internal" }); }}
        addLabel={t("mentorPortal.sessionDetail.addBtn")}
      >
        <AdminTable
          columns={[
            { key: "note_type", label: t("mentorPortal.sessionDetail.noteType"), render: (row) => <StatusBadge value={row.note_type} /> },
            { key: "content", label: t("mentorPortal.sessionDetail.noteContent") },
            { key: "author_name", label: t("mentorPortal.sessionDetail.noteAuthor"), render: (row) => row.author_name || "-" },
            { key: "created_at", label: t("mentorPortal.sessionDetail.noteCreated"), render: (row) => formatDate(row.created_at) }
          ]}
          rows={session.notes || []}
          emptyText={t("mentorPortal.sessionDetail.noNotes")}
        />
      </Panel>
      <Panel
        title={t("mentorPortal.sessionDetail.feedback")}
        onAdd={() => { setModal("feedback"); setForm({ target_type: "session", target_id: id }); }}
        addLabel={t("mentorPortal.sessionDetail.addBtn")}
      >
        <AdminTable
          columns={[
            { key: "from_role", label: t("mentorPortal.sessionDetail.feedFrom"), render: (row) => <StatusBadge value={row.from_role} /> },
            { key: "rating", label: t("mentorPortal.sessionDetail.feedRating"), render: (row) => row.rating || "-" },
            { key: "feedback", label: t("mentorPortal.sessionDetail.feedContent"), render: (row) => row.feedback || "-" },
            { key: "created_at", label: t("mentorPortal.sessionDetail.feedCreated"), render: (row) => formatDate(row.created_at) }
          ]}
          rows={session.feedback || []}
          emptyText={t("mentorPortal.sessionDetail.noFeedback")}
        />
      </Panel>
      <Panel
        title={t("mentorPortal.sessionDetail.actionItems")}
        onAdd={() => { setModal("action"); setForm({}); }}
        addLabel={t("mentorPortal.sessionDetail.addBtn")}
      >
        <AdminTable
          columns={[
            { key: "title", label: t("mentorPortal.sessionDetail.actionTitle"), render: (row) => <span className="font-medium text-text-primary">{row.title}</span> },
            { key: "due_date", label: t("mentorPortal.sessionDetail.actionDue"), render: (row) => formatDate(row.due_date) },
            { key: "status", label: t("mentorPortal.sessionDetail.actionStatus"), render: (row) => <StatusBadge value={row.status} /> }
          ]}
          rows={session.action_items || []}
          emptyText={t("mentorPortal.sessionDetail.noActionItems")}
        />
      </Panel>
      <FormModal
        open={!!modal}
        title={modal === "note" ? t("mentorPortal.sessionDetail.addNoteTitle") : modal === "feedback" ? t("mentorPortal.sessionDetail.addFeedbackTitle") : t("mentorPortal.sessionDetail.addActionTitle")}
        submitLabel={t("mentorPortal.sessionDetail.saveBtn")}
        saving={saving}
        onClose={() => setModal(null)}
        onSubmit={submit}
      >
        {modal === "note" ? (
          <>
            <Field label={t("mentorPortal.sessionDetail.contentLabel")}>
              <textarea className={inputClass} rows={4} value={form.content || ""} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
            </Field>
          </>
        ) : null}
        {modal === "feedback" ? (
          <div className="space-y-4">
            <Field label={t("mentorPortal.sessionDetail.ratingLabel")}>
              <input type="number" min="1" max="5" className={inputClass} value={form.rating || ""} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
            </Field>
            <Field label={t("mentorPortal.sessionDetail.feedbackLabel")}>
              <textarea className={inputClass} rows={3} value={form.feedback || ""} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
            </Field>
            <Field label={t("mentorPortal.sessionDetail.strengthsLabel")}>
              <textarea className={inputClass} rows={2} value={form.strengths || ""} onChange={(e) => setForm({ ...form, strengths: e.target.value })} />
            </Field>
            <Field label={t("mentorPortal.sessionDetail.improvementsLabel")}>
              <textarea className={inputClass} rows={2} value={form.improvements || ""} onChange={(e) => setForm({ ...form, improvements: e.target.value })} />
            </Field>
          </div>
        ) : null}
        {modal === "action" ? (
          <div className="space-y-4">
            <Field label={t("mentorPortal.sessionDetail.titleLabel")}>
              <input className={inputClass} value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </Field>
            <Field label={t("mentorPortal.sessionDetail.dueDateLabel")}>
              <input type="date" className={inputClass} value={form.due_date || ""} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </Field>
            <Field label={t("mentorPortal.sessionDetail.descLabel")}>
              <textarea className={inputClass} rows={3} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
        ) : null}
      </FormModal>
    </div>
  );
}

function Info({ title, rows }) {
  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <h3 className="mb-4 text-sm font-medium text-text-primary">{title}</h3>
      <div className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[110px_1fr] gap-3 text-sm">
            <span className="font-medium text-text-muted">{label}</span>
            <span className="font-medium text-text-primary">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Panel({ title, children, onAdd, addLabel }) {
  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">{title}</h3>
        <button onClick={onAdd} className="inline-flex items-center gap-2 rounded-control border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-subtle">
          <Plus size={16} /> {addLabel}
        </button>
      </div>
      {children}
    </section>
  );
}
