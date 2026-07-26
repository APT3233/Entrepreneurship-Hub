import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import Avatar from "@/components/ui/Avatar";
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
    { key: "title", label: t("admin.ecosystem.columns.title"), render: (row) => <span className="font-semibold text-text-primary">{row.title}</span> },
    { key: "group_name", label: t("lecturer.mentoringPage.columns.group"), render: (row) => (
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar name={row.group_name} />
        <span className="text-text-secondary truncate">{row.group_name || "—"}</span>
      </div>
    ) },
    { key: "mentor_name", label: t("lecturer.mentoringPage.columns.mentor"), render: (row) => (
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar name={row.mentor_name} />
        <span className="text-text-secondary truncate">{row.mentor_name || "—"}</span>
      </div>
    ) },
    { key: "scheduled_start_at", label: t("lecturer.mentoringPage.columns.scheduled"), render: (row) => formatDate(row.scheduled_start_at) },
    { key: "status", label: t("lecturer.mentoringPage.columns.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "feedback_count", label: t("mentorPortal.sessionDetail.feedback"), render: (row) => row.feedback_count || 0 },
  ], [t]);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">{t("lecturer.mentoring")}</h1>
        <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
          Theo dõi các buổi mentoring của lớp, mentor phụ trách và phản hồi.
        </p>
      </div>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("lecturer.mentoringPage.emptySessions")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} onRowClick={(row) => navigate(`/lecturer/mentoring/sessions/${row.id}`)} />
    </div>
  );
}
