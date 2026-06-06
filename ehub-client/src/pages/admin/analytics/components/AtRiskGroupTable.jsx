import { useMemo } from "react";
import AdminTable from "@/pages/admin/components/AdminTable";
import { useTranslation } from "@/context/TranslationContext";
import { formatPercent, formatScore } from "../shared";

export default function AtRiskGroupTable({ rows = [], loading, error }) {
  const { t } = useTranslation();

  const columns = useMemo(() => [
    { key: "group", label: t("admin.analytics.columns.group"), render: (row) => <span className="font-semibold text-gray-900">{row.group_name || "—"}</span> },
    { key: "topic", label: t("admin.analytics.columns.topic"), render: (row) => row.topic || "-" },
    { key: "class", label: t("admin.analytics.columns.class"), render: (row) => row.class_code },
    { key: "average_score", label: t("admin.analytics.columns.avgScore"), render: (row) => formatScore(row.average_score) },
    { key: "completion_rate", label: t("admin.analytics.columns.completion"), render: (row) => formatPercent(row.completion_rate) },
    { key: "submitted", label: t("admin.analytics.columns.submitted"), render: (row) => `${Number(row.submitted_items || 0)} / ${Number(row.expected_items || 0)}` },
    { key: "late_count", label: t("admin.analytics.columns.late"), render: (row) => Number(row.late_count || 0) },
  ], [t]);

  return (
    <AdminTable
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyText={t("admin.analytics.empty.atRiskGroups")}
    />
  );
}
