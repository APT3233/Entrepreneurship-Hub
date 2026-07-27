import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { Roles } from "@/constants/roles";
import { selectAuthUser, selectUserRoles } from "@/store/slices/authSlice";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate, formatDateTimeText } from "@/utils/dateTimeDisplay";
import useDocumentTitle from "@/hooks/useDocumentTitle";

export default function SessionDetailPage() {
  const { t, language } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const roles = useSelector(selectUserRoles);
  const currentUserId = useSelector(selectAuthUser)?.id;
  const isStudent = roles.includes(Roles.STUDENT) && !roles.includes(Roles.LECTURER) && !roles.includes(Roles.MENTOR);
  const isMentor = roles.includes(Roles.MENTOR);
  const isLecturerOnly = roles.includes(Roles.LECTURER)
    && !roles.includes(Roles.ADMIN)
    && !roles.includes(Roles.DEPARTMENT_HEAD);
  const formatSessionRange = (start, end) => {
    if (!start || !end) return "—";
    return `${formatDateTimeText(start, language)} - ${formatDateTimeText(end, language)}`;
  };
  const [session, setSession] = useState(null);
  useDocumentTitle(session?.title || null, 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [attendance, setAttendance] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);

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
      if (modal === "note") await MentorWorkflowApi.addNote(id, { visibility: form.visibility || "internal", content: form.content });
      if (modal === "feedback") await MentorWorkflowApi.addFeedback(id, { ...feedbackTarget, rating: form.rating ? Number(form.rating) : null, feedback: form.feedback, strengths: form.strengths, improvements: form.improvements });
      if (modal === "action") await MentorWorkflowApi.addActionItem(id, { title: form.title, description: form.description, due_date: form.due_date || null, assigned_to_user_id: form.assigned_to_user_id ? Number(form.assigned_to_user_id) : null });
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

  // Mentor đánh giá nhóm; sinh viên và giảng viên đánh giá mentor — khớp với chỉ số analytics đọc target_type='mentor'.
  const feedbackTarget = isMentor
    ? { target_type: "group", target_id: Number(session?.group_id) }
    : { target_type: "mentor", target_id: Number(session?.mentor_id) };

  // Chỉ mở form khi buổi đã hoàn thành và người dùng chưa gửi đánh giá cho đúng đối tượng đó.
  const canGiveFeedback = session?.status === "completed"
    && !(session?.feedback || []).some((row) => Number(row.from_user_id) === Number(currentUserId) && row.target_type === feedbackTarget.target_type);

  // Sinh viên chỉ đóng được đầu việc giao cho chính mình; mentor/GV/admin sửa được tất cả.
  const canChangeActionItem = (row) => !isStudent || Number(row.assigned_to_user_id) === Number(currentUserId);

  const changeActionItemStatus = async (item, status) => {
    try {
      await MentorWorkflowApi.updateActionItemStatus(item.id, status);
      toast.success(t("mentorPortal.sessionDetail.saved"));
      await load();
    } catch (err) {
      toast.error(err.message || t("mentorPortal.sessionDetail.saveError"));
    }
  };

  const saveAttendance = async () => {
    const items = (session.attendees || [])
      .filter((row) => attendance[row.id] && attendance[row.id] !== row.attendance_status)
      .map((row) => ({ id: row.id, attendance_status: attendance[row.id] }));
    if (!items.length) return;
    setSavingAttendance(true);
    try {
      await MentorWorkflowApi.updateAttendance(id, items);
      toast.success(t("mentorPortal.sessionDetail.attendanceSaved"));
      setAttendance({});
      await load();
    } catch (err) {
      toast.error(err.message || t("mentorPortal.sessionDetail.saveError"));
    } finally {
      setSavingAttendance(false);
    }
  };

  if (loading) return <div className="rounded-card border border-border bg-surface p-8 text-center text-sm text-text-muted">{t("common.loading") || "Loading..."}</div>;
  if (error) return <div className="rounded-card border border-border bg-surface p-8 text-center text-sm font-medium text-danger-text">{error}</div>;
  if (!session) return null;

  const semesterLocked = isLecturerOnly && session.semester_status === "completed";
  const canEditAttendance = !isStudent && !semesterLocked && (session.attendees || []).length > 0;
  const canAddNote = !semesterLocked;
  const canAddAction = !isStudent && !semesterLocked;
  const canGiveFeedbackNow = canGiveFeedback && !semesterLocked;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:bg-subtle">
        <ArrowLeft size={16} /> {t("mentorPortal.sessionDetail.back")}
      </button>
      {semesterLocked ? (
        <div className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("admin.errors.semesterCompleted")}
        </div>
      ) : null}
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
            [t("mentorPortal.sessionDetail.scheduled"), formatSessionRange(session.scheduled_start_at, session.scheduled_end_at)],
            [t("mentorPortal.sessionDetail.actual"), session.actual_start_at ? formatSessionRange(session.actual_start_at, session.actual_end_at) : "-"],
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
      <section className="rounded-card border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-primary">{t("mentorPortal.sessionDetail.attendance")}</h3>
          {!canEditAttendance ? null : (
            <button onClick={saveAttendance} disabled={savingAttendance} className="rounded-control border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-subtle disabled:opacity-50">
              {t("mentorPortal.sessionDetail.saveAttendance")}
            </button>
          )}
        </div>
        <AdminTable
          columns={[
            { key: "attendee_name", label: t("mentorPortal.sessionDetail.attendee"), render: (row) => <span className="font-medium text-text-primary">{row.attendee_name || "-"}</span> },
            { key: "student_code", label: t("mentorPortal.groups.studentCode"), render: (row) => row.student_code || "-" },
            { key: "attendee_type", label: t("mentorPortal.sessionDetail.attendeeType"), render: (row) => <StatusBadge value={row.attendee_type} /> },
            {
              key: "attendance_status",
              label: t("mentorPortal.sessionDetail.attendanceStatus"),
              render: (row) => ((isStudent || semesterLocked) ? <StatusBadge value={row.attendance_status} /> : (
                <select
                  className={inputClass}
                  value={attendance[row.id] ?? row.attendance_status}
                  onChange={(e) => setAttendance((prev) => ({ ...prev, [row.id]: e.target.value }))}
                >
                  {["invited", "attended", "absent", "late"].map((value) => <option key={value} value={value}>{t(`status.${value}`)}</option>)}
                </select>
              )),
            },
          ]}
          rows={session.attendees || []}
          emptyText={t("mentorPortal.sessionDetail.noAttendees")}
        />
      </section>
      <Panel
        title={t("mentorPortal.sessionDetail.notes")}
        onAdd={canAddNote ? () => { setModal("note"); setForm({ visibility: isStudent ? "shared_with_group" : "internal" }); } : null}
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
        onAdd={canGiveFeedbackNow ? () => { setModal("feedback"); setForm({}); } : null}
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
        onAdd={canAddAction ? () => { setModal("action"); setForm({}); } : null}
        addLabel={t("mentorPortal.sessionDetail.addBtn")}
      >
        <AdminTable
          columns={[
            { key: "title", label: t("mentorPortal.sessionDetail.actionTitle"), render: (row) => <span className="font-medium text-text-primary">{row.title}</span> },
            { key: "assigned_to_name", label: t("mentorPortal.groups.assignee"), render: (row) => row.assigned_to_name || "-" },
            { key: "due_date", label: t("mentorPortal.sessionDetail.actionDue"), render: (row) => formatDate(row.due_date) },
            {
              key: "status",
              label: t("mentorPortal.sessionDetail.actionStatus"),
              render: (row) => (canChangeActionItem(row) && !semesterLocked ? (
                <select className={inputClass} value={row.status} onChange={(e) => changeActionItemStatus(row, e.target.value)}>
                  {(isStudent ? ["open", "in_progress", "done"] : ["open", "in_progress", "done", "cancelled"]).map((value) => (
                    <option key={value} value={value}>{t(`status.${value}`)}</option>
                  ))}
                </select>
              ) : <StatusBadge value={row.status} />),
            },
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
          <div className="space-y-4">
            <Field label={t("mentorPortal.sessionDetail.contentLabel")}>
              <textarea className={inputClass} rows={4} value={form.content || ""} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
            </Field>
            {!isStudent ? (
              <Field label={t("mentorPortal.sessionDetail.visibilityLabel")}>
                <select className={inputClass} value={form.visibility || "internal"} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                  <option value="internal">{t("mentorPortal.sessionDetail.visibilityInternal")}</option>
                  <option value="shared_with_group">{t("mentorPortal.sessionDetail.visibilityGroup")}</option>
                  <option value="private_to_author">{t("mentorPortal.sessionDetail.visibilityPrivate")}</option>
                </select>
              </Field>
            ) : null}
          </div>
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
            <Field label={t("mentorPortal.groups.assignee")}>
              <select className={inputClass} value={form.assigned_to_user_id || ""} onChange={(e) => setForm({ ...form, assigned_to_user_id: e.target.value })}>
                <option value="">{t("mentorPortal.sessionDetail.wholeGroup")}</option>
                {(session.attendees || []).filter((row) => row.attendee_type === "student" && row.user_id).map((row) => (
                  <option key={row.id} value={row.user_id}>{row.attendee_name}{row.student_code ? ` (${row.student_code})` : ""}</option>
                ))}
              </select>
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
        {onAdd ? (
          <button onClick={onAdd} className="inline-flex items-center gap-2 rounded-control border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-subtle">
            <Plus size={16} /> {addLabel}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}
