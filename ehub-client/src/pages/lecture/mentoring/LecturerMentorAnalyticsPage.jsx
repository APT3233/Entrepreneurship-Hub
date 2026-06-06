import { useEffect, useState } from "react";
import MentorAnalyticsApi from "@/api/mentorAnalytics";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { MetricsGrid, Panel } from "@/pages/admin/mentor-analytics/components";

export default function LecturerMentorAnalyticsPage() {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { let mounted = true; MentorAnalyticsApi.lecturerDashboard().then((res) => mounted && setData(res?.data || {})).catch((err) => mounted && setError(err.message || "Unable to load mentor analytics")).finally(() => mounted && setLoading(false)); return () => { mounted = false; }; }, []);
  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">Loading...</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  const overview = data?.overview || {};
  return <div className="space-y-5"><MetricsGrid items={[{ label: "Active mentors", value: overview.active_mentors }, { label: "Active assignments", value: overview.active_assignments }, { label: "Completed sessions", value: overview.completed_sessions }, { label: "Mentoring hours", value: overview.total_mentoring_hours }, { label: "Groups without mentor", value: overview.groups_without_mentor }]} /><Panel title="Group support"><AdminTable columns={[{ key: "group_name", label: "Group" }, { key: "topic", label: "Topic" }, { key: "active_mentors", label: "Mentors" }, { key: "sessions_completed", label: "Sessions" }, { key: "support_status", label: "Status", render: (row) => <StatusBadge value={row.support_status} /> }]} rows={data?.group_support || []} emptyText="No group support data" /></Panel><Panel title="Mentor workload"><AdminTable columns={[{ key: "full_name", label: "Mentor" }, { key: "active_assignments", label: "Assignments" }, { key: "scheduled_sessions", label: "Scheduled" }, { key: "workload_status", label: "Workload", render: (row) => <StatusBadge value={row.workload_status} /> }]} rows={data?.workload || []} emptyText="No workload data" /></Panel></div>;
}
