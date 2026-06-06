import { useEffect, useState } from "react";
import MentorAnalyticsApi from "@/api/mentorAnalytics";
import { MetricsGrid, Panel, SimpleList } from "./components";

export default function MentorAnalyticsOverviewPage() {
  const [overview, setOverview] = useState(null);
  const [ecosystem, setEcosystem] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([MentorAnalyticsApi.overview(), MentorAnalyticsApi.ecosystem()])
      .then(([overviewRes, ecosystemRes]) => { if (mounted) { setOverview(overviewRes?.data || {}); setEcosystem(ecosystemRes?.data || {}); } })
      .catch((err) => mounted && setError(err.message || "Unable to load mentor analytics"))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);
  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">Loading...</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  return (
    <div className="space-y-5">
      <MetricsGrid items={[
        { label: "Total mentors", value: overview?.total_mentors },
        { label: "Active mentors", value: overview?.active_mentors },
        { label: "Pending mentors", value: overview?.pending_mentors },
        { label: "Business mentors", value: overview?.business_mentors },
        { label: "Technical mentors", value: overview?.technical_mentors },
        { label: "Active assignments", value: overview?.active_assignments },
        { label: "Completed sessions", value: overview?.completed_sessions },
        { label: "Mentoring hours", value: overview?.total_mentoring_hours },
        { label: "Average rating", value: overview?.average_mentor_rating ?? "-" },
        { label: "Groups without mentor", value: overview?.groups_without_mentor },
        { label: "Groups without session", value: overview?.groups_without_session },
      ]} />
      <div className="grid gap-4 lg:grid-cols-3"><Panel title="Mentors by organization"><SimpleList items={ecosystem?.mentors_by_organization || []} labelKey="organization" /></Panel><Panel title="Mentors by type"><SimpleList items={ecosystem?.mentors_by_type || []} labelKey="mentor_type" /></Panel><Panel title="Mentors by status"><SimpleList items={ecosystem?.mentors_by_status || []} labelKey="status" /></Panel></div>
    </div>
  );
}
