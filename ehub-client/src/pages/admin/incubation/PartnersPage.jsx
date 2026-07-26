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
import { SelectField, visibilityOptions } from "./components";
import { useTranslation } from "@/context/TranslationContext";

const blankForm = { partner_name: "", partner_type: "company", contact_person: "", contact_email: "", contact_phone: "", website_url: "", description: "", focus_areas: "", status: "active", visibility: "internal" };

export default function PartnersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", partner_type: "", status: "" });
  const [form, setForm] = useState(blankForm);
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const partnerTypeOptions = useMemo(() => [
    "company", "incubator", "accelerator", "investor_fund", "angel_investor", "university", "government", "ngo", "community", "other"
  ].map((value) => ({ value, label: t(`status.${value}`) || value })), [t]);

  const statusOptions = useMemo(() => [
    "active", "inactive", "archived"
  ].map((value) => ({ value, label: t(`status.${value}`) || value })), [t]);

  const visibilitySelectOptions = useMemo(() => {
    return visibilityOptions.map((o) => ({ ...o, label: t(`status.${o.value}`) || o.label }));
  }, [t]);

  const withAll = (items) => [{ value: "", label: t("admin.ecosystem.common.all") }, ...items];

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await IncubationApi.listPartners(query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("admin.ecosystem.partners.toasts.loadError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const payload = () => ({ ...form, focus_areas: String(form.focus_areas || "").split(",").map((item) => item.trim()).filter(Boolean) });

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.createPartner(payload());
      toast.success(t("admin.ecosystem.partners.toasts.created"));
      setModal(false);
      setForm(blankForm);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.partners.toasts.createError"));
    } finally {
      setSaving(false);
    }
  };

  const deletePartner = async () => {
    if (!confirm) return;
    try {
      await IncubationApi.deletePartner(confirm.id);
      toast.success(t("admin.ecosystem.partners.toasts.archived"));
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.partners.toasts.archiveError"));
    }
  };

  const columns = useMemo(() => [
    { key: "partner_name", label: t("admin.ecosystem.partners.columns.partner"), width: 220, render: (row) => <button type="button" onClick={() => navigate(`/admin/ecosystem/partners/${row.id}`)} className="text-left font-black text-slate-900 hover:text-accent">{row.partner_name}</button> },
    { key: "partner_type", label: t("admin.ecosystem.partners.columns.type"), width: 150, render: (row) => <StatusBadge value={row.partner_type} /> },
    { key: "contact_person", label: t("admin.ecosystem.partners.columns.contact"), width: 160, render: (row) => row.contact_person || "-" },
    { key: "website_url", label: t("admin.ecosystem.partners.columns.website"), width: 180, render: (row) => row.website_url ? <a href={row.website_url} target="_blank" rel="noreferrer" className="font-bold text-accent hover:underline">Open</a> : "-" },
    { key: "focus_areas", label: t("admin.ecosystem.partners.columns.focus"), render: (row) => (row.focus_areas || []).join(", ") || "-" },
    { key: "connection_count", label: t("admin.ecosystem.partners.columns.connections"), width: 110 },
    { key: "opportunity_count", label: t("admin.ecosystem.partners.columns.opportunities"), width: 120 },
    { key: "status", label: t("admin.ecosystem.partners.columns.status"), width: 120, render: (row) => <StatusBadge value={row.status} /> },
    { key: "visibility", label: t("admin.ecosystem.partners.columns.visibility"), width: 120, render: (row) => <StatusBadge value={row.visibility} /> },
    { key: "actions", label: "", width: 96, render: (row) => <div className="flex justify-end gap-1"><button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/admin/ecosystem/partners/${row.id}`); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"><Eye size={16} /></button><button type="button" onClick={(e) => { e.stopPropagation(); setConfirm(row); }} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button></div> },
  ], [navigate, t]);

  return (
    <>
      <FilterBar right={<button type="button" onClick={() => setModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-hover"><Plus size={16} /> {t("admin.ecosystem.partners.addBtn")}</button>}>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.ecosystem.partners.searchPlaceholder")} />
        <FilterSelect label={t("admin.ecosystem.partners.columns.type")} value={query.partner_type} onChange={(partner_type) => setQuery((prev) => ({ ...prev, page: 1, partner_type }))} options={withAll(partnerTypeOptions)} />
        <FilterSelect label={t("admin.ecosystem.partners.columns.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={withAll(statusOptions)} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.ecosystem.partners.emptyText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} onRowClick={(row) => navigate(`/admin/ecosystem/partners/${row.id}`)} />
      <FormModal open={modal} title={t("admin.ecosystem.partners.modals.addPartner")} submitLabel={t("admin.ecosystem.common.create")} saving={saving} onClose={() => setModal(false)} onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.ecosystem.partners.fields.name")}><input required className={inputClass} value={form.partner_name} onChange={(e) => set("partner_name", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.partners.fields.type")}><SelectField value={form.partner_type} onChange={(partner_type) => set("partner_type", partner_type)} options={partnerTypeOptions} /></Field>
          <Field label={t("admin.ecosystem.partners.fields.contactPerson")}><input className={inputClass} value={form.contact_person} onChange={(e) => set("contact_person", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.partners.fields.contactEmail")}><input type="email" className={inputClass} value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.partners.fields.phone")}><input className={inputClass} value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.partners.fields.website")}><input className={inputClass} value={form.website_url} onChange={(e) => set("website_url", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.partners.fields.status")}><SelectField value={form.status} onChange={(status) => set("status", status)} options={statusOptions} /></Field>
          <Field label={t("admin.ecosystem.partners.fields.visibility")}><SelectField value={form.visibility} onChange={(visibility) => set("visibility", visibility)} options={visibilitySelectOptions} /></Field>
          <div className="sm:col-span-2"><Field label={t("admin.ecosystem.partners.fields.focusAreas")}><input className={inputClass} value={form.focus_areas} onChange={(e) => set("focus_areas", e.target.value)} placeholder="AI, fintech, SaaS" /></Field></div>
          <div className="sm:col-span-2"><Field label={t("admin.ecosystem.partners.fields.description")}><textarea rows={4} className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field></div>
        </div>
      </FormModal>
      <ConfirmDialog isOpen={!!confirm} title={t("admin.ecosystem.partners.dialogs.archiveTitle")} subtitle={confirm?.partner_name || ""} variant="archive" color="red" yesLabel={t("admin.ecosystem.common.archive")} noLabel={t("admin.ecosystem.common.cancel")} onYes={deletePartner} onNo={() => setConfirm(null)} onClose={() => setConfirm(null)} />
    </>
  );
}
