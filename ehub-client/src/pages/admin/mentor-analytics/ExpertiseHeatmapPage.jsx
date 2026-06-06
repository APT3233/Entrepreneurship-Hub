import { useEffect, useMemo, useState } from "react";
import MentorAnalyticsApi from "@/api/mentorAnalytics";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";

export default function ExpertiseHeatmapPage() {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { let mounted = true; MentorAnalyticsApi.expertise().then((res) => mounted && setRows(res?.data || [])).catch((err) => mounted && setError(err.message || "Unable to load expertise heatmap")).finally(() => mounted && setLoading(false)); return () => { mounted = false; }; }, []);
  const columns = useMemo(() => [
    { key: "name", label: "Expertise", render: (row) => <span className="font-black text-slate-900">{row.name}</span> },
    { key: "category", label: "Category", render: (row) => <StatusBadge value={row.category} /> },
    { key: "number_of_mentors", label: "Mentors" },
    { key: "demand_from_groups", label: "Demand" },
    { key: "assignment_count", label: "Assignments" },
    { key: "gap_status", label: "Gap", render: (row) => <StatusBadge value={row.gap_status} /> },
  ], []);
  return <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText="No expertise data" />;
}
