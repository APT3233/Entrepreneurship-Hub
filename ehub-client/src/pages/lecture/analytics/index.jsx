import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { BarChart3, Clock, GraduationCap, TrendingDown, TriangleAlert } from "lucide-react";
import analyticsService from "@/api/analytics";
import AdminTable from "@/pages/admin/components/AdminTable";
import AnalyticsState from "@/pages/admin/analytics/components/AnalyticsState";
import AtRiskGroupTable from "@/pages/admin/analytics/components/AtRiskGroupTable";
import BarListChart from "@/pages/admin/analytics/components/BarListChart";
import MetricCard from "@/pages/admin/analytics/components/MetricCard";
import useAnalyticsData from "@/pages/admin/analytics/hooks/useAnalyticsData";
import { formatPercent, formatScore } from "@/pages/admin/analytics/shared";
import { useTranslation } from "@/context/TranslationContext";

const emptyQuery = {};

export default function LecturerAnalyticsPage() {
  const { t } = useTranslation();
  const { classId } = useParams();
  const [query] = useState(emptyQuery);
  const fetcher = useCallback(
    (params) => (classId ? analyticsService.classAnalytics(classId, params) : analyticsService.lecturer(params)),
    [classId],
  );
  const { data, loading, error } = useAnalyticsData(fetcher, query);
  const cards = data?.cards || {};

  const classColumns = useMemo(() => [
    { key: "class_code", label: t("admin.analytics.columns.class"), render: (row) => <span className="font-semibold text-gray-900">{row.class_code}</span> },
    { key: "subject", label: t("admin.analytics.columns.subject"), render: (row) => row.subject_code },
    { key: "average_score", label: t("admin.analytics.columns.avgScore"), render: (row) => formatScore(row.average_score) },
    { key: "graded_count", label: t("admin.analytics.columns.graded"), render: (row) => Number(row.graded_count || 0) },
    { key: "pending_count", label: t("admin.analytics.columns.pending"), render: (row) => Number(row.pending_count || 0) },
    { key: "completion_rate", label: t("admin.analytics.columns.completion"), render: (row) => formatPercent(row.completion_rate) },
    { key: "late_rate", label: t("admin.analytics.columns.late"), render: (row) => formatPercent(row.late_rate) },
  ], [t]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{classId ? t("lecturer.analyticsPage.classTitle") : t("lecturer.analyticsPage.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("lecturer.analyticsPage.subtitle")}</p>
      </div>

      <AnalyticsState loading={loading} error={error}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label={t("lecturer.analyticsPage.myClasses")} value={cards.my_classes} icon={GraduationCap} />
          <MetricCard label={t("lecturer.analyticsPage.averageScore")} value={formatScore(cards.my_classes_average_score)} helper={t("admin.analytics.scoreScaleShort")} icon={BarChart3} />
          <MetricCard label={t("lecturer.analyticsPage.pendingGrading")} value={cards.pending_grading} icon={Clock} />
          <MetricCard label={t("lecturer.analyticsPage.lateSubmissions")} value={formatPercent(cards.late_submissions)} icon={TrendingDown} />
          <MetricCard label={t("lecturer.analyticsPage.groupsAttention")} value={cards.groups_needing_attention} icon={TriangleAlert} />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <BarListChart title={t("admin.analytics.charts.averageScoreByClass")} rows={data?.average_score_by_target || []} labelKey="class_code" valueKey="average_score" />
          <BarListChart title={t("admin.analytics.charts.rubricCriteriaWeakness")} rows={(data?.rubric_criteria_weakness || []).map((row) => ({ ...row, label: `${row.rubric_name} · ${row.criterion_name}` }))} labelKey="label" valueKey="average_percentage" valueSuffix="%" />
        </div>

        <AtRiskGroupTable rows={data?.groups_needing_attention || []} />
        <AdminTable columns={classColumns} rows={data?.class_performance || []} emptyText={t("lecturer.analyticsPage.emptyClasses")} />
      </AnalyticsState>
    </div>
  );
}
