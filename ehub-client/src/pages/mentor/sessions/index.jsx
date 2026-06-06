import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Plus, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import FormModal from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { SessionForm } from "@/pages/admin/mentor-workflow/components";
import { formatDate } from "@/utils/dateTimeDisplay";

const emptyForm = { assignment_id: "", title: "", session_type: "online", meeting_link: "", location: "", scheduled_start_at: "", scheduled_end_at: "", description: "" };

export default function MentorSessionsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [sessionsRes, assignmentsRes] = await Promise.all([
        MentorWorkflowApi.mentorSessions(query),
        MentorWorkflowApi.mentorAssignments({ limit: 100, status: "active" })
      ]);
      setRows(sessionsRes?.data || []);
      setMeta(sessionsRes?.meta || null);
      setAssignments(assignmentsRes?.data || []);
    } catch (err) {
      setError(err.message || t("mentorPortal.sessions.loadError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  const createSession = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await MentorWorkflowApi.mentorCreateSession(form);
      toast.success(t("mentorPortal.sessions.created"));
      setModalOpen(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      toast.error(err.message || t("mentorPortal.sessions.createError"));
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async () => {
    if (!confirm) return;
    try {
      await MentorWorkflowApi.mentorUpdateSessionStatus(confirm.row.id, { status: confirm.status, cancellation_reason: confirm.status === "cancelled" ? "Cancelled by mentor" : undefined });
      toast.success(t("mentorPortal.sessions.updated"));
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("mentorPortal.sessions.updateError"));
    }
  };

  const columns = useMemo(() => [
    { key: "title", label: t("mentorPortal.sessions.title"), render: (row) => <button onClick={() => navigate(`/mentor/sessions/${row.id}`)} className="text-left font-black text-slate-900 hover:text-teal-700">{row.title}</button> },
    { key: "group_name", label: t("mentorPortal.sessions.group") },
    { key: "topic", label: t("mentorPortal.sessions.topic"), render: (row) => row.topic || "-" },
    { key: "scheduled_start_at", label: t("mentorPortal.sessions.scheduled"), render: (row) => formatDate(row.scheduled_start_at) },
    { key: "duration_minutes", label: t("mentorPortal.sessions.duration"), render: (row) => row.duration_minutes ? `${row.duration_minutes}m` : "-" },
    { key: "status", label: t("mentorPortal.sessions.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "session_type", label: t("mentorPortal.sessions.type"), render: (row) => <StatusBadge value={row.session_type} /> },
    { key: "actions", label: "", width: 120, render: (row) => row.status === "scheduled" ? <div className="flex justify-end gap-1"><button onClick={() => setConfirm({ row, status: "completed", title: t("mentorPortal.sessions.markCompleted"), color: "green" })} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"><CheckCircle2 size={16} /></button><button onClick={() => setConfirm({ row, status: "cancelled", title: t("mentorPortal.sessions.cancelSession"), color: "red" })} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><XCircle size={16} /></button></div> : null },
  ], [navigate, t]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700"><Plus size={16} /> {t("mentorPortal.sessions.createBtn")}</button>
      </div>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("mentorPortal.sessions.noSessions")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} onRowClick={(row) => navigate(`/mentor/sessions/${row.id}`)} />
      <FormModal open={modalOpen} title={t("mentorPortal.sessions.createTitle")} submitLabel={t("mentorPortal.sessions.createSubmit")} saving={saving} onClose={() => setModalOpen(false)} onSubmit={createSession}>
        <SessionForm form={form} setForm={setForm} assignments={assignments} />
      </FormModal>
      <ConfirmDialog isOpen={!!confirm} title={confirm?.title} subtitle={confirm?.row?.title || ""} variant="confirm" color={confirm?.color} yesLabel={t("mentorPortal.sessions.confirm")} noLabel={t("common.cancel") || "Cancel"} onYes={updateStatus} onNo={() => setConfirm(null)} onClose={() => setConfirm(null)} />
    </div>
  );
}
