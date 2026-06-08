import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import { useToast } from "@/components/ui/Toast";
import { Field, inputClass } from "@/pages/admin/components/FormModal";
import { Panel, SelectField, visibilityOptions } from "./components";
import { useTranslation } from "@/context/TranslationContext";

export default function PartnerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [form, setForm] = useState(null);
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

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await IncubationApi.getPartner(id);
      const data = res?.data || null;
      setForm(data ? { ...data, focus_areas_text: (data.focus_areas || []).join(", ") } : null);
    } catch (err) {
      setError(err.message || t("admin.ecosystem.partners.toasts.loadDetailError"));
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
      await IncubationApi.updatePartner(id, { ...form, focus_areas: String(form.focus_areas_text || "").split(",").map((item) => item.trim()).filter(Boolean) });
      toast.success(t("admin.ecosystem.partners.toasts.updated"));
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.partners.toasts.updateError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">{t("admin.ecosystem.common.loading")}</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  if (!form) return null;

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate("/admin/ecosystem/partners")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={16} /> {t("admin.ecosystem.common.back")}</button>
      <Panel title={t("admin.ecosystem.partners.panels.profile")}>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <Field label={t("admin.ecosystem.partners.fields.name")}><input required className={inputClass} value={form.partner_name || ""} onChange={(e) => set("partner_name", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.partners.fields.type")}><SelectField value={form.partner_type || "other"} onChange={(partner_type) => set("partner_type", partner_type)} options={partnerTypeOptions} /></Field>
          <Field label={t("admin.ecosystem.partners.fields.contactPerson")}><input className={inputClass} value={form.contact_person || ""} onChange={(e) => set("contact_person", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.partners.fields.contactEmail")}><input type="email" className={inputClass} value={form.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.partners.fields.phone")}><input className={inputClass} value={form.contact_phone || ""} onChange={(e) => set("contact_phone", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.partners.fields.website")}><input className={inputClass} value={form.website_url || ""} onChange={(e) => set("website_url", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.partners.fields.status")}><SelectField value={form.status || "active"} onChange={(status) => set("status", status)} options={statusOptions} /></Field>
          <Field label={t("admin.ecosystem.partners.fields.visibility")}><SelectField value={form.visibility || "internal"} onChange={(visibility) => set("visibility", visibility)} options={visibilitySelectOptions} /></Field>
          <div className="md:col-span-2"><Field label={t("admin.ecosystem.partners.fields.focusAreas")}><input className={inputClass} value={form.focus_areas_text || ""} onChange={(e) => set("focus_areas_text", e.target.value)} /></Field></div>
          <div className="md:col-span-2"><Field label={t("admin.ecosystem.partners.fields.description")}><textarea rows={5} className={inputClass} value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></Field></div>
          <div className="md:col-span-2 flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"><Save size={16} /> {t("admin.ecosystem.common.save")}</button></div>
        </form>
      </Panel>
    </div>
  );
}
