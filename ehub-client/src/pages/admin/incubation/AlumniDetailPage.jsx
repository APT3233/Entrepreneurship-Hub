import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import { useToast } from "@/components/ui/Toast";
import AdminTable from "@/pages/admin/components/AdminTable";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { Panel, SelectField } from "./components";
import { formatDate } from "@/utils/dateTimeDisplay";
import { useTranslation } from "@/context/TranslationContext";

export default function AlumniDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [alumni, setAlumni] = useState(null);
  const [startups, setStartups] = useState([]);
  const [form, setForm] = useState({});
  const [linkForm, setLinkForm] = useState({ startup_id: "", role: "founder", status: "active", start_date: "", end_date: "", note: "" });
  const [linkModal, setLinkModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const linkRoleOptions = useMemo(() => [
    "founder", "co_founder", "member", "advisor", "mentor", "investor", "partner"
  ].map((value) => ({ value, label: t(`status.${value}`) || value })), [t]);

  const linkStatusOptions = useMemo(() => [
    "active", "inactive", "past"
  ].map((value) => ({ value, label: t(`status.${value}`) || value })), [t]);

  const statusOptions = useMemo(() => [
    "active", "inactive", "archived"
  ].map((value) => ({ value, label: t(`status.${value}`) || value })), [t]);

  const startupOptions = useMemo(() => [
    { value: "", label: t("admin.ecosystem.alumni.fields.selectStartup") },
    ...startups.map((startup) => ({ value: String(startup.id), label: startup.startup_name })),
  ], [startups, t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, startupsRes] = await Promise.all([
        IncubationApi.getAlumni(id),
        IncubationApi.listStartups({ limit: 100 }),
      ]);
      setAlumni(res?.data || null);
      setForm(res?.data || {});
      setStartups(startupsRes?.data || []);
    } catch (err) {
      setError(err.message || t("admin.ecosystem.alumni.toasts.loadDetailError"));
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
      await IncubationApi.updateAlumni(id, { ...form, startup_links: alumni?.startup_links || [] });
      toast.success(t("admin.ecosystem.alumni.toasts.updated"));
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.alumni.toasts.updateError"));
    } finally {
      setSaving(false);
    }
  };

  const addLink = async (event) => {
    event.preventDefault();
    if (!linkForm.startup_id) {
      toast.error(t("admin.ecosystem.alumni.fields.selectStartup"));
      return;
    }
    setSaving(true);
    try {
      const startup_links = [...(alumni?.startup_links || []), { ...linkForm, startup_id: Number(linkForm.startup_id), start_date: linkForm.start_date || null, end_date: linkForm.end_date || null }];
      await IncubationApi.updateAlumni(id, { startup_links });
      toast.success(t("admin.ecosystem.alumni.toasts.linkAdded"));
      setLinkModal(false);
      setLinkForm({ startup_id: "", role: "founder", status: "active", start_date: "", end_date: "", note: "" });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.alumni.toasts.linkAddError"));
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => [
    { key: "startup_name", label: t("admin.ecosystem.alumni.columns.startups"), render: (row) => <button type="button" onClick={() => navigate(`/admin/incubation/startups/${row.startup_id}`)} className="font-black text-accent hover:underline">{row.startup_name}</button> },
    { key: "role", label: t("admin.ecosystem.alumni.columns.role"), render: (row) => <StatusBadge value={row.role} /> },
    { key: "status", label: t("admin.ecosystem.alumni.columns.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "start_date", label: t("admin.ecosystem.alumni.columns.start"), render: (row) => formatDate(row.start_date) },
    { key: "end_date", label: t("admin.ecosystem.alumni.columns.end"), render: (row) => formatDate(row.end_date) },
    { key: "note", label: t("admin.ecosystem.alumni.columns.note"), render: (row) => row.note || "-" },
  ], [navigate, t]);

  if (loading) return <div className="rounded-card bg-surface p-8 text-center text-sm text-slate-400">{t("admin.ecosystem.common.loading")}</div>;
  if (error) return <div className="rounded-card bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  if (!alumni) return null;

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate("/admin/ecosystem/alumni")} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={16} /> {t("admin.ecosystem.common.back")}</button>
      <Panel title={t("admin.ecosystem.alumni.panels.profile")}>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <Field label={t("admin.ecosystem.alumni.fields.fullName")}><input required className={inputClass} value={form.full_name || ""} onChange={(e) => set("full_name", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.email")}><input type="email" className={inputClass} value={form.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.phone")}><input className={inputClass} value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.graduationYear")}><input type="number" className={inputClass} value={form.graduation_year || ""} onChange={(e) => set("graduation_year", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.major")}><input className={inputClass} value={form.major || ""} onChange={(e) => set("major", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.campus")}><input className={inputClass} value={form.campus || ""} onChange={(e) => set("campus", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.position")}><input className={inputClass} value={form.current_position || ""} onChange={(e) => set("current_position", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.company")}><input className={inputClass} value={form.current_company || ""} onChange={(e) => set("current_company", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.linkedin")}><input className={inputClass} value={form.linkedin_url || ""} onChange={(e) => set("linkedin_url", e.target.value)} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.status")}><SelectField value={form.status || "active"} onChange={(status) => set("status", status)} options={statusOptions} /></Field>
          <div className="md:col-span-2"><Field label={t("admin.ecosystem.alumni.fields.bio")}><textarea rows={4} className={inputClass} value={form.bio || ""} onChange={(e) => set("bio", e.target.value)} /></Field></div>
          <div className="md:col-span-2 flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"><Save size={16} /> {t("admin.ecosystem.common.save")}</button></div>
        </form>
      </Panel>
      <Panel title={t("admin.ecosystem.alumni.panels.linkedStartups")} actions={<button type="button" onClick={() => setLinkModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-white"><Plus size={16} /> {t("admin.ecosystem.alumni.modals.linkStartup")}</button>}>
        <AdminTable columns={columns} rows={alumni.startup_links || []} emptyText={t("admin.ecosystem.alumni.empty.linkedStartups")} />
      </Panel>
      <FormModal open={linkModal} title={t("admin.ecosystem.alumni.modals.linkStartup")} submitLabel={t("admin.ecosystem.common.add")} saving={saving} onClose={() => setLinkModal(false)} onSubmit={addLink}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.ecosystem.alumni.fields.startupId")}><SelectField value={linkForm.startup_id || ""} onChange={(startup_id) => setLinkForm((prev) => ({ ...prev, startup_id }))} options={startupOptions} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.role")}><SelectField value={linkForm.role} onChange={(role) => setLinkForm((prev) => ({ ...prev, role }))} options={linkRoleOptions} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.status")}><SelectField value={linkForm.status} onChange={(status) => setLinkForm((prev) => ({ ...prev, status }))} options={linkStatusOptions} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.startDate")}><input type="date" className={inputClass} value={linkForm.start_date} onChange={(e) => setLinkForm((prev) => ({ ...prev, start_date: e.target.value }))} /></Field>
          <Field label={t("admin.ecosystem.alumni.fields.endDate")}><input type="date" className={inputClass} value={linkForm.end_date} onChange={(e) => setLinkForm((prev) => ({ ...prev, end_date: e.target.value }))} /></Field>
          <div className="sm:col-span-2"><Field label={t("admin.ecosystem.alumni.fields.note")}><textarea rows={3} className={inputClass} value={linkForm.note} onChange={(e) => setLinkForm((prev) => ({ ...prev, note: e.target.value }))} /></Field></div>
        </div>
      </FormModal>
    </div>
  );
}
