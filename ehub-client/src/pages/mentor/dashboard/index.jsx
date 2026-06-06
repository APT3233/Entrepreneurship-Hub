import { useEffect, useState } from "react";
import MentorAnalyticsApi from "@/api/mentorAnalytics";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { MetricsGrid, Panel } from "@/pages/admin/mentor-analytics/components";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function MentorDashboardPage() {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { let mounted = true; MentorAnalyticsApi.mentorDashboard().then((res) => mounted && setData(res?.data || {})).catch((err) => mounted && setError(err.message || "Unable to load dashboard")).finally(() => mounted && setLoading(false)); return () => { mounted = false; }; }, []);
  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">Loading...</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  const metrics = data?.metrics || {};
  return <div className="space-y-5"><MetricsGrid items={[{ label: "Assigned groups", value: data?.assignments?.length }, { label: "Upcoming sessions", value: metrics.upcoming_sessions }, { label: "Completed sessions", value: metrics.completed_sessions }, { label: "Total hours", value: metrics.total_hours }, { label: "Average rating", value: metrics.average_rating ? Number(metrics.average_rating).toFixed(1) : "-" }]} /><Panel title="Assigned groups"><AdminTable columns={[{ key: "group_name", label: "Group" }, { key: "topic", label: "Topic" }, { key: "class_code", label: "Class" }, { key: "assignment_type", label: "Type", render: (row) => <StatusBadge value={row.assignment_type} /> }, { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> }]} rows={data?.assignments || []} emptyText="No assignments" /></Panel><Panel title="Open action items"><AdminTable columns={[{ key: "title", label: "Action item" }, { key: "group_name", label: "Group" }, { key: "session_title", label: "Session" }, { key: "due_date", label: "Due", render: (row) => formatDate(row.due_date) }, { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> }]} rows={data?.action_items || []} emptyText="No open action items" /></Panel></div>;
}
