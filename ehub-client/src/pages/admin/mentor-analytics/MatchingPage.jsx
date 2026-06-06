import { useEffect, useState } from "react";
import MentorAnalyticsApi from "@/api/mentorAnalytics";
import { MetricsGrid, Panel, SimpleList } from "./components";

export default function MentorMatchingAnalyticsPage() {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { let mounted = true; MentorAnalyticsApi.matching().then((res) => mounted && setData(res?.data || {})).catch((err) => mounted && setError(err.message || "Unable to load matching analytics")).finally(() => mounted && setLoading(false)); return () => { mounted = false; }; }, []);
  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">Loading...</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  return <div className="space-y-5"><MetricsGrid items={[{ label: "Matching requests", value: data?.total_matching_requests }, { label: "Generated suggestions", value: data?.generated_suggestions }, { label: "Converted", value: data?.suggestions_converted_to_assignments }, { label: "Conversion rate", value: `${Number(data?.conversion_rate || 0)}%` }, { label: "Average score", value: data?.average_matching_score ? Number(data.average_matching_score).toFixed(1) : "-" }, { label: "AI suggestions", value: data?.ai_suggestions }, { label: "Rule-based", value: data?.rule_based_suggestions }, { label: "Hybrid", value: data?.hybrid_suggestions }]} /><div className="grid gap-4 lg:grid-cols-2"><Panel title="Top expertise requested"><SimpleList items={data?.top_expertise_requested || []} labelKey="name" valueKey="demand_count" /></Panel><Panel title="Preferred mentor types"><SimpleList items={data?.most_matched_mentor_types || []} labelKey="preferred_mentor_type" /></Panel></div></div>;
}
