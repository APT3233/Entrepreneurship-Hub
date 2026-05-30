import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import {
  assignmentSubmissionService,
  checkpointSubmissionService,
} from "@/api/adminProjectSubmission";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import { useTranslation } from "@/context/TranslationContext";
import { formatDate } from "@/pages/admin/project-submission/shared";

export default function GroupSubmissionsTab({ groupId, classId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!groupId) return;
    let mounted = true;
    setLoading(true);
    Promise.all([
      checkpointSubmissionService.list({ group_id: groupId, class_id: classId || undefined, limit: 100 }),
      assignmentSubmissionService.list({ group_id: groupId, class_id: classId || undefined, limit: 100 }),
    ])
      .then(([checkpointRes, assignmentRes]) => {
        if (!mounted) return;
        const checkpointRows = (checkpointRes?.data || []).map((row) => ({
          ...row,
          source: "checkpoint",
          title: row.checkpoint_title,
          detailPath: row.checkpoint_id ? `/admin/checkpoints/${row.checkpoint_id}` : null,
        }));
        const assignmentRows = (assignmentRes?.data || []).map((row) => ({
          ...row,
          source: "assignment",
          title: row.assignment_title,
          detailPath: row.assignment_id ? `/admin/assignments/${row.assignment_id}` : null,
        }));
        setRows([...checkpointRows, ...assignmentRows].sort((a, b) => {
          const ta = new Date(a.submitted_at || 0).getTime();
          const tb = new Date(b.submitted_at || 0).getTime();
          return tb - ta;
        }));
      })
      .catch((err) => {
        if (mounted) setError(err.message || t("admin.toasts.actionFailed"));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [groupId, classId, t]);

  const columns = useMemo(() => [
    { key: "source", label: t("filterLabels.type"), render: (row) => <StatusBadge value={row.source} /> },
    { key: "title", label: t("admin.fields.topicDesc", { defaultValue: "Title" }), render: (row) => <span className="font-semibold text-gray-900">{row.title}</span> },
    { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.display_status || row.status} /> },
    { key: "submitted_at", label: t("admin.fields.submittedAt"), render: (row) => formatDate(row.submitted_at) },
    { key: "is_late", label: t("filterLabels.late"), render: (row) => Number(row.is_late || 0) ? <StatusBadge value="late" /> : "—" },
    { key: "score", label: t("admin.fields.score"), render: (row) => row.score ?? "—" },
    { key: "graded_at", label: t("admin.fields.gradedAt"), render: (row) => formatDate(row.graded_at) },
    {
      key: "actions",
      label: "",
      render: (row) => row.detailPath ? (
        <div className="flex justify-end">
          <ActionButton onClick={() => navigate(row.detailPath)} title={t("admin.actions.detail")}><Eye size={16} /></ActionButton>
        </div>
      ) : null,
    },
  ], [t, navigate]);

  return (
    <AdminTable
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      meta={{ page: 1, totalPages: 1, total: rows.length }}
      emptyText={t("admin.empty.groupSubmissions")}
    />
  );
}
