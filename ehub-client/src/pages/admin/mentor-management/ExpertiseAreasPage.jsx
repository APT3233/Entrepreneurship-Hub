import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, SquarePen, Trash2 } from "lucide-react";
import AdminMentorApi from "@/api/adminMentors";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { expertiseCategoryOptions, Select } from "./components";

const emptyForm = { code: "", name: "", category: "business", description: "", status: "active" };

export default function ExpertiseAreasPage() {
  const toast = useToast();
  const { t } = useTranslation();
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", category: "", status: "" });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({ open: false, row: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await AdminMentorApi.getExpertiseAreas(query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("admin.mentors.expertiseAreas.loadError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(emptyForm); setModal({ open: true, row: null }); };
  const openEdit = (row) => { setForm({ code: row.code, name: row.name, category: row.category, description: row.description || "", status: row.status }); setModal({ open: true, row }); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.row) await AdminMentorApi.updateExpertiseArea(modal.row.id, form);
      else await AdminMentorApi.createExpertiseArea(form);
      toast.success(t("admin.mentors.expertiseAreas.saveSuccess"));
      setModal({ open: false, row: null });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.mentors.expertiseAreas.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteRow) return;
    try {
      await AdminMentorApi.deleteExpertiseArea(deleteRow.id);
      toast.success(t("admin.mentors.expertiseAreas.deleteSuccess"));
      setDeleteRow(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.mentors.expertiseAreas.deleteError"));
    }
  };

  const columns = useMemo(() => [
    { key: "code", label: t("admin.mentors.expertiseAreas.columns.code"), render: (row) => <span className="font-mono text-xs font-black text-slate-900">{row.code}</span> },
    { key: "name", label: t("admin.mentors.expertiseAreas.columns.name"), render: (row) => <span className="font-bold text-slate-900">{row.name}</span> },
    { key: "category", label: t("admin.mentors.expertiseAreas.columns.category"), render: (row) => <StatusBadge value={row.category} /> },
    { key: "description", label: t("admin.mentors.expertiseAreas.columns.description"), render: (row) => row.description || "—" },
    { key: "status", label: t("admin.mentors.expertiseAreas.columns.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "usage", label: t("admin.mentors.expertiseAreas.columns.usage"), render: (row) => Number(row.mentor_usage_count || 0) },
    { key: "actions", label: "", width: 120, render: (row) => <div className="flex justify-end gap-1"><button type="button" onClick={() => openEdit(row)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"><SquarePen size={16} /></button><button type="button" onClick={() => setDeleteRow(row)} disabled={Number(row.mentor_usage_count || 0) > 0} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-30"><Trash2 size={16} /></button></div> },
  ], [t]);

  const categoryOptions = useMemo(() => [
    { value: "", label: t("common.all") || "All" },
    ...expertiseCategoryOptions.map((opt) => ({ value: opt.value, label: t(`status.${opt.value}`) })),
  ], [t]);

  const statusFilterOptions = useMemo(() => [
    { value: "", label: t("common.all") || "All" },
    { value: "active", label: t("status.active") },
    { value: "inactive", label: t("status.inactive") },
  ], [t]);

  const statusFormOptions = useMemo(() => [
    { value: "active", label: t("status.active") },
    { value: "inactive", label: t("status.inactive") },
  ], [t]);

  const categoryFormOptions = useMemo(() => expertiseCategoryOptions.map((opt) => ({ value: opt.value, label: t(`status.${opt.value}`) })), [t]);

  return (
    <>
      <FilterBar right={<button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-hover"><Plus size={16} /> {t("admin.mentors.expertiseAreas.create")}</button>}>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.mentors.expertiseAreas.searchPlaceholder")} />
        <FilterSelect label={t("admin.mentors.expertiseAreas.columns.category")} value={query.category} onChange={(category) => setQuery((prev) => ({ ...prev, page: 1, category }))} options={categoryOptions} />
        <FilterSelect label={t("admin.mentors.expertiseAreas.columns.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={statusFilterOptions} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.mentors.emptyText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} />
      <FormModal open={modal.open} title={modal.row ? t("admin.mentors.expertiseAreas.modal.editTitle") : t("admin.mentors.expertiseAreas.modal.createTitle")} onClose={() => setModal({ open: false, row: null })} onSubmit={save} saving={saving}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.mentors.expertiseAreas.modal.code")}><input className={inputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></Field>
          <Field label={t("admin.mentors.expertiseAreas.modal.name")}><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label={t("admin.mentors.expertiseAreas.modal.category")}><Select value={form.category} onChange={(category) => setForm({ ...form, category })} options={categoryFormOptions} /></Field>
          <Field label={t("admin.mentors.expertiseAreas.modal.status")}><Select value={form.status} onChange={(status) => setForm({ ...form, status })} options={statusFormOptions} /></Field>
        </div>
        <div className="mt-4"><Field label={t("admin.mentors.expertiseAreas.modal.description")}><textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
      </FormModal>
      <ConfirmDialog isOpen={!!deleteRow} title={t("admin.mentors.expertiseAreas.deleteTitle")} subtitle={deleteRow?.name || ""} variant="delete" color="red" yesLabel={t("common.delete") || "Delete"} noLabel={t("common.cancel") || "Cancel"} onYes={remove} onNo={() => setDeleteRow(null)} onClose={() => setDeleteRow(null)} />
    </>
  );
}
