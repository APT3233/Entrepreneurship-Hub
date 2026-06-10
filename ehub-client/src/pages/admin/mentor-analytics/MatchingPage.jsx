import { useEffect, useState } from "react";
import MentorAnalyticsApi from "@/api/mentorAnalytics";
import { useTranslation } from "@/context/TranslationContext";
import { MetricsGrid, Panel, SimpleList } from "./components";

export default function MentorMatchingAnalyticsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => {
    let mounted = true;
    MentorAnalyticsApi.matching()
      .then((res) => mounted && setData(res?.data || {}))
      .catch((err) => mounted && setError(err.message || t("admin.mentorAnalytics.matching.loadError")))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [t]);
  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">{t("common.loading")}...</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  return (
    <div className="space-y-5">
      <MetricsGrid items={[
        { label: t("admin.mentorAnalytics.matching.matchingRequests"), value: data?.total_matching_requests },
        { label: t("admin.mentorAnalytics.matching.generatedSuggestions"), value: data?.generated_suggestions },
        { label: t("admin.mentorAnalytics.matching.converted"), value: data?.suggestions_converted_to_assignments },
        { label: t("admin.mentorAnalytics.matching.conversionRate"), value: `${Number(data?.conversion_rate || 0)}%` },
        { label: t("admin.mentorAnalytics.matching.averageScore"), value: data?.average_matching_score ? Number(data.average_matching_score).toFixed(1) : "-" },
        { label: t("admin.mentorAnalytics.matching.aiSuggestions"), value: data?.ai_suggestions },
        { label: t("admin.mentorAnalytics.matching.ruleBased"), value: data?.rule_based_suggestions },
        { label: t("admin.mentorAnalytics.matching.hybrid"), value: data?.hybrid_suggestions },
      ]} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t("admin.mentorAnalytics.matching.topExpertise")}><SimpleList items={data?.top_expertise_requested || []} labelKey="name" valueKey="demand_count" /></Panel>
        <Panel title={t("admin.mentorAnalytics.matching.preferredTypes")}><SimpleList items={data?.most_matched_mentor_types || []} labelKey="preferred_mentor_type" /></Panel>
      </div>
    </div>
  );
}
