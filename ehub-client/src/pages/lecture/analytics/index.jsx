import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Clock, GraduationCap, TrendingDown, TriangleAlert } from "lucide-react";
import analyticsService from "@/api/analytics";
import AdminTable from "@/pages/admin/components/AdminTable";
import AnalyticsState from "@/pages/admin/analytics/components/AnalyticsState";
import AtRiskGroupTable from "@/pages/admin/analytics/components/AtRiskGroupTable";
import BarListChart from "@/pages/admin/analytics/components/BarListChart";
import Avatar from "@/components/ui/Avatar";
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
    { key: "class_code", label: t("admin.analytics.columns.class"), render: (row) => (
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar name={row.class_code} />
        <span className="font-semibold text-text-primary truncate">{row.class_code}</span>
      </div>
    ) },
    { key: "subject", label: t("admin.analytics.columns.subject"), render: (row) => row.subject_code },
    { key: "average_score", label: t("admin.analytics.columns.avgScore"), render: (row) => formatScore(row.average_score) },
    { key: "graded_count", label: t("admin.analytics.columns.graded"), render: (row) => Number(row.graded_count || 0) },
    { key: "pending_count", label: t("admin.analytics.columns.pending"), render: (row) => Number(row.pending_count || 0) },
    { key: "completion_rate", label: t("admin.analytics.columns.completion"), render: (row) => formatPercent(row.completion_rate) },
    { key: "late_rate", label: t("admin.analytics.columns.late"), render: (row) => formatPercent(row.late_rate) },
  ], [t]);

  const scoreByClass = data?.average_score_by_target || [];
  const attention = [
    { icon: TriangleAlert, box: "bg-warning-bg text-warning", valueCls: "text-warning", label: t("lecturer.analyticsPage.groupsAttention"), value: cards.groups_needing_attention ?? "—" },
    { icon: Clock, box: "bg-secondary-bg text-secondary", valueCls: "text-secondary", label: t("lecturer.analyticsPage.pendingGrading"), value: cards.pending_grading ?? "—" },
    { icon: TrendingDown, box: "bg-danger-bg text-danger", valueCls: "text-danger", label: t("lecturer.analyticsPage.lateSubmissions"), value: formatPercent(cards.late_submissions) },
    { icon: GraduationCap, box: "bg-subtle text-text-secondary", valueCls: "text-text-primary", label: t("lecturer.analyticsPage.myClasses"), value: cards.my_classes ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          {classId ? t("lecturer.analyticsPage.classTitle") : t("lecturer.analyticsPage.title")}
        </h1>
        <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">{t("lecturer.analyticsPage.subtitle")}</p>
      </div>

      <AnalyticsState loading={loading} error={error}>
        {/* Insight row: headline điểm TB + phân bố theo lớp | khối cần chú ý */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-card bg-surface shadow-card p-6 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("lecturer.analyticsPage.averageScore")}</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-6xl font-bold text-accent leading-none tracking-tight">{formatScore(cards.my_classes_average_score)}</span>
              <span className="text-lg text-text-muted mb-2">/ 10</span>
            </div>

            <div className="mt-7">
              <p className="text-xs font-medium text-text-secondary mb-3">{t("admin.analytics.charts.averageScoreByClass")}</p>
              {scoreByClass.length === 0 ? (
                <p className="text-sm text-text-muted">Chưa có dữ liệu.</p>
              ) : (
                <div className="space-y-2.5">
                  {scoreByClass.slice(0, 6).map((row) => {
                    const pct = Math.min(100, Math.max(0, (Number(row.average_score) || 0) / 10 * 100));
                    return (
                      <div key={row.class_code} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 text-xs text-text-secondary truncate">{row.class_code}</span>
                        <div className="flex-1 h-2 rounded-full bg-subtle overflow-hidden">
                          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-9 shrink-0 text-right text-xs font-semibold text-text-primary">{formatScore(row.average_score)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 rounded-card bg-surface shadow-card p-6">
            <h3 className="text-base font-semibold text-text-primary">Cần chú ý</h3>
            <div className="mt-4 flex flex-col gap-3">
              {attention.map((a) => (
                <div key={a.label} className="flex items-center gap-3">
                  <span className={`shrink-0 grid place-items-center w-9 h-9 rounded-xl ${a.box} [&_svg]:w-[18px] [&_svg]:h-[18px]`}>
                    <a.icon />
                  </span>
                  <span className="flex-1 text-sm text-text-secondary">{a.label}</span>
                  <span className={`text-lg font-bold ${a.valueCls}`}>{a.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <BarListChart
          title={t("admin.analytics.charts.rubricCriteriaWeakness")}
          rows={(data?.rubric_criteria_weakness || []).map((row) => ({ ...row, label: `${row.rubric_name} · ${row.criterion_name}` }))}
          labelKey="label"
          valueKey="average_percentage"
          valueSuffix="%"
        />

        <AtRiskGroupTable rows={data?.groups_needing_attention || []} />
        <AdminTable columns={classColumns} rows={data?.class_performance || []} emptyText={t("lecturer.analyticsPage.emptyClasses")} />
      </AnalyticsState>
    </div>
  );
}
