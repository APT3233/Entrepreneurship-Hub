import { useCallback, useEffect, useMemo, useState } from "react";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function MentoringFeedbacksPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "" });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await MentorWorkflowApi.adminFeedbacks(query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("admin.mentorWorkflow.feedbacks.loadError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);
  useEffect(() => { load(); }, [load]);
  const columns = useMemo(() => [
    { key: "session_title", label: t("admin.mentorWorkflow.feedbacks.columns.session"), render: (row) => <span className="font-black text-slate-900">{row.session_title}</span> },
    { key: "group_name", label: t("admin.mentorWorkflow.feedbacks.columns.group") },
    { key: "mentor_name", label: t("admin.mentorWorkflow.feedbacks.columns.mentor") },
    { key: "from_role", label: t("admin.mentorWorkflow.feedbacks.columns.from"), render: (row) => <StatusBadge value={row.from_role} /> },
    { key: "rating", label: t("admin.mentorWorkflow.feedbacks.columns.rating"), render: (row) => row.rating || "-" },
    { key: "feedback", label: t("admin.mentorWorkflow.feedbacks.columns.feedback"), render: (row) => row.feedback || "-" },
    { key: "created_at", label: t("admin.mentorWorkflow.feedbacks.columns.created"), render: (row) => formatDate(row.created_at) },
  ], [t]);
  return (
    <>
      <FilterBar>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.mentorWorkflow.feedbacks.searchPlaceholder")} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.mentorWorkflow.feedbacks.emptyText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} />
    </>
  );
}
