import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import { StartupLogo } from "./components";

export default function PipelinePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [stages, setStages] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", pipeline_stage_id: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [startupsRes, stagesRes] = await Promise.all([
        IncubationApi.listStartups(query),
        IncubationApi.listStages({ limit: 100, status: "active" }),
      ]);
      setRows(startupsRes?.data || []);
      setMeta(startupsRes?.meta || null);
      setStages(stagesRes?.data || []);
    } catch (err) {
      setError(err.message || t("admin.ecosystem.pipeline.loadError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  const stageOptions = useMemo(() => [{ value: "", label: t("admin.ecosystem.common.all") }, ...stages.map((stage) => ({ value: String(stage.id), label: stage.name }))], [stages, t]);
  const columns = useMemo(() => [
    { key: "logo", label: "", width: 64, render: (row) => <StartupLogo startup={row} /> },
    { key: "startup_name", label: t("admin.ecosystem.columns.startup"), render: (row) => <span className="font-black text-slate-900">{row.startup_name}</span> },
    { key: "current_stage_name", label: t("admin.ecosystem.columns.currentStage"), render: (row) => row.current_stage_name || t("admin.ecosystem.columns.noStage") },
    { key: "pipeline_status", label: t("admin.ecosystem.columns.entryStatus"), render: (row) => row.pipeline_status ? <StatusBadge value={row.pipeline_status} /> : "-" },
    { key: "startup_status", label: t("admin.ecosystem.columns.startupStatus"), render: (row) => <StatusBadge value={row.startup_status} /> },
    { key: "class_code", label: t("admin.ecosystem.columns.class"), render: (row) => row.class_code || "-" },
    { key: "pipeline_entered_at", label: t("admin.ecosystem.columns.entered"), render: (row) => formatDate(row.pipeline_entered_at) },
  ], [t]);

  return (
    <>
      <FilterBar>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.ecosystem.pipeline.searchPlaceholder")} />
        <FilterSelect label={t("admin.ecosystem.pipeline.filterStage")} value={query.pipeline_stage_id} onChange={(pipeline_stage_id) => setQuery((prev) => ({ ...prev, page: 1, pipeline_stage_id }))} options={stageOptions} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.ecosystem.pipeline.emptyText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} onRowClick={(row) => navigate(`/admin/incubation/startups/${row.id}?tab=pipeline`)} />
    </>
  );
}
