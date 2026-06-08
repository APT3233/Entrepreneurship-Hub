import { useEffect, useState } from "react";
import MentorAnalyticsApi from "@/api/mentorAnalytics";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { MetricsGrid, Panel } from "@/pages/admin/mentor-analytics/components";

export default function LecturerMentorAnalyticsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let mounted = true;
    MentorAnalyticsApi.lecturerDashboard()
      .then((res) => mounted && setData(res?.data || {}))
      .catch((err) => mounted && setError(err.message || t("lecturer.mentoringPage.analyticsLoadError")))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [t]);
  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">{t("common.loading")}</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  const overview = data?.overview || {};
  return (
    <div className="space-y-5">
      <MetricsGrid items={[
        { label: t("lecturer.mentoringPage.metrics.activeMentors"), value: overview.active_mentors },
        { label: t("lecturer.mentoringPage.metrics.activeAssignments"), value: overview.active_assignments },
        { label: t("lecturer.mentoringPage.metrics.completedSessions"), value: overview.completed_sessions },
        { label: t("lecturer.mentoringPage.metrics.mentoringHours"), value: overview.total_mentoring_hours },
        { label: t("lecturer.mentoringPage.metrics.groupsWithoutMentor"), value: overview.groups_without_mentor },
      ]} />
      <Panel title={t("lecturer.mentoringPage.panels.groupSupport")}>
        <AdminTable columns={[
          { key: "group_name", label: t("lecturer.mentoringPage.columns.group") },
          { key: "topic", label: t("lecturer.mentoringPage.columns.topic") },
          { key: "active_mentors", label: t("lecturer.mentoringPage.columns.mentors") },
          { key: "sessions_completed", label: t("lecturer.mentoringPage.columns.sessions") },
          { key: "support_status", label: t("lecturer.mentoringPage.columns.status"), render: (row) => <StatusBadge value={row.support_status} /> },
        ]} rows={data?.group_support || []} emptyText={t("lecturer.mentoringPage.emptyGroupSupport")} />
      </Panel>
      <Panel title={t("lecturer.mentoringPage.panels.mentorWorkload")}>
        <AdminTable columns={[
          { key: "full_name", label: t("lecturer.mentoringPage.columns.mentor") },
          { key: "active_assignments", label: t("lecturer.mentoringPage.columns.assignments") },
          { key: "scheduled_sessions", label: t("lecturer.mentoringPage.columns.scheduled") },
          { key: "workload_status", label: t("lecturer.mentoringPage.columns.workload"), render: (row) => <StatusBadge value={row.workload_status} /> },
        ]} rows={data?.workload || []} emptyText={t("lecturer.mentoringPage.emptyWorkload")} />
      </Panel>
    </div>
  );
}
