import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import { useToast } from "@/components/ui/Toast";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { SelectField, visibilityOptions } from "./components";
import { formatDate } from "@/utils/dateTimeDisplay";
import { useTranslation } from "@/context/TranslationContext";

const blankForm = { partner_id: "", opportunity_type: "incubation_program", title: "", description: "", eligibility: "", deadline: "", external_url: "", status: "draft", visibility: "internal" };

export default function OpportunitiesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", opportunity_type: "", status: "" });
  const [form, setForm] = useState(blankForm);
  const [partners, setPartners] = useState([]);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const opportunityTypeOptions = useMemo(() => [
    "incubation_program", "grant", "competition", "workshop", "mentor_session", "pilot_program", "investor_meeting", "other"
  ].map((value) => ({ value, label: t(`status.${value}`) || value })), [t]);

  const statusOptions = useMemo(() => [
    "draft", "open", "closed", "archived"
  ].map((value) => ({ value, label: t(`status.${value}`) || value })), [t]);

  const visibilitySelectOptions = useMemo(() => {
    return visibilityOptions.map((o) => ({ ...o, label: t(`status.${o.value}`) || o.label }));
  }, [t]);

  const withAll = (items) => [{ value: "", label: t("admin.ecosystem.common.all") }, ...items];

  const partnerOptions = useMemo(() => [
    { value: "", label: t("admin.ecosystem.common.none") },
    ...partners.map((partner) => ({ value: String(partner.id), label: partner.partner_name })),
  ], [partners, t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, partnersRes] = await Promise.all([
        IncubationApi.listOpportunities(query),
        IncubationApi.listPartners({ limit: 100, status: "active" }),
      ]);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
      setPartners(partnersRes?.data || []);
    } catch (err) {
      setError(err.message || t("admin.ecosystem.opportunities.toasts.loadError"));
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
      await IncubationApi.createOpportunity({ ...form, partner_id: form.partner_id ? Number(form.partner_id) : null, deadline: form.deadline || null });
      toast.success(t("admin.ecosystem.opportunities.toasts.created"));
      setModal(false);
      setForm(blankForm);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.opportunities.toasts.createError"));
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (row, status) => {
    try {
      await IncubationApi.updateOpportunityStatus(row.id, { status });
      toast.success(t("admin.ecosystem.opportunities.toasts.statusUpdated"));
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.opportunities.toasts.statusUpdateError"));
    }
  };

  const columns = useMemo(() => [
    { key: "title", label: t("admin.ecosystem.opportunities.columns.opportunity"), width: 260, render: (row) => <button type="button" onClick={() => navigate(`/admin/ecosystem/opportunities/${row.id}`)} className="text-left font-black text-slate-900 hover:text-indigo-700">{row.title}</button> },
    { key: "opportunity_type", label: t("admin.ecosystem.opportunities.columns.type"), width: 170, render: (row) => <StatusBadge value={row.opportunity_type} /> },
    { key: "partner_name", label: t("admin.ecosystem.opportunities.columns.partner"), width: 180, render: (row) => row.partner_name || "-" },
    { key: "deadline", label: t("admin.ecosystem.opportunities.columns.deadline"), width: 150, render: (row) => formatDate(row.deadline) },
    { key: "application_count", label: t("admin.ecosystem.opportunities.columns.applications"), width: 120 },
    { key: "visibility", label: t("admin.ecosystem.opportunities.columns.visibility"), width: 120, render: (row) => <StatusBadge value={row.visibility} /> },
    { key: "status", label: t("admin.ecosystem.opportunities.columns.status"), width: 120, render: (row) => <StatusBadge value={row.status} /> },
    { key: "actions", label: "", width: 180, render: (row) => <div className="flex justify-end gap-1"><button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/admin/ecosystem/opportunities/${row.id}`); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"><Eye size={16} /></button>{row.status !== "open" ? <button type="button" onClick={(e) => { e.stopPropagation(); setStatus(row, "open"); }} className="rounded-lg px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50">{t("admin.ecosystem.opportunities.actions.open")}</button> : null}{row.status !== "closed" ? <button type="button" onClick={(e) => { e.stopPropagation(); setStatus(row, "closed"); }} className="rounded-lg px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50">{t("admin.ecosystem.opportunities.actions.close")}</button> : null}</div> },
  ], [navigate, t]);

  return (
    <>
      <FilterBar right={<button type="button" onClick={() => setModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"><Plus size={16} /> {t("admin.ecosystem.opportunities.addBtn")}</button>}>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.ecosystem.opportunities.searchPlaceholder")} />
        <FilterSelect label={t("admin.ecosystem.opportunities.columns.type")} value={query.opportunity_type} onChange={(opportunity_type) => setQuery((prev) => ({ ...prev, page: 1, opportunity_type }))} options={withAll(opportunityTypeOptions)} />
        <FilterSelect label={t("admin.ecosystem.opportunities.columns.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={withAll(statusOptions)} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.ecosystem.opportunities.emptyText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} onRowClick={(row) => navigate(`/admin/ecosystem/opportunities/${row.id}`)} />
      <FormModal open={modal} title={t("admin.ecosystem.opportunities.modals.addOpportunity")} submitLabel={t("admin.ecosystem.common.create")} saving={saving} onClose={() => setModal(false)} onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.ecosystem.opportunities.fields.title")}><input required className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.opportunities.fields.type")}><SelectField value={form.opportunity_type} onChange={(opportunity_type) => set("opportunity_type", opportunity_type)} options={opportunityTypeOptions} /></Field>
          <Field label={t("admin.ecosystem.opportunities.fields.partnerId")}><SelectField value={form.partner_id || ""} onChange={(partner_id) => set("partner_id", partner_id)} options={partnerOptions} /></Field>
          <Field label={t("admin.ecosystem.opportunities.fields.deadline")}><input type="datetime-local" className={inputClass} value={form.deadline} onChange={(e) => set("deadline", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.opportunities.fields.status")}><SelectField value={form.status} onChange={(status) => set("status", status)} options={statusOptions} /></Field>
          <Field label={t("admin.ecosystem.opportunities.fields.visibility")}><SelectField value={form.visibility} onChange={(visibility) => set("visibility", visibility)} options={visibilitySelectOptions} /></Field>
          <div className="sm:col-span-2"><Field label={t("admin.ecosystem.opportunities.fields.externalUrl")}><input className={inputClass} value={form.external_url} onChange={(e) => set("external_url", e.target.value)} /></Field></div>
          <div className="sm:col-span-2"><Field label={t("admin.ecosystem.opportunities.fields.description")}><textarea rows={4} className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field></div>
          <div className="sm:col-span-2"><Field label={t("admin.ecosystem.opportunities.fields.eligibility")}><textarea rows={3} className={inputClass} value={form.eligibility} onChange={(e) => set("eligibility", e.target.value)} /></Field></div>
        </div>
      </FormModal>
    </>
  );
}
