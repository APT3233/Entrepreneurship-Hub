import { useCallback, useEffect, useMemo, useState } from "react";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";

const actionItemStatusValues = ["open", "in_progress", "done", "cancelled"];

export default function MentoringActionItemsPage() {
  const { t } = useTranslation();
  const statusOptions = useMemo(() => actionItemStatusValues.map((value) => ({ value, label: t(`status.${value}`) })), [t]);
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", status: "" });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await MentorWorkflowApi.adminActionItems(query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("admin.mentorWorkflow.actionItems.loadError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);
  useEffect(() => { load(); }, [load]);
  const columns = useMemo(() => [
    { key: "title", label: t("admin.mentorWorkflow.actionItems.columns.title"), render: (row) => <span className="font-black text-slate-900">{row.title}</span> },
    { key: "session_title", label: t("admin.mentorWorkflow.actionItems.columns.session") },
    { key: "group_name", label: t("admin.mentorWorkflow.actionItems.columns.group") },
    { key: "assigned_to_name", label: t("admin.mentorWorkflow.actionItems.columns.assignedTo"), render: (row) => row.assigned_to_name || "-" },
    { key: "due_date", label: t("admin.mentorWorkflow.actionItems.columns.due"), render: (row) => formatDate(row.due_date) },
    { key: "status", label: t("admin.mentorWorkflow.actionItems.columns.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "created_at", label: t("admin.mentorWorkflow.actionItems.columns.created"), render: (row) => formatDate(row.created_at) },
  ], [t]);
  return (
    <>
      <FilterBar>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.mentorWorkflow.actionItems.searchPlaceholder")} />
        <FilterSelect label={t("admin.mentorWorkflow.actionItems.columns.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={[{ value: "", label: t("common.all") }, ...statusOptions]} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.mentorWorkflow.actionItems.emptyText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} />
    </>
  );
}
