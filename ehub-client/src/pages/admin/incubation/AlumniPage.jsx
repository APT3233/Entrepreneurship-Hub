import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import { useToast } from "@/components/ui/Toast";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { useTranslation } from "@/context/TranslationContext";
import { SelectField } from "./components";

const blankForm = { full_name: "", email: "", phone: "", graduation_year: "", major: "", campus: "", current_position: "", current_company: "", linkedin_url: "", bio: "", status: "active" };

export default function AlumniPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", status: "" });
  const [form, setForm] = useState(blankForm);
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const statusOptions = useMemo(() => [
    { value: "", label: t("admin.ecosystem.common.all") },
    ...["active", "inactive", "archived"].map((item) => ({ value: item, label: t(`status.${item}`) || item }))
  ], [t]);

  const formStatusOptions = useMemo(() => [
    ...["active", "inactive", "archived"].map((item) => ({ value: item, label: t(`status.${item}`) || item }))
  ], [t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await IncubationApi.listAlumni(query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("admin.ecosystem.alumni.toasts.loadError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.createAlumni({ ...form, graduation_year: form.graduation_year || null });
      toast.success(t("admin.ecosystem.alumni.toasts.created"));
      setModal(false);
      setForm(blankForm);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.alumni.toasts.createError"));
    } finally {
      setSaving(false);
    }
  };

  const deleteAlumni = async () => {
    if (!confirm) return;
    try {
      await IncubationApi.deleteAlumni(confirm.id);
      toast.success(t("admin.ecosystem.alumni.toasts.archived"));
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.alumni.toasts.archiveError"));
    }
  };

  const columns = useMemo(() => [
    { key: "full_name", label: t("admin.ecosystem.alumni.columns.alumni"), width: 220, render: (row) => <button type="button" onClick={() => navigate(`/admin/ecosystem/alumni/${row.id}`)} className="text-left font-black text-slate-900 hover:text-indigo-700">{row.full_name}</button> },
    { key: "graduation_year", label: t("admin.ecosystem.alumni.columns.graduation"), width: 120, render: (row) => row.graduation_year || "-" },
    { key: "major", label: t("admin.ecosystem.alumni.columns.major"), width: 160, render: (row) => row.major || "-" },
    { key: "campus", label: t("admin.ecosystem.alumni.columns.campus"), width: 120, render: (row) => row.campus || "-" },
    { key: "current_position", label: t("admin.ecosystem.alumni.columns.position"), width: 180, render: (row) => row.current_position || "-" },
    { key: "current_company", label: t("admin.ecosystem.alumni.columns.company"), width: 180, render: (row) => row.current_company || "-" },
    { key: "linked_startups", label: t("admin.ecosystem.alumni.columns.startups"), width: 100 },
    { key: "status", label: t("admin.ecosystem.alumni.columns.status"), width: 120, render: (row) => <StatusBadge value={row.status} /> },
    { key: "actions", label: "", width: 96, render: (row) => <div className="flex justify-end gap-1"><button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/admin/ecosystem/alumni/${row.id}`); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"><Eye size={16} /></button><button type="button" onClick={(e) => { e.stopPropagation(); setConfirm(row); }} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button></div> },
  ], [navigate, t]);

  return (
    <>
      <FilterBar right={<button type="button" onClick={() => setModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"><Plus size={16} /> {t("admin.ecosystem.alumni.addBtn")}</button>}>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.ecosystem.alumni.searchPlaceholder")} />
        <FilterSelect label={t("admin.ecosystem.common.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={statusOptions} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.ecosystem.alumni.emptyText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} onRowClick={(row) => navigate(`/admin/ecosystem/alumni/${row.id}`)} />
      <FormModal open={modal} title={t("admin.ecosystem.alumni.modals.addAlumni")} submitLabel={t("admin.ecosystem.common.create")} saving={saving} onClose={() => setModal(false)} onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.ecosystem.alumni.fields.fullName")}><input required className={inputClass} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.email")}><input type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.phone")}><input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.graduationYear")}><input type="number" className={inputClass} value={form.graduation_year} onChange={(e) => set("graduation_year", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.major")}><input className={inputClass} value={form.major} onChange={(e) => set("major", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.campus")}><input className={inputClass} value={form.campus} onChange={(e) => set("campus", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.position")}><input className={inputClass} value={form.current_position} onChange={(e) => set("current_position", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.company")}><input className={inputClass} value={form.current_company} onChange={(e) => set("current_company", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.status")}><SelectField value={form.status || "active"} onChange={(status) => set("status", status)} options={formStatusOptions} /></Field>
          <div className="sm:col-span-2"><Field label={t("admin.ecosystem.alumni.fields.linkedin")}><input className={inputClass} value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} /></Field></div>
          <div className="sm:col-span-2"><Field label={t("admin.ecosystem.alumni.fields.bio")}><textarea rows={4} className={inputClass} value={form.bio} onChange={(e) => set("bio", e.target.value)} /></Field></div>
        </div>
      </FormModal>
      <ConfirmDialog isOpen={!!confirm} title={t("admin.ecosystem.alumni.dialogs.archiveTitle")} subtitle={confirm?.full_name || ""} variant="archive" color="red" yesLabel={t("admin.ecosystem.common.archive")} noLabel={t("admin.ecosystem.common.cancel")} onYes={deleteAlumni} onNo={() => setConfirm(null)} onClose={() => setConfirm(null)} />
    </>
  );
}
