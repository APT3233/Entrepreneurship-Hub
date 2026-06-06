import { useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Clock, FileCheck2, GraduationCap, Layers3, TrendingDown, UsersRound } from "lucide-react";
import analyticsService from "@/api/analytics";
import { useTranslation } from "@/context/TranslationContext";
import AnalyticsFilterBar from "./components/AnalyticsFilterBar";
import AnalyticsState from "./components/AnalyticsState";
import BarListChart from "./components/BarListChart";
import MetricCard from "./components/MetricCard";
import useAnalyticsData from "./hooks/useAnalyticsData";
import useAnalyticsLookups from "./hooks/useAnalyticsLookups";
import { formatPercent, formatScore } from "./shared";

const initialQuery = {
  semester_id: "",
  subject_id: "",
  class_id: "",
  target_type: "",
  date_from: "",
  date_to: "",
};

export default function AdminAnalyticsOverview() {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery);
  const { lookups } = useAnalyticsLookups();
  const { data, loading, error } = useAnalyticsData(analyticsService.overview, query);
  const cards = data?.cards || {};

  const metrics = useMemo(() => [
    { label: t("admin.analytics.metrics.totalClasses"), value: cards.total_classes, icon: GraduationCap },
    { label: t("admin.analytics.metrics.totalGroups"), value: cards.total_groups, icon: UsersRound },
    { label: t("admin.analytics.metrics.totalProjects"), value: cards.total_projects, icon: Layers3 },
    { label: t("admin.analytics.metrics.totalSubmissions"), value: cards.total_submissions, icon: FileCheck2 },
    { label: t("admin.analytics.metrics.gradedSubmissions"), value: cards.graded_submissions, icon: CheckCircle2 },
    { label: t("admin.analytics.metrics.pendingGrading"), value: cards.pending_grading, icon: Clock },
    { label: t("admin.analytics.metrics.averageScore"), value: formatScore(cards.average_score), helper: t("admin.analytics.scoreScale"), icon: BarChart3 },
    { label: t("admin.analytics.metrics.lateRate"), value: formatPercent(cards.late_submission_rate), icon: TrendingDown },
    { label: t("admin.analytics.metrics.completion"), value: formatPercent(cards.completion_rate), icon: CheckCircle2 },
    { label: t("admin.analytics.metrics.topClass"), value: data?.top_performing_class?.class_code || "-", helper: formatScore(data?.top_performing_class?.average_score), icon: GraduationCap },
  ], [cards, data, t]);

  return (
    <div className="space-y-5">
      <AnalyticsFilterBar query={query} onChange={setQuery} lookups={lookups} />
      <AnalyticsState loading={loading} error={error}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((item) => (
            <MetricCard key={item.label} label={item.label} value={item.value} helper={item.helper} icon={item.icon} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <BarListChart title={t("admin.analytics.charts.averageScoreByClass")} rows={data?.charts?.average_score_by_class || []} labelKey="class_code" valueKey="average_score" />
          <BarListChart title={t("admin.analytics.charts.completionRateByClass")} rows={data?.charts?.completion_rate_by_class || []} labelKey="class_code" valueKey="completion_rate" valueSuffix="%" />
          <BarListChart title={t("admin.analytics.charts.submissionStatus")} rows={data?.charts?.submission_status_distribution || []} labelKey="status" valueKey="total" />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-900">{t("admin.analytics.sections.classPerformanceSnapshot")}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase text-emerald-600">{t("admin.analytics.sections.topPerformingClass")}</p>
              <p className="mt-2 text-lg font-black text-emerald-900">{data?.top_performing_class?.class_code || "-"}</p>
              <p className="text-sm font-semibold text-emerald-700">{formatScore(data?.top_performing_class?.average_score)} / 10</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-xs font-bold uppercase text-amber-600">{t("admin.analytics.sections.lowestPerformingClass")}</p>
              <p className="mt-2 text-lg font-black text-amber-900">{data?.lowest_performing_class?.class_code || "-"}</p>
              <p className="text-sm font-semibold text-amber-700">{formatScore(data?.lowest_performing_class?.average_score)} / 10</p>
            </div>
          </div>
        </div>
      </AnalyticsState>
    </div>
  );
}
