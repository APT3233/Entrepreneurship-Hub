import { useEffect, useState } from "react";
import { Users, Handshake, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import MentorAnalyticsApi from "@/api/mentorAnalytics";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import PageHero from "@/components/ui/PageHero";
import Avatar from "@/components/ui/Avatar";

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
  if (loading) return <div className="rounded-card bg-surface shadow-card p-8 text-center text-sm text-text-muted">{t("common.loading")}</div>;
  if (error) return <div className="rounded-card bg-danger-bg p-8 text-center text-sm font-semibold text-danger-text">{error}</div>;
  const overview = data?.overview || {};
  return (
    <div className="space-y-6">
      <PageHero
        title={t("lecturer.mentorAnalytics")}
        subtitle="Theo dõi khối lượng mentor, tiến độ mentoring và nhóm cần hỗ trợ."
        kpiCols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
        kpis={[
          { label: t("lecturer.mentoringPage.metrics.activeMentors"), value: overview.active_mentors ?? "—", icon: Users, tone: "blue" },
          { label: t("lecturer.mentoringPage.metrics.activeAssignments"), value: overview.active_assignments ?? "—", icon: Handshake, tone: "accent" },
          { label: t("lecturer.mentoringPage.metrics.completedSessions"), value: overview.completed_sessions ?? "—", icon: CheckCircle2, tone: "green" },
          { label: t("lecturer.mentoringPage.metrics.mentoringHours"), value: overview.total_mentoring_hours ?? "—", icon: Clock, tone: "amber" },
          { label: t("lecturer.mentoringPage.metrics.groupsWithoutMentor"), value: overview.groups_without_mentor ?? "—", icon: AlertTriangle, tone: "red" },
        ]}
      />
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-text-primary">{t("lecturer.mentoringPage.panels.groupSupport")}</h2>
        <AdminTable columns={[
          { key: "group_name", label: t("lecturer.mentoringPage.columns.group"), render: (row) => (
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={row.group_name} />
              <span className="font-medium text-text-primary truncate">{row.group_name || "—"}</span>
            </div>
          ) },
          { key: "topic", label: t("lecturer.mentoringPage.columns.topic") },
          { key: "active_mentors", label: t("lecturer.mentoringPage.columns.mentors") },
          { key: "sessions_completed", label: t("lecturer.mentoringPage.columns.sessions") },
          { key: "support_status", label: t("lecturer.mentoringPage.columns.status"), render: (row) => <StatusBadge value={row.support_status} /> },
        ]} rows={data?.group_support || []} emptyText={t("lecturer.mentoringPage.emptyGroupSupport")} />
      </div>
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-text-primary">{t("lecturer.mentoringPage.panels.mentorWorkload")}</h2>
        <AdminTable columns={[
          { key: "full_name", label: t("lecturer.mentoringPage.columns.mentor"), render: (row) => (
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={row.full_name} />
              <span className="font-medium text-text-primary truncate">{row.full_name || "—"}</span>
            </div>
          ) },
          { key: "active_assignments", label: t("lecturer.mentoringPage.columns.assignments") },
          { key: "scheduled_sessions", label: t("lecturer.mentoringPage.columns.scheduled") },
          { key: "workload_status", label: t("lecturer.mentoringPage.columns.workload"), render: (row) => <StatusBadge value={row.workload_status} /> },
        ]} rows={data?.workload || []} emptyText={t("lecturer.mentoringPage.emptyWorkload")} />
      </div>
    </div>
  );
}
