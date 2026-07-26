import { useEffect, useState } from "react";
import MentorAnalyticsApi from "@/api/mentorAnalytics";
import { useTranslation } from "@/context/TranslationContext";
import { MetricsGrid, Panel, SimpleList } from "./components";

export default function MentorAnalyticsOverviewPage() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState(null);
  const [ecosystem, setEcosystem] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([MentorAnalyticsApi.overview(), MentorAnalyticsApi.ecosystem()])
      .then(([overviewRes, ecosystemRes]) => { if (mounted) { setOverview(overviewRes?.data || {}); setEcosystem(ecosystemRes?.data || {}); } })
      .catch((err) => mounted && setError(err.message || t("admin.mentorAnalytics.loadError")))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [t]);
  if (loading) return <div className="rounded-card bg-surface p-8 text-center text-sm text-slate-400">{t("common.loading")}...</div>;
  if (error) return <div className="rounded-card bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  return (
    <div className="space-y-5">
      <MetricsGrid items={[
        { label: t("admin.mentorAnalytics.overview.totalMentors"), value: overview?.total_mentors },
        { label: t("admin.mentorAnalytics.overview.activeMentors"), value: overview?.active_mentors },
        { label: t("admin.mentorAnalytics.overview.pendingMentors"), value: overview?.pending_mentors },
        { label: t("admin.mentorAnalytics.overview.businessMentors"), value: overview?.business_mentors },
        { label: t("admin.mentorAnalytics.overview.technicalMentors"), value: overview?.technical_mentors },
        { label: t("admin.mentorAnalytics.overview.activeAssignments"), value: overview?.active_assignments },
        { label: t("admin.mentorAnalytics.overview.completedSessions"), value: overview?.completed_sessions },
        { label: t("admin.mentorAnalytics.overview.mentoringHours"), value: overview?.total_mentoring_hours },
        { label: t("admin.mentorAnalytics.overview.averageRating"), value: overview?.average_mentor_rating ?? "-" },
        { label: t("admin.mentorAnalytics.overview.groupsWithoutMentor"), value: overview?.groups_without_mentor },
        { label: t("admin.mentorAnalytics.overview.groupsWithoutSession"), value: overview?.groups_without_session },
      ]} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={t("admin.mentorAnalytics.overview.mentorsByOrganization")}><SimpleList items={ecosystem?.mentors_by_organization || []} labelKey="organization" /></Panel>
        <Panel title={t("admin.mentorAnalytics.overview.mentorsByType")}><SimpleList items={ecosystem?.mentors_by_type || []} labelKey="mentor_type" /></Panel>
        <Panel title={t("admin.mentorAnalytics.overview.mentorsByStatus")}><SimpleList items={ecosystem?.mentors_by_status || []} labelKey="status" /></Panel>
      </div>
    </div>
  );
}
