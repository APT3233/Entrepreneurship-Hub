import { useCallback, useEffect, useMemo, useState } from "react";
import IncubationApi from "@/api/incubation";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import Avatar from "@/components/ui/Avatar";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function LecturerNominationsPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const statusOptions = useMemo(() => [
    { value: "", label: t("admin.ecosystem.common.all") },
    ...["pending", "approved", "rejected", "needs_more_info"].map((item) => ({ value: item, label: t(`status.${item}`) || item })),
  ], [t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await IncubationApi.lecturerNominations(query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("lecturer.incubationPage.nominationsLoadError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  const columns = useMemo(() => [
    { key: "group_name", label: t("lecturer.incubationPage.columns.group"), render: (row) => (
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar name={row.group_name} />
        <span className="font-medium text-text-primary truncate">{row.group_name || "—"}</span>
      </div>
    ) },
    { key: "topic", label: t("lecturer.incubationPage.columns.topic"), render: (row) => row.topic || "-" },
    { key: "source_type", label: t("lecturer.incubationPage.columns.source"), render: (row) => <StatusBadge value={row.source_type} /> },
    { key: "potential_score", label: t("lecturer.incubationPage.columns.potential"), render: (row) => row.potential_score ?? "-" },
    { key: "review_status", label: t("common.status"), render: (row) => <StatusBadge value={row.review_status} /> },
    { key: "review_note", label: t("lecturer.incubationPage.columns.reviewNote"), render: (row) => row.review_note || "-" },
    { key: "created_at", label: t("lecturer.incubationPage.columns.created"), render: (row) => formatDate(row.created_at) },
  ], [t]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">{t("lecturer.incubation")}</h1>
        <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
          Xét duyệt các nhóm được đề cử vào chương trình ươm tạo khởi nghiệp.
        </p>
      </div>
      <FilterBar>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("lecturer.incubationPage.searchNominations")} />
        <FilterSelect label={t("filterLabels.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={statusOptions} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("lecturer.incubationPage.emptyNominations")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} />
    </div>
  );
}
