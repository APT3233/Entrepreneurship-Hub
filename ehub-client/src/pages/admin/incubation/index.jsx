import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Eye, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import { productStageOptions, sourceOptions, startupStatusOptions, StartupLogo } from "./components";

export default function StartupPoolPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [stages, setStages] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", status: "", product_stage: "", pipeline_stage_id: "", source: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);

  const withAll = useCallback((items) => [
    { value: "", label: t("admin.ecosystem.common.all") },
    ...items.map((item) => (typeof item === "string"
      ? { value: item, label: t(`status.${item}`) || item }
      : { ...item, label: t(`status.${item.value}`) || item.label })),
  ], [t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [startupRes, stageRes] = await Promise.all([
        IncubationApi.listStartups(query),
        IncubationApi.listStages({ limit: 100, status: "active" }),
      ]);
      setRows(startupRes?.data || []);
      setMeta(startupRes?.meta || null);
      setStages(stageRes?.data || []);
    } catch (err) {
      setError(err.message || t("admin.ecosystem.startupPool.loadError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  const archiveStartup = async () => {
    if (!confirm) return;
    try {
      await IncubationApi.updateStartup(confirm.id, { startup_status: "archived" });
      toast.success(t("admin.ecosystem.startupPool.archived"));
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.startupPool.archiveError"));
    }
  };

  const stageOptions = useMemo(() => [{ value: "", label: t("admin.ecosystem.common.all") }, ...stages.map((stage) => ({ value: String(stage.id), label: stage.name }))], [stages, t]);
  const columns = useMemo(() => [
    { key: "logo", label: t("admin.ecosystem.columns.logo"), width: 72, render: (row) => <StartupLogo startup={row} /> },
    { key: "startup_name", label: t("admin.ecosystem.columns.startup"), width: 210, render: (row) => <button type="button" onClick={() => navigate(`/admin/incubation/startups/${row.id}`)} className="text-left font-black text-slate-900 hover:text-accent">{row.startup_name}</button> },
    { key: "source", label: t("admin.ecosystem.columns.source"), width: 150, render: (row) => <StatusBadge value={row.source} /> },
    { key: "class_code", label: t("admin.ecosystem.columns.class"), width: 110, render: (row) => row.class_code || "-" },
    { key: "semester_code", label: t("admin.ecosystem.columns.semester"), width: 120, render: (row) => row.semester_code || "-" },
    { key: "category", label: t("admin.ecosystem.columns.category"), width: 150, render: (row) => row.category || row.industry || "-" },
    { key: "product_stage", label: t("admin.ecosystem.columns.product"), width: 120, render: (row) => <StatusBadge value={row.product_stage} /> },
    { key: "startup_status", label: t("admin.ecosystem.columns.status"), width: 130, render: (row) => <StatusBadge value={row.startup_status} /> },
    { key: "current_stage_name", label: t("admin.ecosystem.columns.pipeline"), width: 160, render: (row) => row.current_stage_name || "-" },
    { key: "selected_score", label: t("admin.ecosystem.columns.score"), width: 90, render: (row) => row.selected_score ?? "-" },
    { key: "selected_by_name", label: t("admin.ecosystem.columns.selectedBy"), width: 160, render: (row) => row.selected_by_name || "-" },
    { key: "selected_at", label: t("admin.ecosystem.columns.selected"), width: 140, render: (row) => formatDate(row.selected_at) },
    { key: "updated_at", label: t("admin.ecosystem.columns.updated"), width: 140, render: (row) => formatDate(row.updated_at) },
    { key: "actions", label: "", width: 110, render: (row) => <div className="flex justify-end gap-1"><button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/admin/incubation/startups/${row.id}`); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"><Eye size={16} /></button>{row.startup_status !== "archived" ? <button type="button" onClick={(e) => { e.stopPropagation(); setConfirm(row); }} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Archive size={16} /></button> : null}</div> },
  ], [navigate, t]);

  return (
    <>
      <FilterBar right={<button type="button" onClick={() => navigate("/admin/incubation/startups/create")} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-hover"><Plus size={16} /> {t("admin.ecosystem.startupPool.createBtn")}</button>}>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.ecosystem.startupPool.searchPlaceholder")} />
        <FilterSelect label={t("filterLabels.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={withAll(startupStatusOptions)} />
        <FilterSelect label={t("admin.ecosystem.columns.product")} value={query.product_stage} onChange={(product_stage) => setQuery((prev) => ({ ...prev, page: 1, product_stage }))} options={withAll(productStageOptions)} />
        <FilterSelect label={t("admin.ecosystem.columns.stage")} value={query.pipeline_stage_id} onChange={(pipeline_stage_id) => setQuery((prev) => ({ ...prev, page: 1, pipeline_stage_id }))} options={stageOptions} />
        <FilterSelect label={t("filterLabels.source")} value={query.source} onChange={(source) => setQuery((prev) => ({ ...prev, page: 1, source }))} options={withAll(sourceOptions)} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.ecosystem.startupPool.emptyText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} onRowClick={(row) => navigate(`/admin/incubation/startups/${row.id}`)} />
      <ConfirmDialog isOpen={!!confirm} title={t("admin.ecosystem.startupPool.archiveTitle")} subtitle={confirm ? confirm.startup_name : ""} variant="archive" color="red" yesLabel={t("admin.ecosystem.common.archive")} noLabel={t("admin.ecosystem.common.cancel")} onYes={archiveStartup} onNo={() => setConfirm(null)} onClose={() => setConfirm(null)} />
    </>
  );
}
