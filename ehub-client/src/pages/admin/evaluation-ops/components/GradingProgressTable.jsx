import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import { useTranslation } from "@/context/TranslationContext";
import { useAdminColumns } from "@/utils/adminLabels";
import { formatDate, formatPercent } from "@/pages/admin/evaluation-ops/shared";

function ProgressBar({ value = 0 }) {
  const pct = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="min-w-[130px]">
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs font-semibold text-gray-500">{formatPercent(pct)}</p>
    </div>
  );
}

export default function GradingProgressTable({ rows, loading, error, meta, onPageChange }) {
  const { t } = useTranslation();
  const c = useAdminColumns();

  const columns = useMemo(() => [
    { key: "class_code", label: c.class, width: 120 },
    {
      key: "target",
      label: c.target,
      width: 240,
      render: (row) => (
        <div>
          <StatusBadge value={row.target_type} />
          <p className="mt-1 truncate font-semibold text-gray-900">{row.target_title}</p>
          <p className="mt-1 text-xs text-gray-400">{formatDate(row.deadline)}</p>
        </div>
      ),
    },
    { key: "total_groups", label: t("admin.fields.groupCount"), width: 90, render: (row) => Number(row.total_groups || 0) },
    { key: "not_submitted_count", label: c.notSubmitted, width: 120, render: (row) => Number(row.not_submitted_count || 0) },
    { key: "submitted_count", label: c.submitted, width: 110, render: (row) => Number(row.submitted_count || 0) },
    { key: "pending_grading_count", label: t("admin.fields.pendingGrading"), width: 100, render: (row) => Number(row.pending_grading_count || 0) },
    { key: "draft_evaluation_count", label: c.draft, width: 90, render: (row) => Number(row.draft_evaluation_count || 0) },
    { key: "graded_count", label: t("admin.analytics.columns.graded"), width: 90, render: (row) => Number(row.graded_count || 0) },
    { key: "confirmed_count", label: c.confirmed, width: 100, render: (row) => Number(row.confirmed_count || 0) },
    { key: "late_submission_count", label: t("admin.analytics.columns.late"), width: 80, render: (row) => Number(row.late_submission_count || 0) },
    { key: "completion_rate", label: c.completion, width: 150, render: (row) => <ProgressBar value={row.completion_rate} /> },
    {
      key: "actions",
      label: "",
      width: 70,
      render: (row) => (
        <Link to={row.target_type === "checkpoint" ? `/admin/checkpoints/${row.target_id}` : `/admin/assignments/${row.target_id}`}>
          <ActionButton title={t("admin.evaluation.openTarget")}><ExternalLink size={16} /></ActionButton>
        </Link>
      ),
    },
  ], [c, t]);

  return (
    <AdminTable
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      meta={meta}
      onPageChange={onPageChange}
      emptyText={t("common.noData")}
    />
  );
}
