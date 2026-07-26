import { useEffect, useState } from "react";
import MentorAnalyticsApi from "@/api/mentorAnalytics";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { MetricsGrid, Panel } from "@/pages/admin/mentor-analytics/components";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function MentorDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    MentorAnalyticsApi.mentorDashboard()
      .then((res) => mounted && setData(res?.data || {}))
      .catch((err) => mounted && setError(err.message || t("mentorPortal.dashboard.loadError")))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [t]);

  if (loading) return <div className="rounded-card border border-border bg-surface p-8 text-center text-sm text-text-muted">{t("common.loading") || "Loading..."}</div>;
  if (error) return <div className="rounded-card border border-border bg-surface p-8 text-center text-sm font-medium text-danger-text">{error}</div>;

  const metrics = data?.metrics || {};

  return (
    <div className="space-y-5">
      <MetricsGrid
        items={[
          { label: t("mentorPortal.dashboard.assignedGroups"), value: data?.assignments?.length },
          { label: t("mentorPortal.dashboard.upcomingSessions"), value: metrics.upcoming_sessions },
          { label: t("mentorPortal.dashboard.completedSessions"), value: metrics.completed_sessions },
          { label: t("mentorPortal.dashboard.totalHours"), value: metrics.total_hours },
          { label: t("mentorPortal.dashboard.averageRating"), value: metrics.average_rating ? Number(metrics.average_rating).toFixed(1) : "-" }
        ]}
      />
      <Panel title={t("mentorPortal.dashboard.assignedGroups")}>
        <AdminTable
          columns={[
            { key: "group_name", label: t("mentorPortal.dashboard.group") },
            { key: "topic", label: t("mentorPortal.dashboard.topic") },
            { key: "class_code", label: t("mentorPortal.dashboard.class") },
            { key: "assignment_type", label: t("mentorPortal.dashboard.type"), render: (row) => <StatusBadge value={row.assignment_type} /> },
            { key: "status", label: t("mentorPortal.dashboard.status"), render: (row) => <StatusBadge value={row.status} /> }
          ]}
          rows={data?.assignments || []}
          emptyText={t("mentorPortal.dashboard.noAssignments")}
        />
      </Panel>
      <Panel title={t("mentorPortal.dashboard.openActionItems")}>
        <AdminTable
          columns={[
            { key: "title", label: t("mentorPortal.dashboard.actionItem") },
            { key: "group_name", label: t("mentorPortal.dashboard.group") },
            { key: "session_title", label: t("mentorPortal.dashboard.session") },
            { key: "due_date", label: t("mentorPortal.dashboard.due"), render: (row) => formatDate(row.due_date) },
            { key: "status", label: t("mentorPortal.dashboard.status"), render: (row) => <StatusBadge value={row.status} /> }
          ]}
          rows={data?.action_items || []}
          emptyText={t("mentorPortal.dashboard.noOpenActionItems")}
        />
      </Panel>
    </div>
  );
}
