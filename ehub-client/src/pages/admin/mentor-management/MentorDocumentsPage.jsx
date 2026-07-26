import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import AdminMentorApi from "@/api/adminMentors";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import { documentTypeOptions } from "./components";

export default function MentorDocumentsPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", document_type: "" });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await AdminMentorApi.getAllDocuments(query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("admin.mentors.loadError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  const columns = useMemo(() => [
    { key: "mentor_name", label: t("admin.mentors.mentor"), render: (row) => <span className="font-bold text-slate-900">{row.mentor_name}</span> },
    { key: "mentor_email", label: t("admin.mentors.email") },
    { key: "document_type", label: t("admin.mentors.documentsTab.type"), render: (row) => <StatusBadge value={row.document_type} /> },
    { key: "file_name", label: t("admin.mentors.documentsTab.file") },
    { key: "file_size", label: t("admin.mentors.documentsTab.size"), render: (row) => row.file_size ? `${Math.round(row.file_size / 1024)} KB` : "—" },
    { key: "uploaded_by_name", label: t("admin.mentors.documentsTab.uploadedBy"), render: (row) => row.uploaded_by_name || "—" },
    { key: "created_at", label: t("admin.mentors.documentsTab.created"), render: (row) => formatDate(row.created_at) },
    { key: "actions", label: "", width: 80, render: (row) => <a href={row.file_url} target="_blank" rel="noreferrer" className="inline-flex rounded-lg p-2 text-accent hover:bg-accent-bg"><ExternalLink size={16} /></a> },
  ], [t]);

  const typeOptions = useMemo(() => [
    { value: "", label: t("common.all") || "All" },
    ...documentTypeOptions.map((opt) => ({ value: opt.value, label: t(`status.${opt.value}`) })),
  ], [t]);

  return (
    <>
      <FilterBar>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.mentors.documentsTab.searchPlaceholder")} />
        <FilterSelect label={t("admin.mentors.documentsTab.type")} value={query.document_type} onChange={(document_type) => setQuery((prev) => ({ ...prev, page: 1, document_type }))} options={typeOptions} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.mentors.documentsTab.noDocuments")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} />
    </>
  );
}
