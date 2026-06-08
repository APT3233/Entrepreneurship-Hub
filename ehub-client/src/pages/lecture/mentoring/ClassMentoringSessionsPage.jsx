import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function ClassMentoringSessionsPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = classId
        ? await MentorWorkflowApi.lecturerClassSessions(classId, query)
        : await MentorWorkflowApi.lecturerSessions(query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("lecturer.mentoringPage.sessionsLoadError"));
    } finally {
      setLoading(false);
    }
  }, [classId, query, t]);
  useEffect(() => { load(); }, [load]);
  const columns = useMemo(() => [
    { key: "title", label: t("admin.ecosystem.columns.title"), render: (row) => <span className="font-black text-slate-900">{row.title}</span> },
    { key: "group_name", label: t("lecturer.mentoringPage.columns.group") },
    { key: "mentor_name", label: t("lecturer.mentoringPage.columns.mentor") },
    { key: "scheduled_start_at", label: t("lecturer.mentoringPage.columns.scheduled"), render: (row) => formatDate(row.scheduled_start_at) },
    { key: "status", label: t("lecturer.mentoringPage.columns.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "feedback_count", label: t("mentorPortal.sessionDetail.feedback"), render: (row) => row.feedback_count || 0 },
  ], [t]);
  return <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("lecturer.mentoringPage.emptySessions")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} onRowClick={(row) => navigate(`/lecturer/mentoring/sessions/${row.id}`)} />;
}
