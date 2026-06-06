import { useMemo } from "react";
import { Copy, ExternalLink, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import { useTranslation } from "@/context/TranslationContext";
import { useAdminColumns } from "@/utils/adminLabels";
import { formatDate } from "@/pages/admin/evaluation-ops/shared";

export default function RubricUsageTable({ rows, loading, error, meta, onPageChange, onClone }) {
  const { t } = useTranslation();
  const c = useAdminColumns();

  const columns = useMemo(() => [
    {
      key: "rubric_name",
      label: c.rubric,
      width: 240,
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.rubric_name} v{row.rubric_version || 1}</p>
          <p className="mt-1 text-xs text-gray-400">{row.subject_code || t("admin.rubricUsagePage.noSubject")}</p>
        </div>
      ),
    },
    { key: "status", label: t("admin.fields.status"), width: 110, render: (row) => <StatusBadge value={row.status} /> },
    { key: "total_criteria", label: c.criterion, width: 90, render: (row) => Number(row.total_criteria || 0) },
    { key: "total_bindings", label: c.bindings, width: 90, render: (row) => Number(row.total_bindings || 0) },
    { key: "used_in_checkpoints", label: t("admin.rubricUsagePage.checkpoints"), width: 110, render: (row) => Number(row.used_in_checkpoints || 0) },
    { key: "used_in_assignments", label: t("admin.rubricUsagePage.assignments"), width: 110, render: (row) => Number(row.used_in_assignments || 0) },
    { key: "total_evaluations", label: c.evaluations, width: 110, render: (row) => Number(row.total_evaluations || 0) },
    { key: "last_used_at", label: t("admin.rubricUsagePage.lastUsed"), width: 150, render: (row) => formatDate(row.last_used_at) },
    {
      key: "warning",
      label: t("admin.rubricUsagePage.warning"),
      width: 130,
      render: (row) => row.warning_unused_active ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
          <TriangleAlert size={13} /> {t("admin.rubricUsagePage.unusedWarning")}
        </span>
      ) : "—",
    },
    {
      key: "actions",
      label: "",
      width: 100,
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Link to={`/admin/evaluation/rubrics/${row.id}`}>
            <ActionButton title={t("admin.rubricUsagePage.viewRubric")}><ExternalLink size={16} /></ActionButton>
          </Link>
          <ActionButton title={t("admin.rubricUsagePage.cloneRubric")} tone="blue" onClick={() => onClone?.(row)}><Copy size={16} /></ActionButton>
        </div>
      ),
    },
  ], [c, t, onClone]);

  return (
    <AdminTable
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      meta={meta}
      onPageChange={onPageChange}
      emptyText={t("admin.rubricUsagePage.empty")}
    />
  );
}
