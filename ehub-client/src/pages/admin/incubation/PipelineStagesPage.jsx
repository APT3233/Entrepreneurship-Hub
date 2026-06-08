import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import IncubationApi from "@/api/incubation";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { SelectField } from "./components";

const emptyStage = { code: "", name: "", description: "", order_index: 0, is_final: false, status: "active" };

export default function PipelineStagesPage() {
  const toast = useToast();
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyStage);
  const [saving, setSaving] = useState(false);

  const statusOptions = useMemo(() => [
    { value: "", label: t("admin.ecosystem.common.all") },
    { value: "active", label: t("status.active") },
    { value: "inactive", label: t("status.inactive") },
  ], [t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await IncubationApi.listStages(query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("admin.ecosystem.pipelineStages.loadError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(emptyStage); setModalOpen(true); };
  const openEdit = (row) => { setForm({ ...row, is_final: Boolean(row.is_final) }); setModalOpen(true); };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (form.id) await IncubationApi.updateStage(form.id, form);
      else await IncubationApi.createStage(form);
      toast.success(t("admin.ecosystem.pipelineStages.saved"));
      setModalOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.pipelineStages.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => [
    { key: "code", label: t("admin.ecosystem.columns.code"), render: (row) => <span className="font-mono font-bold text-slate-900">{row.code}</span> },
    { key: "name", label: t("admin.ecosystem.columns.name") },
    { key: "order_index", label: t("admin.ecosystem.columns.order"), width: 90 },
    { key: "is_final", label: t("admin.ecosystem.columns.final"), width: 90, render: (row) => <StatusBadge value={Boolean(row.is_final)} /> },
    { key: "status", label: t("admin.ecosystem.columns.status"), width: 120, render: (row) => <StatusBadge value={row.status} /> },
    { key: "usage_count", label: t("admin.ecosystem.columns.usage"), width: 90 },
    { key: "actions", label: "", width: 90, render: (row) => <button type="button" onClick={() => openEdit(row)} className="rounded-lg px-3 py-1.5 text-sm font-bold text-indigo-700 hover:bg-indigo-50">{t("admin.ecosystem.columns.edit")}</button> },
  ], [t]);

  return (
    <>
      <FilterBar right={<button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"><Plus size={16} /> {t("admin.ecosystem.pipelineStages.createBtn")}</button>}>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.ecosystem.pipelineStages.searchPlaceholder")} />
        <FilterSelect label={t("filterLabels.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={statusOptions} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.ecosystem.pipelineStages.emptyText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} />
      <FormModal open={modalOpen} title={form.id ? t("admin.ecosystem.pipelineStages.editTitle") : t("admin.ecosystem.pipelineStages.createTitle")} submitLabel={t("admin.ecosystem.common.save")} saving={saving} onClose={() => setModalOpen(false)} onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label={t("admin.ecosystem.pipelineStages.fields.code")}><input required className={inputClass} value={form.code || ""} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} /></Field><Field label={t("admin.ecosystem.pipelineStages.fields.name")}><input required className={inputClass} value={form.name || ""} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} /></Field><Field label={t("admin.ecosystem.pipelineStages.fields.order")}><input type="number" min="0" className={inputClass} value={form.order_index ?? 0} onChange={(e) => setForm((prev) => ({ ...prev, order_index: Number(e.target.value || 0) }))} /></Field><Field label={t("admin.ecosystem.columns.status")}><SelectField value={form.status || "active"} onChange={(status) => setForm((prev) => ({ ...prev, status }))} options={[{ value: "active", label: t("status.active") }, { value: "inactive", label: t("status.inactive") }]} /></Field><label className="mt-7 flex items-center gap-2 text-sm font-bold text-slate-700"><input type="checkbox" checked={Boolean(form.is_final)} onChange={(e) => setForm((prev) => ({ ...prev, is_final: e.target.checked }))} /> {t("admin.ecosystem.pipelineStages.finalStage")}</label><div className="sm:col-span-2"><Field label={t("admin.ecosystem.common.description")}><textarea className={inputClass} rows={4} value={form.description || ""} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} /></Field></div></div>
      </FormModal>
    </>
  );
}
