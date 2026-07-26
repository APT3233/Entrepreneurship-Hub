import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { productStageOptions, startupStatusOptions } from "./components";

export default function ReportsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10, startup_status: "", product_stage: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const withAll = useCallback((items) => [
    { value: "", label: t("admin.ecosystem.common.all") },
    ...items.map((item) => ({ ...item, label: t(`status.${item.value}`) || item.label })),
  ], [t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await IncubationApi.startupReports(query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("admin.ecosystem.reports.loadError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  const columns = useMemo(() => [
    { key: "startup_name", label: t("admin.ecosystem.columns.startup"), width: 220, render: (row) => <button type="button" onClick={() => navigate(`/admin/incubation/startups/${row.id}`)} className="text-left font-black text-accent hover:underline">{row.startup_name}</button> },
    { key: "class_code", label: t("admin.ecosystem.columns.class"), width: 110, render: (row) => row.class_code || "-" },
    { key: "semester_code", label: t("admin.ecosystem.columns.semester"), width: 120, render: (row) => row.semester_code || "-" },
    { key: "category", label: t("admin.ecosystem.columns.category"), width: 140, render: (row) => row.category || "-" },
    { key: "current_stage_name", label: t("admin.ecosystem.columns.stage"), width: 160, render: (row) => row.current_stage_name || "-" },
    { key: "product_stage", label: t("admin.ecosystem.columns.product"), width: 120, render: (row) => <StatusBadge value={row.product_stage} /> },
    { key: "startup_status", label: t("admin.ecosystem.columns.status"), width: 120, render: (row) => <StatusBadge value={row.startup_status} /> },
    { key: "founder_count", label: t("admin.ecosystem.columns.founders"), width: 100 },
    { key: "milestone_count", label: t("admin.ecosystem.columns.milestones"), width: 110 },
    { key: "events_joined", label: t("admin.ecosystem.columns.events"), width: 90 },
    { key: "awards_count", label: t("admin.ecosystem.columns.awards"), width: 90 },
    { key: "partner_connections", label: t("admin.ecosystem.columns.partners"), width: 100 },
    { key: "actions", label: "", width: 80, render: (row) => <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/admin/incubation/startups/${row.id}`); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"><Eye size={16} /></button> },
  ], [navigate, t]);

  return (
    <>
      <FilterBar>
        <SearchInput value={query.search || ""} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.ecosystem.reports.searchPlaceholder")} />
        <FilterSelect label={t("filterLabels.status")} value={query.startup_status} onChange={(startup_status) => setQuery((prev) => ({ ...prev, page: 1, startup_status }))} options={withAll(startupStatusOptions)} />
        <FilterSelect label={t("admin.ecosystem.columns.product")} value={query.product_stage} onChange={(product_stage) => setQuery((prev) => ({ ...prev, page: 1, product_stage }))} options={withAll(productStageOptions)} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.ecosystem.reports.emptyText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} onRowClick={(row) => navigate(`/admin/incubation/startups/${row.id}`)} />
    </>
  );
}
