import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import analyticsService from "@/api/analytics";
import AdminTable from "@/pages/admin/components/AdminTable";
import { useTranslation } from "@/context/TranslationContext";
import AnalyticsFilterBar from "./components/AnalyticsFilterBar";
import AnalyticsState from "./components/AnalyticsState";
import BarListChart from "./components/BarListChart";
import useAnalyticsData from "./hooks/useAnalyticsData";
import useAnalyticsLookups from "./hooks/useAnalyticsLookups";
import { exportRowsToCsv, formatPercent, formatScore } from "./shared";

const initialQuery = {
  semester_id: "",
  subject_id: "",
  class_id: "",
  rubric_id: "",
  target_type: "",
  date_from: "",
  date_to: "",
};

export default function AdminRubricAnalytics() {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery);
  const { lookups, rubrics } = useAnalyticsLookups({ includeRubrics: true });
  const { data, loading, error } = useAnalyticsData(analyticsService.rubric, query);
  const tableRows = data?.table || [];

  const columns = useMemo(() => [
    { key: "rubric_name", label: t("admin.analytics.columns.rubric"), render: (row) => <span className="font-semibold text-gray-900">{row.rubric_name} v{row.rubric_version}</span> },
    { key: "criterion_name", label: t("admin.analytics.columns.criterion"), render: (row) => row.criterion_name },
    { key: "max_score", label: t("admin.analytics.columns.max"), render: (row) => formatScore(row.max_score) },
    { key: "average_score", label: t("admin.analytics.columns.avgScore"), render: (row) => formatScore(row.average_score) },
    { key: "average_percentage", label: t("admin.analytics.columns.avgPercent"), render: (row) => formatPercent(row.average_percentage) },
    { key: "total_evaluations", label: t("admin.analytics.columns.evaluations"), render: (row) => Number(row.total_evaluations || 0) },
    { key: "low_score_count", label: t("admin.analytics.columns.lowScore"), render: (row) => Number(row.low_score_count || 0) },
    { key: "feedback_count", label: t("admin.analytics.columns.feedback"), render: (row) => Number(row.feedback_count || 0) },
  ], [t]);

  return (
    <div className="space-y-5">
      <AnalyticsFilterBar
        query={query}
        onChange={setQuery}
        lookups={lookups}
        rubrics={rubrics}
        showRubric
        right={(
          <button type="button" onClick={() => exportRowsToCsv("rubric-analytics.csv", tableRows)} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover">
            <FileDown size={16} /> {t("admin.analytics.exportTable")}
          </button>
        )}
      />
      <AnalyticsState loading={loading} error={error}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <BarListChart title={t("admin.analytics.charts.lowestScoringCriteria")} rows={(data?.lowest_scoring_criteria || []).map((row) => ({ ...row, label: `${row.rubric_name} · ${row.criterion_name}` }))} labelKey="label" valueKey="average_percentage" valueSuffix="%" />
          <BarListChart title={t("admin.analytics.charts.highestScoringCriteria")} rows={(data?.highest_scoring_criteria || []).map((row) => ({ ...row, label: `${row.rubric_name} · ${row.criterion_name}` }))} labelKey="label" valueKey="average_percentage" valueSuffix="%" />
          <BarListChart title={t("admin.analytics.charts.criteriaMostFeedback")} rows={(data?.criteria_requiring_most_feedback || []).map((row) => ({ ...row, label: `${row.rubric_name} · ${row.criterion_name}` }))} labelKey="label" valueKey="feedback_count" />
          <BarListChart title={t("admin.analytics.charts.rubricUsageCount")} rows={(data?.rubric_usage_count || []).map((row) => ({ ...row, label: `${row.rubric_name} v${row.rubric_version}` }))} labelKey="label" valueKey="evaluation_count" />
        </div>
        <AdminTable columns={columns} rows={tableRows} emptyText={t("admin.analytics.empty.rubric")} />
      </AnalyticsState>
    </div>
  );
}
