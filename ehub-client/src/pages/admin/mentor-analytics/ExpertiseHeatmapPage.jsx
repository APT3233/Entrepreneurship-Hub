import { useEffect, useMemo, useState } from "react";
import MentorAnalyticsApi from "@/api/mentorAnalytics";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";

export default function ExpertiseHeatmapPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => {
    let mounted = true;
    MentorAnalyticsApi.expertise()
      .then((res) => mounted && setRows(res?.data || []))
      .catch((err) => mounted && setError(err.message || t("admin.mentorAnalytics.expertise.loadError")))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [t]);
  const columns = useMemo(() => [
    { key: "name", label: t("admin.mentorAnalytics.expertise.columns.expertise"), render: (row) => <span className="font-black text-slate-900">{row.name}</span> },
    { key: "category", label: t("admin.mentorAnalytics.expertise.columns.category"), render: (row) => <StatusBadge value={row.category} /> },
    { key: "number_of_mentors", label: t("admin.mentorAnalytics.expertise.columns.mentors") },
    { key: "demand_from_groups", label: t("admin.mentorAnalytics.expertise.columns.demand") },
    { key: "assignment_count", label: t("admin.mentorAnalytics.expertise.columns.assignments") },
    { key: "gap_status", label: t("admin.mentorAnalytics.expertise.columns.gap"), render: (row) => <StatusBadge value={row.gap_status} /> },
  ], [t]);
  return <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.mentorAnalytics.expertise.emptyText")} />;
}
