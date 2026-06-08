import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import { useToast } from "@/components/ui/Toast";
import { Field, inputClass } from "@/pages/admin/components/FormModal";
import { Panel, SelectField, visibilityOptions } from "./components";
import { useTranslation } from "@/context/TranslationContext";

const toInputDateTime = (value) => value ? String(value).slice(0, 16) : "";

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [form, setForm] = useState(null);
  const [partners, setPartners] = useState([]);
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

  const partnerOptions = useMemo(() => [
    { value: "", label: t("admin.ecosystem.common.none") },
    ...partners.map((partner) => ({ value: String(partner.id), label: partner.partner_name })),
  ], [partners, t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, partnersRes] = await Promise.all([
        IncubationApi.getOpportunity(id),
        IncubationApi.listPartners({ limit: 100, status: "active" }),
      ]);
      const data = res?.data || null;
      setForm(data ? { ...data, partner_id: data.partner_id ? String(data.partner_id) : "", deadline: toInputDateTime(data.deadline) } : null);
      setPartners(partnersRes?.data || []);
    } catch (err) {
      setError(err.message || t("admin.ecosystem.opportunities.toasts.loadDetailError"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.updateOpportunity(id, { ...form, partner_id: form.partner_id ? Number(form.partner_id) : null, deadline: form.deadline || null });
      toast.success(t("admin.ecosystem.opportunities.toasts.updated"));
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.opportunities.toasts.updateError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">{t("admin.ecosystem.common.loading")}</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  if (!form) return null;

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate("/admin/ecosystem/opportunities")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={16} /> {t("admin.ecosystem.common.back")}</button>
      <Panel title={t("admin.ecosystem.opportunities.panels.opportunity")}>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <Field label={t("admin.ecosystem.opportunities.fields.title")}><input required className={inputClass} value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.opportunities.fields.type")}><SelectField value={form.opportunity_type || "other"} onChange={(opportunity_type) => set("opportunity_type", opportunity_type)} options={opportunityTypeOptions} /></Field>
          <Field label={t("admin.ecosystem.opportunities.fields.partnerId")}><SelectField value={form.partner_id || ""} onChange={(partner_id) => set("partner_id", partner_id)} options={partnerOptions} /></Field>
          <Field label={t("admin.ecosystem.opportunities.fields.deadline")}><input type="datetime-local" className={inputClass} value={form.deadline || ""} onChange={(e) => set("deadline", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.opportunities.fields.status")}><SelectField value={form.status || "draft"} onChange={(status) => set("status", status)} options={statusOptions} /></Field>
          <Field label={t("admin.ecosystem.opportunities.fields.visibility")}><SelectField value={form.visibility || "internal"} onChange={(visibility) => set("visibility", visibility)} options={visibilitySelectOptions} /></Field>
          <div className="md:col-span-2"><Field label={t("admin.ecosystem.opportunities.fields.externalUrl")}><input className={inputClass} value={form.external_url || ""} onChange={(e) => set("external_url", e.target.value)} /></Field></div>
          <div className="md:col-span-2"><Field label={t("admin.ecosystem.opportunities.fields.description")}><textarea rows={5} className={inputClass} value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></Field></div>
          <div className="md:col-span-2"><Field label={t("admin.ecosystem.opportunities.fields.eligibility")}><textarea rows={3} className={inputClass} value={form.eligibility || ""} onChange={(e) => set("eligibility", e.target.value)} /></Field></div>
          <div className="md:col-span-2 flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"><Save size={16} /> {t("admin.ecosystem.common.save")}</button></div>
        </form>
      </Panel>
    </div>
  );
}
