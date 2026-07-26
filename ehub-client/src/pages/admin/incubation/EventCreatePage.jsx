import { useState, useMemo } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import { useToast } from "@/components/ui/Toast";
import { Field, inputClass } from "@/pages/admin/components/FormModal";
import { eventStatusOptions, eventTypeOptions, SelectField, visibilityOptions } from "./components";
import { useTranslation } from "@/context/TranslationContext";

export default function EventCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [form, setForm] = useState({ event_name: "", event_type: "demo_day", visibility: "internal", status: "draft", start_at: "" });
  const [saving, setSaving] = useState(false);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await IncubationApi.createEvent(form);
      toast.success(t("admin.ecosystem.events.toasts.created"));
      navigate(`/admin/ecosystem/events/${res?.data?.id}`);
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.events.toasts.createError"));
    } finally {
      setSaving(false);
    }
  };

  const translatedEventTypeOptions = useMemo(() => {
    return eventTypeOptions.map((opt) => ({ ...opt, label: t(`status.${opt.value}`) || opt.label }));
  }, [t]);

  const translatedEventStatusOptions = useMemo(() => {
    return eventStatusOptions.map((opt) => ({ ...opt, label: t(`status.${opt.value}`) || opt.label }));
  }, [t]);

  const translatedVisibilityOptions = useMemo(() => {
    return visibilityOptions.map((opt) => ({ ...opt, label: t(`status.${opt.value}`) || opt.label }));
  }, [t]);

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate("/admin/ecosystem/events")} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={16} /> {t("admin.ecosystem.common.back")}</button>
      <form onSubmit={submit} className="rounded-card border border-border bg-surface p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.ecosystem.events.fields.name")}><input required className={inputClass} value={form.event_name || ""} onChange={(e) => set("event_name", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.events.fields.code")}><input className={inputClass} value={form.event_code || ""} onChange={(e) => set("event_code", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.events.fields.type")}><SelectField value={form.event_type || "other"} onChange={(value) => set("event_type", value)} options={translatedEventTypeOptions} /></Field>
          <Field label={t("admin.ecosystem.events.fields.status")}><SelectField value={form.status || "draft"} onChange={(value) => set("status", value)} options={translatedEventStatusOptions} /></Field>
          <Field label={t("admin.ecosystem.events.fields.visibility")}><SelectField value={form.visibility || "internal"} onChange={(value) => set("visibility", value)} options={translatedVisibilityOptions} /></Field>
          <Field label={t("admin.ecosystem.events.fields.startAt")}><input required type="datetime-local" className={inputClass} value={form.start_at || ""} onChange={(e) => set("start_at", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.events.fields.endAt")}><input type="datetime-local" className={inputClass} value={form.end_at || ""} onChange={(e) => set("end_at", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.events.fields.location")}><input className={inputClass} value={form.location || ""} onChange={(e) => set("location", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.events.fields.meetingLink")}><input className={inputClass} value={form.meeting_link || ""} onChange={(e) => set("meeting_link", e.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label={t("admin.ecosystem.events.fields.description")}><textarea className={inputClass} rows={5} value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></Field></div>
        </div>
        <div className="mt-5 flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"><Save size={16} /> {t("admin.ecosystem.events.createBtn")}</button></div>
      </form>
    </div>
  );
}
