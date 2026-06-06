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
  target_type: "",
  date_from: "",
  date_to: "",
};

export default function AdminAcademicQualityAnalytics() {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery);
  const { lookups } = useAnalyticsLookups();
  const { data, loading, error } = useAnalyticsData(analyticsService.academicQuality, query);
  const tableRows = data?.table || [];

  const columns = useMemo(() => [
    { key: "semester", label: t("admin.analytics.columns.semester"), render: (row) => row.semester_code },
    { key: "subject", label: t("admin.analytics.columns.subject"), render: (row) => row.subject_code },
    { key: "class_code", label: t("admin.analytics.columns.class"), render: (row) => <span className="font-semibold text-gray-900">{row.class_code}</span> },
    { key: "total_groups", label: t("admin.analytics.columns.groups"), render: (row) => Number(row.total_groups || 0) },
    { key: "average_score", label: t("admin.analytics.columns.avgScore"), render: (row) => formatScore(row.average_score) },
    { key: "median_score", label: t("admin.analytics.columns.median"), render: (row) => formatScore(row.median_score) },
    { key: "highest_score", label: t("admin.analytics.columns.highest"), render: (row) => formatScore(row.highest_score) },
    { key: "lowest_score", label: t("admin.analytics.columns.lowest"), render: (row) => formatScore(row.lowest_score) },
    { key: "graded_count", label: t("admin.analytics.columns.graded"), render: (row) => Number(row.graded_count || 0) },
    { key: "pending_count", label: t("admin.analytics.columns.pending"), render: (row) => Number(row.pending_count || 0) },
    { key: "completion_rate", label: t("admin.analytics.columns.completion"), render: (row) => formatPercent(row.completion_rate) },
    { key: "late_rate", label: t("admin.analytics.columns.late"), render: (row) => formatPercent(row.late_rate) },
  ], [t]);

  return (
    <div className="space-y-5">
      <AnalyticsFilterBar
        query={query}
        onChange={setQuery}
        lookups={lookups}
        right={(
          <button type="button" onClick={() => exportRowsToCsv("academic-quality.csv", tableRows)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            <FileDown size={16} /> {t("admin.analytics.exportTable")}
          </button>
        )}
      />
      <AnalyticsState loading={loading} error={error}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <BarListChart title={t("admin.analytics.charts.averageScoreBySemester")} rows={data?.average_score_by_semester || []} labelKey="semester_code" valueKey="average_score" />
          <BarListChart title={t("admin.analytics.charts.averageScoreBySubject")} rows={data?.average_score_by_subject || []} labelKey="subject_code" valueKey="average_score" />
          <BarListChart title={t("admin.analytics.charts.averageScoreByClass")} rows={data?.average_score_by_class || []} labelKey="class_code" valueKey="average_score" />
          <BarListChart title={t("admin.analytics.charts.scoreDistribution")} rows={data?.score_distribution || []} labelKey="bucket" valueKey="total" />
          <BarListChart title={t("admin.analytics.charts.completionRateByClass")} rows={data?.completion_rate_by_class || []} labelKey="class_code" valueKey="completion_rate" valueSuffix="%" />
          <BarListChart title={t("admin.analytics.charts.lateRateByClass")} rows={data?.late_submission_rate_by_class || []} labelKey="class_code" valueKey="late_rate" valueSuffix="%" />
        </div>
        <AdminTable columns={columns} rows={tableRows} emptyText={t("admin.analytics.empty.academicQuality")} />
      </AnalyticsState>
    </div>
  );
}
