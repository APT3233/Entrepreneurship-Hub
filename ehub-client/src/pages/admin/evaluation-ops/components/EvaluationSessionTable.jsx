import { useMemo } from "react";
import { Eye, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import { useTranslation } from "@/context/TranslationContext";
import { useAdminColumns } from "@/utils/adminLabels";
import { formatDate, formatScore } from "@/pages/admin/evaluation-ops/shared";

export default function EvaluationSessionTable({ rows, loading, error, meta, onPageChange, onOpen }) {
  const { t } = useTranslation();
  const c = useAdminColumns();

  const columns = useMemo(() => [
    { key: "session_id", label: c.session, width: 90, render: (row) => <span className="font-mono text-xs font-bold text-gray-700">#{row.session_id}</span> },
    { key: "target_type", label: c.target, width: 210, render: (row) => (
      <div className="min-w-0">
        <StatusBadge value={row.source_type} />
        <p className="mt-1 truncate font-semibold text-gray-900">{row.target_title}</p>
      </div>
    ) },
    { key: "class_code", label: c.class, width: 120 },
    { key: "subject_code", label: c.subject, width: 100 },
    { key: "semester_code", label: c.semester, width: 110 },
    { key: "group", label: c.group, width: 180, render: (row) => row.group_name || "—" },
    { key: "rubric", label: c.rubric, width: 190, render: (row) => `${row.rubric_name || "—"} v${row.rubric_version || 1}` },
    { key: "evaluator_name", label: c.evaluator, width: 160, render: (row) => row.evaluator_name || row.evaluator_email || "—" },
    { key: "total_score", label: c.score, width: 120, render: (row) => formatScore(row.total_score, row.max_score) },
    { key: "status", label: t("admin.fields.status"), width: 120, render: (row) => <StatusBadge value={row.status} /> },
    { key: "evaluated_at", label: c.evaluated, width: 150, render: (row) => formatDate(row.evaluated_at) },
    { key: "updated_at", label: t("common.updated"), width: 150, render: (row) => formatDate(row.updated_at) },
    { key: "actions", label: "", width: 120, render: (row) => (
      <div className="flex justify-end gap-1">
        <ActionButton title={t("admin.evaluationOps.sessions.viewDetail")} onClick={() => onOpen?.(row)} tone="indigo"><Eye size={16} /></ActionButton>
        <Link to={row.source_type === "checkpoint" ? `/admin/checkpoints/${row.target_id}` : `/admin/assignments/${row.target_id}`}>
          <ActionButton title={t("admin.evaluationOps.sessions.viewSubmission")}><ExternalLink size={16} /></ActionButton>
        </Link>
      </div>
    ) },
  ], [c, t, onOpen]);

  return (
    <AdminTable
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      meta={meta}
      onPageChange={onPageChange}
      emptyText={t("admin.evaluationOps.sessions.empty")}
    />
  );
}
