import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import analyticsService from "@/api/analytics";
import AdminTable from "@/pages/admin/components/AdminTable";
import { useTranslation } from "@/context/TranslationContext";
import AnalyticsFilterBar from "./components/AnalyticsFilterBar";
import AnalyticsState from "./components/AnalyticsState";
import BarListChart from "./components/BarListChart";
import PotentialProjectTable from "./components/PotentialProjectTable";
import useAnalyticsData from "./hooks/useAnalyticsData";
import useAnalyticsLookups from "./hooks/useAnalyticsLookups";
import { exportRowsToCsv, formatPercent, formatScore } from "./shared";

const initialQuery = {
  semester_id: "",
  subject_id: "",
  class_id: "",
  target_type: "",
  date_from: "",
  date_to: "",
};

export default function AdminProjectAnalytics() {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery);
  const { lookups } = useAnalyticsLookups();
  const { data, loading, error } = useAnalyticsData(analyticsService.projects, query);
  const rows = data?.potential_projects || [];

  const missingColumns = useMemo(() => [
    { key: "group", label: t("admin.analytics.columns.group"), render: (row) => <span className="font-semibold text-gray-900">{row.group_name || "—"}</span> },
    { key: "topic", label: t("admin.analytics.columns.topic"), render: (row) => row.topic || "-" },
    { key: "class", label: t("admin.analytics.columns.class"), render: (row) => row.class_code },
    { key: "submitted", label: t("admin.analytics.columns.submitted"), render: (row) => `${Number(row.submitted_items || 0)} / ${Number(row.expected_items || 0)}` },
    { key: "average_score", label: t("admin.analytics.columns.avgScore"), render: (row) => formatScore(row.average_score) },
    { key: "completion_rate", label: t("admin.analytics.columns.completion"), render: (row) => formatPercent(row.completion_rate) },
  ], [t]);

  return (
    <div className="space-y-5">
      <AnalyticsFilterBar
        query={query}
        onChange={setQuery}
        lookups={lookups}
        right={(
          <button type="button" onClick={() => exportRowsToCsv("project-analytics.csv", rows)} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover">
            <FileDown size={16} /> {t("admin.analytics.exportTable")}
          </button>
        )}
      />
      <AnalyticsState loading={loading} error={error}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <BarListChart title={t("admin.analytics.charts.projectsByCategory")} rows={data?.projects_by_category || []} labelKey="category" valueKey="total" />
          <BarListChart title={t("admin.analytics.charts.averageScoreByCategory")} rows={data?.average_score_by_category || []} labelKey="category" valueKey="average_score" />
        </div>
        <PotentialProjectTable rows={rows} />
        <AdminTable columns={missingColumns} rows={data?.projects_missing_submissions || []} emptyText={t("admin.analytics.empty.projectsMissing")} />
      </AnalyticsState>
    </div>
  );
}
