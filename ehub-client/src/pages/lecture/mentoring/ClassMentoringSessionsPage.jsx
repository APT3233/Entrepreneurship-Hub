import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ClassApi from "@/api/class";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FormModal from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { SessionForm } from "@/pages/admin/mentor-workflow/components";
import { formatDate } from "@/utils/dateTimeDisplay";

const emptyForm = { assignment_id: "", title: "", session_type: "online", meeting_link: "", location: "", scheduled_start_at: "", scheduled_end_at: "", description: "" };

export default function ClassMentoringSessionsPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [semesterStatus, setSemesterStatus] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = classId
        ? await MentorWorkflowApi.lecturerClassSessions(classId, query)
        : await MentorWorkflowApi.lecturerSessions(query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
      if (classId) {
        const [assignmentsRes, classRes] = await Promise.all([
          MentorWorkflowApi.lecturerClassAssignments(classId, { limit: 100, status: "active" }),
          ClassApi.getOverview(classId),
        ]);
        setAssignments(assignmentsRes?.data || []);
        setSemesterStatus(classRes?.data?.semester_status ?? res?.data?.[0]?.semester_status ?? null);
      }
    } catch (err) {
      setError(err.message || t("lecturer.mentoringPage.sessionsLoadError"));
    } finally {
      setLoading(false);
    }
  }, [classId, query, t]);

  useEffect(() => { load(); }, [load]);

  const createSession = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await MentorWorkflowApi.lecturerCreateSession(form);
      toast.success(t("lecturer.mentoringPage.sessionCreated"));
      (res?.data?.warnings || []).forEach((warning) => toast.warning(warning));
      setModalOpen(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      toast.error(err.message || t("lecturer.mentoringPage.sessionCreateError"));
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => [
    { key: "title", label: t("admin.ecosystem.columns.title"), render: (row) => <span className="font-black text-slate-900">{row.title}</span> },
    { key: "group_name", label: t("lecturer.mentoringPage.columns.group") },
    { key: "mentor_name", label: t("lecturer.mentoringPage.columns.mentor") },
    { key: "scheduled_start_at", label: t("lecturer.mentoringPage.columns.scheduled"), render: (row) => formatDate(row.scheduled_start_at) },
    { key: "status", label: t("lecturer.mentoringPage.columns.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "feedback_count", label: t("mentorPortal.sessionDetail.feedback"), render: (row) => row.feedback_count || 0 },
  ], [t]);

  const semesterLocked = semesterStatus === "completed";

  return (
    <div className="space-y-4">
      {classId ? (
        <div className="flex justify-end">
          {semesterLocked ? (
            <p className="text-sm text-amber-700">{t("admin.errors.semesterCompleted")}</p>
          ) : (
            <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-control bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
              <Plus size={16} /> {t("lecturer.mentoringPage.createSession")}
            </button>
          )}
        </div>
      ) : null}
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("lecturer.mentoringPage.emptySessions")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} onRowClick={(row) => navigate(`/lecturer/mentoring/sessions/${row.id}`)} />
      <FormModal open={modalOpen} title={t("lecturer.mentoringPage.createSession")} submitLabel={t("mentorPortal.sessions.createSubmit")} saving={saving} onClose={() => setModalOpen(false)} onSubmit={createSession}>
        <SessionForm form={form} setForm={setForm} assignments={assignments} />
      </FormModal>
    </div>
  );
}
