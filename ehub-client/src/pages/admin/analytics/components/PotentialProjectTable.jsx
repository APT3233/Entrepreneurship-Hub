import { useMemo } from "react";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { useTranslation } from "@/context/TranslationContext";
import { formatPercent, formatScore } from "../shared";

export default function PotentialProjectTable({ rows = [], loading, error }) {
  const { t } = useTranslation();

  const columns = useMemo(() => [
    { key: "group", label: t("admin.analytics.columns.group"), render: (row) => <span className="font-semibold text-gray-900">{row.group_name || "—"}</span> },
    { key: "topic", label: t("admin.analytics.columns.topic"), render: (row) => row.topic || "-" },
    { key: "category", label: t("admin.analytics.columns.category"), render: (row) => row.category || "-" },
    { key: "class", label: t("admin.analytics.columns.class"), render: (row) => row.class_code },
    { key: "semester", label: t("admin.analytics.columns.semester"), render: (row) => row.semester_code },
    { key: "average_score", label: t("admin.analytics.columns.avgScore"), render: (row) => formatScore(row.average_score) },
    { key: "final_score", label: t("admin.analytics.columns.final"), render: (row) => formatScore(row.final_score) },
    { key: "completion_rate", label: t("admin.analytics.columns.completion"), render: (row) => formatPercent(row.completion_rate) },
    { key: "late_count", label: t("admin.analytics.columns.late"), render: (row) => Number(row.late_count || 0) },
    { key: "recommendation_flag", label: t("admin.analytics.columns.flag"), render: (row) => <StatusBadge value={row.recommendation_flag} /> },
  ], [t]);

  return (
    <AdminTable
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyText={t("admin.analytics.empty.projects")}
    />
  );
}
