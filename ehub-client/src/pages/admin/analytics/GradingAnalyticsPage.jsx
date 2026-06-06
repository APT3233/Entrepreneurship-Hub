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
import { exportRowsToCsv, formatHours } from "./shared";

const initialQuery = {
  semester_id: "",
  subject_id: "",
  class_id: "",
  lecturer_id: "",
  target_type: "",
  date_from: "",
  date_to: "",
};

export default function AdminGradingAnalytics() {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery);
  const { lookups } = useAnalyticsLookups();
  const { data, loading, error } = useAnalyticsData(analyticsService.grading, query);
  const tableRows = data?.table || [];

  const columns = useMemo(() => [
    { key: "lecturer", label: t("admin.analytics.columns.lecturer"), render: (row) => <span className="font-semibold text-gray-900">{row.lecturer}</span> },
    { key: "assigned_classes", label: t("admin.analytics.columns.classes"), render: (row) => Number(row.assigned_classes || 0) },
    { key: "total_submissions", label: t("admin.analytics.columns.submissions"), render: (row) => Number(row.total_submissions || 0) },
    { key: "graded_submissions", label: t("admin.analytics.columns.graded"), render: (row) => Number(row.graded_submissions || 0) },
    { key: "pending_submissions", label: t("admin.analytics.columns.pending"), render: (row) => Number(row.pending_submissions || 0) },
    { key: "draft_evaluations", label: t("admin.analytics.columns.draft"), render: (row) => Number(row.draft_evaluations || 0) },
    { key: "confirmed_evaluations", label: t("admin.analytics.columns.confirmed"), render: (row) => Number(row.confirmed_evaluations || 0) },
    { key: "average_grading_delay_hours", label: t("admin.analytics.columns.avgDelay"), render: (row) => formatHours(row.average_grading_delay_hours) },
    { key: "last_graded_at", label: t("admin.analytics.columns.lastGraded"), render: (row) => row.last_graded_at || "-" },
  ], [t]);

  return (
    <div className="space-y-5">
      <AnalyticsFilterBar
        query={query}
        onChange={setQuery}
        lookups={lookups}
        showLecturer
        right={(
          <button type="button" onClick={() => exportRowsToCsv("grading-analytics.csv", tableRows)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            <FileDown size={16} /> {t("admin.analytics.exportTable")}
          </button>
        )}
      />
      <AnalyticsState loading={loading} error={error}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <BarListChart title={t("admin.analytics.charts.pendingGradingByLecturer")} rows={data?.pending_grading_by_lecturer || []} labelKey="lecturer" valueKey="total" />
          <BarListChart title={t("admin.analytics.charts.gradedCountByLecturer")} rows={data?.graded_count_by_lecturer || []} labelKey="lecturer" valueKey="total" />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-900">{t("admin.analytics.sections.submissionsWaitingLongest")}</h2>
          {(data?.submissions_waiting_longest || []).length ? (
            <div className="divide-y divide-gray-100">
              {data.submissions_waiting_longest.map((row) => (
                <div key={`${row.target_type}-${row.target_id}-${row.group_id || row.group_name}`} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-gray-900">{row.class_code} · {row.target_title}</p>
                    <p className="truncate text-xs text-gray-500">{row.group_name || "—"}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{formatHours(row.waiting_hours)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-400">{t("admin.analytics.noLongWaiting")}</div>
          )}
        </div>
        <AdminTable columns={columns} rows={tableRows} emptyText={t("admin.analytics.empty.gradingWorkload")} />
      </AnalyticsState>
    </div>
  );
}
