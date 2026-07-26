import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { Panel, progressTypeOptions, SaveButton, SelectField, StartupForm, StartupHeader, supportNeedTypeOptions, supportPriorityOptions, visibilityOptions } from "@/pages/admin/incubation/components";
import { formatDate } from "@/utils/dateTimeDisplay";
import useDocumentTitle from "@/hooks/useDocumentTitle";

const today = () => new Date().toISOString().slice(0, 10);

export default function StudentStartupProfileDetailPage() {
  const { startupId, id } = useParams();
  const currentId = startupId || id;
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { t } = useTranslation();
  const activeTab = location.pathname.endsWith("/progress") ? "progress" : location.pathname.endsWith("/support-needs") ? "support" : params.get("tab") || "profile";
  const toast = useToast();
  const [startup, setStartup] = useState(null);
  useDocumentTitle(startup?.startup_name || null, 1);
  const [progressRows, setProgressRows] = useState([]);
  const [supportNeeds, setSupportNeeds] = useState([]);
  const [form, setForm] = useState({});
  const [progressForm, setProgressForm] = useState({ update_title: "", update_type: "product", progress_date: today(), visibility: "internal", update_content: "" });
  const [supportForm, setSupportForm] = useState({ need_type: "business", priority: "normal", title: "", description: "" });
  const [progressModal, setProgressModal] = useState(false);
  const [supportModal, setSupportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const tabLabels = {
    profile: t("student.startupProfile.tabs.profile"),
    progress: t("student.startupProfile.tabs.progress"),
    support: t("student.startupProfile.tabs.support"),
  };

  const openTab = (tab) => {
    if (tab === "progress") navigate(`/student/startups/${currentId}/progress`);
    else if (tab === "support") navigate(`/student/startups/${currentId}/support-needs`);
    else navigate(`/student/startups/${currentId}`);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, progressRes, supportRes] = await Promise.all([
        IncubationApi.myStartup(currentId),
        IncubationApi.myStartupProgress(currentId, { limit: 100 }),
        IncubationApi.myStartupSupportNeeds(currentId, { limit: 100 }),
      ]);
      setStartup(res?.data || null);
      setForm(res?.data || {});
      setProgressRows(progressRes?.data || []);
      setSupportNeeds(supportRes?.data || []);
    } catch (err) {
      setError(err.message || t("student.startupProfile.detailLoadError"));
    } finally {
      setLoading(false);
    }
  }, [currentId, t]);

  useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.updateMyStartup(currentId, form);
      toast.success(t("student.startupProfile.updated"));
      await load();
    } catch (err) {
      toast.error(err.message || t("student.startupProfile.updateError"));
    } finally {
      setSaving(false);
    }
  };

  const submitProgress = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.createMyStartupProgress(currentId, progressForm);
      toast.success(t("student.startupProfile.progressAdded"));
      setProgressModal(false);
      setProgressForm({ update_title: "", update_type: "product", progress_date: today(), visibility: "internal", update_content: "" });
      await load();
    } catch (err) {
      toast.error(err.message || t("student.startupProfile.progressError"));
    } finally {
      setSaving(false);
    }
  };

  const submitSupport = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.createMyStartupSupportNeed(currentId, supportForm);
      toast.success(t("student.startupProfile.supportSubmitted"));
      setSupportModal(false);
      setSupportForm({ need_type: "business", priority: "normal", title: "", description: "" });
      await load();
    } catch (err) {
      toast.error(err.message || t("student.startupProfile.supportError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rounded-2xl bg-surface p-8 text-center text-sm text-text-muted">{t("common.loading")}</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  if (!startup) return null;

  const milestoneColumns = [
    { key: "title", label: t("student.startupProfile.columns.milestone"), render: (row) => <span className="font-semibold text-text-primary">{row.title}</span> },
    { key: "milestone_type", label: t("admin.ecosystem.common.type"), render: (row) => <StatusBadge value={row.milestone_type} /> },
    { key: "milestone_date", label: t("student.startupProfile.columns.date"), render: (row) => formatDate(row.milestone_date) },
  ];

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate("/student/startup-profile")} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold text-text-secondary hover:bg-subtle"><ArrowLeft size={16} /> {t("common.back")}</button>
      <StartupHeader startup={startup} />
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-surface p-2 shadow-sm">{["profile", "progress", "support"].map((tab) => <button key={tab} type="button" onClick={() => openTab(tab)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${activeTab === tab ? "bg-accent-50 text-accent" : "text-text-secondary hover:bg-subtle"}`}>{tabLabels[tab]}</button>)}</div>
      {activeTab === "profile" ? <Panel title={t("student.startupProfile.panels.profile")}>
        <form onSubmit={submit} className="space-y-4">
          <StartupForm form={form} setForm={setForm} showStatus={false} />
          <div className="flex justify-end"><SaveButton saving={saving}>{t("student.startupProfile.saveProfile")}</SaveButton></div>
        </form>
      </Panel> : null}
      {activeTab === "progress" ? <Panel title={t("student.startupProfile.panels.progress")} actions={<button type="button" onClick={() => setProgressModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-white"><Plus size={16} /> {t("student.startupProfile.actions.add")}</button>}><AdminTable columns={[{ key: "progress_date", label: t("student.startupProfile.columns.date"), render: (row) => formatDate(row.progress_date) }, { key: "update_title", label: t("student.startupProfile.columns.update"), render: (row) => <div><p className="font-semibold text-text-primary">{row.update_title}</p><p className="mt-1 text-sm text-text-secondary">{row.update_content}</p></div> }, { key: "update_type", label: t("admin.ecosystem.common.type"), render: (row) => <StatusBadge value={row.update_type} /> }, { key: "visibility", label: t("admin.ecosystem.common.visibility"), render: (row) => <StatusBadge value={row.visibility} /> }]} rows={progressRows} emptyText={t("student.startupProfile.empty.progress")} /></Panel> : null}
      {activeTab === "support" ? <Panel title={t("student.startupProfile.panels.supportNeeds")} actions={<button type="button" onClick={() => setSupportModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-white"><Plus size={16} /> {t("student.startupProfile.actions.request")}</button>}><AdminTable columns={[{ key: "title", label: t("student.startupProfile.columns.need"), render: (row) => <div><p className="font-semibold text-text-primary">{row.title}</p><p className="mt-1 text-sm text-text-secondary">{row.description}</p></div> }, { key: "need_type", label: t("admin.ecosystem.common.type"), render: (row) => <StatusBadge value={row.need_type} /> }, { key: "priority", label: t("student.startupProfile.columns.priority"), render: (row) => <StatusBadge value={row.priority} /> }, { key: "status", label: t("common.status"), render: (row) => <StatusBadge value={row.status} /> }]} rows={supportNeeds} emptyText={t("student.startupProfile.empty.support")} /></Panel> : null}
      {activeTab === "profile" ? <Panel title={t("student.startupProfile.panels.milestones")}><AdminTable columns={milestoneColumns} rows={startup.milestones || []} emptyText={t("student.startupProfile.empty.milestones")} /></Panel> : null}
      <FormModal open={progressModal} title={t("student.startupProfile.modals.addProgress")} submitLabel={t("common.save")} saving={saving} onClose={() => setProgressModal(false)} onSubmit={submitProgress}><div className="grid gap-4 sm:grid-cols-2"><Field label={t("student.startupProfile.fields.title")}><input required className={inputClass} value={progressForm.update_title || ""} onChange={(e) => setProgressForm((prev) => ({ ...prev, update_title: e.target.value }))} /></Field><Field label={t("admin.ecosystem.common.type")}><SelectField value={progressForm.update_type || "other"} onChange={(update_type) => setProgressForm((prev) => ({ ...prev, update_type }))} options={progressTypeOptions} /></Field><Field label={t("student.startupProfile.columns.date")}><input required type="date" className={inputClass} value={String(progressForm.progress_date || "").slice(0, 10)} onChange={(e) => setProgressForm((prev) => ({ ...prev, progress_date: e.target.value }))} /></Field><Field label={t("admin.ecosystem.common.visibility")}><SelectField value={progressForm.visibility || "internal"} onChange={(visibility) => setProgressForm((prev) => ({ ...prev, visibility }))} options={visibilityOptions} /></Field><div className="sm:col-span-2"><Field label={t("student.startupProfile.fields.content")}><textarea required rows={5} className={inputClass} value={progressForm.update_content || ""} onChange={(e) => setProgressForm((prev) => ({ ...prev, update_content: e.target.value }))} /></Field></div></div></FormModal>
      <FormModal open={supportModal} title={t("student.startupProfile.modals.requestSupport")} submitLabel={t("student.startupProfile.modals.submit")} saving={saving} onClose={() => setSupportModal(false)} onSubmit={submitSupport}><div className="grid gap-4 sm:grid-cols-2"><Field label={t("admin.ecosystem.common.type")}><SelectField value={supportForm.need_type || "other"} onChange={(need_type) => setSupportForm((prev) => ({ ...prev, need_type }))} options={supportNeedTypeOptions} /></Field><Field label={t("student.startupProfile.columns.priority")}><SelectField value={supportForm.priority || "normal"} onChange={(priority) => setSupportForm((prev) => ({ ...prev, priority }))} options={supportPriorityOptions} /></Field><div className="sm:col-span-2"><Field label={t("student.startupProfile.fields.title")}><input required className={inputClass} value={supportForm.title || ""} onChange={(e) => setSupportForm((prev) => ({ ...prev, title: e.target.value }))} /></Field></div><div className="sm:col-span-2"><Field label={t("admin.ecosystem.common.description")}><textarea required rows={5} className={inputClass} value={supportForm.description || ""} onChange={(e) => setSupportForm((prev) => ({ ...prev, description: e.target.value }))} /></Field></div></div></FormModal>
    </div>
  );
}
