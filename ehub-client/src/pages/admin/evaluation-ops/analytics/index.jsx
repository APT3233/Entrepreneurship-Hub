import { useEffect, useState } from "react";
import { BarChart3, Clock, FileCheck2, GraduationCap, Layers3, Star, TrendingDown, UsersRound } from "lucide-react";
import { analyticsService } from "@/api/adminEvaluationOps";
import { useTranslation } from "@/context/TranslationContext";
import AnalyticsCard from "@/pages/admin/evaluation-ops/components/AnalyticsCard";
import SimpleChartWrapper from "@/pages/admin/evaluation-ops/components/SimpleChartWrapper";
import { formatPercent } from "@/pages/admin/evaluation-ops/shared";

export default function AdminEvaluationAnalytics() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    analyticsService.get()
      .then((res) => setData(res?.data || null))
      .catch((err) => setError(err.message || t("admin.evaluationOps.analytics.loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) return <div className="rounded-card border border-border bg-surface p-8 text-center text-sm text-gray-400">{t("common.loading")}...</div>;
  if (error) return <div className="rounded-card border border-red-100 bg-red-50 p-8 text-center text-sm font-medium text-red-600">{error}</div>;

  const cards = data?.cards || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard label={t("admin.evaluationOps.analytics.totalClasses")} value={cards.total_classes} icon={GraduationCap} />
        <AnalyticsCard label={t("admin.evaluationOps.analytics.totalGroups")} value={cards.total_groups} icon={UsersRound} />
        <AnalyticsCard label={t("admin.evaluationOps.analytics.totalSubmissions")} value={cards.total_submissions} icon={FileCheck2} />
        <AnalyticsCard label={t("admin.evaluationOps.analytics.pendingGrading")} value={cards.pending_grading} icon={Clock} />
        <AnalyticsCard label={t("admin.evaluationOps.analytics.averageScore")} value={formatPercent(cards.average_score)} icon={BarChart3} helper={t("admin.evaluationOps.analytics.averageScoreHelper")} />
        <AnalyticsCard label={t("admin.evaluationOps.analytics.lateSubmissions")} value={cards.late_submissions} icon={TrendingDown} />
        <AnalyticsCard label={t("admin.evaluationOps.analytics.topGroups")} value={(data?.top_groups || []).length} icon={Star} />
        <AnalyticsCard label={t("admin.evaluationOps.analytics.atRiskGroups")} value={(data?.at_risk_groups || []).length} icon={Layers3} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <SimpleChartWrapper title={t("admin.evaluationOps.analytics.chartAverageByClass")} rows={charts.average_score_by_class || []} labelKey="class_code" valueKey="average_score" valueSuffix="%" />
        <SimpleChartWrapper title={t("admin.evaluationOps.analytics.chartSubmissionStatus")} rows={charts.submission_status_distribution || []} labelKey="status" valueKey="total" />
        <SimpleChartWrapper title={t("admin.evaluationOps.analytics.chartGroupsByCategory")} rows={charts.groups_by_category || []} labelKey="category" valueKey="total" />
        <SimpleChartWrapper title={t("admin.evaluationOps.analytics.chartLateByCheckpoint")} rows={(charts.late_submissions_by_checkpoint || []).map((row) => ({ ...row, label: `${row.class_code} · ${row.title}` }))} labelKey="label" valueKey="late_count" />
        <SimpleChartWrapper title={t("admin.evaluationOps.analytics.chartScoreTrend")} rows={(charts.score_trend_by_checkpoint || []).map((row) => ({ ...row, label: `${row.source_type} · ${row.item_title}` }))} labelKey="label" valueKey="average_score" valueSuffix="%" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-card border border-border bg-surface p-5">
          <h2 className="mb-4 text-base font-bold text-gray-900">{t("admin.evaluationOps.analytics.topGroupsTitle")}</h2>
          {(data?.top_groups || []).length ? (
            <div className="space-y-3">
              {data.top_groups.map((group) => (
                <div key={group.group_id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900">{group.group_name || "—"}</p>
                    <p className="truncate text-xs text-gray-500">{group.topic || t("admin.evaluationOps.analytics.noTopic")}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{formatPercent(group.average_score)}</span>
                </div>
              ))}
            </div>
          ) : <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-400">{t("admin.evaluationOps.analytics.noTopGroups")}</div>}
        </div>
        <div className="rounded-card border border-border bg-surface p-5">
          <h2 className="mb-4 text-base font-bold text-gray-900">{t("admin.evaluationOps.analytics.atRiskGroupsTitle")}</h2>
          {(data?.at_risk_groups || []).length ? (
            <div className="space-y-3">
              {data.at_risk_groups.map((group) => (
                <div key={group.group_id} className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-amber-900">{group.group_name || "—"}</p>
                    <p className="truncate text-xs text-amber-700">
                      {t("admin.evaluationOps.analytics.submittedProgress", {
                        class: group.class_code,
                        submitted: group.submitted_items,
                        expected: group.expected_items,
                      })}
                    </p>
                  </div>
                  <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-amber-700">{formatPercent(group.average_score)}</span>
                </div>
              ))}
            </div>
          ) : <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-400">{t("admin.evaluationOps.analytics.noAtRiskGroups")}</div>}
        </div>
      </div>
    </div>
  );
}
