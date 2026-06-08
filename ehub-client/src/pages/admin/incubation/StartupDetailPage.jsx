import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import {
  awardTypeOptions,
  DocumentUploadForm,
  DocumentsTable,
  EmptyPlaceholder,
  milestoneTypeOptions,
  Panel,
  progressTypeOptions,
  SaveButton,
  SelectField,
  StartupForm,
  StartupHeader,
  supportActivityTypeOptions,
  supportNeedTypeOptions,
  supportPriorityOptions,
  visibilityOptions,
} from "./components";

const tabs = ["overview", "profile", "founders", "pipeline", "progress", "metrics", "support", "ecosystem", "milestones", "awards", "documents", "evaluation", "activity"];
const today = () => new Date().toISOString().slice(0, 10);

export default function StartupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const routeTab = ["progress", "metrics", "support"].find((tab) => location.pathname.endsWith(`/${tab}`));
  const activeTab = routeTab || (tabs.includes(params.get("tab")) ? params.get("tab") : "overview");
  const [startup, setStartup] = useState(null);
  const [stages, setStages] = useState([]);
  const [progressRows, setProgressRows] = useState([]);
  const [metricsRows, setMetricsRows] = useState([]);
  const [supportNeeds, setSupportNeeds] = useState([]);
  const [supportActivities, setSupportActivities] = useState([]);
  const [awards, setAwards] = useState([]);
  const [profileForm, setProfileForm] = useState({});
  const [moveForm, setMoveForm] = useState({ stage_id: "", action: "moved", status: "active", reason: "" });
  const [milestoneForm, setMilestoneForm] = useState({ title: "", milestone_type: "product", milestone_date: "" });
  const [milestoneModal, setMilestoneModal] = useState(false);
  const [progressForm, setProgressForm] = useState({ update_title: "", update_type: "product", progress_date: today(), visibility: "internal", update_content: "" });
  const [progressModal, setProgressModal] = useState(false);
  const [metricsForm, setMetricsForm] = useState({ snapshot_date: today(), product_stage: "idea", revenue_currency: "VND" });
  const [metricsModal, setMetricsModal] = useState(false);
  const [supportNeedForm, setSupportNeedForm] = useState({ need_type: "business", priority: "normal", title: "", description: "" });
  const [supportNeedModal, setSupportNeedModal] = useState(false);
  const [supportActivityForm, setSupportActivityForm] = useState({ activity_type: "mentor_session", activity_date: today(), title: "" });
  const [supportActivityModal, setSupportActivityModal] = useState(false);
  const [awardForm, setAwardForm] = useState({ award_name: "", award_type: "winner", awarded_at: today() });
  const [awardModal, setAwardModal] = useState(false);
  const [upload, setUpload] = useState({ document_type: "pitch_deck", visibility: "internal", file: null });
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [deleteMilestone, setDeleteMilestone] = useState(null);
  const [deleteProgressTarget, setDeleteProgressTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [startupRes, stagesRes, progressRes, metricsRes, needsRes, activitiesRes, awardsRes] = await Promise.all([
        IncubationApi.getStartup(id),
        IncubationApi.listStages({ limit: 100, status: "active" }),
        IncubationApi.listProgress(id, { limit: 100 }),
        IncubationApi.listMetrics(id, { limit: 100 }),
        IncubationApi.listSupportNeeds(id, { limit: 100 }),
        IncubationApi.listSupportActivities(id, { limit: 100 }),
        IncubationApi.listAwards(id, { limit: 100 }),
      ]);
      const data = startupRes?.data || null;
      setStartup(data);
      setProfileForm(data || {});
      setStages(stagesRes?.data || []);
      setProgressRows(progressRes?.data || []);
      setMetricsRows(metricsRes?.data || []);
      setSupportNeeds(needsRes?.data || []);
      setSupportActivities(activitiesRes?.data || []);
      setAwards(awardsRes?.data || []);
      setMoveForm((prev) => ({ ...prev, stage_id: data?.current_stage_id ? String(data.current_stage_id) : "" }));
    } catch (err) {
      setError(err.message || t("admin.ecosystem.startupDetail.loadError"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  const stageOptions = useMemo(() => [{ value: "", label: t("admin.ecosystem.createStartup.selectStage") }, ...stages.map((stage) => ({ value: String(stage.id), label: stage.name }))], [stages, t]);
  const openTab = (tab) => {
    if (["progress", "metrics", "support"].includes(tab)) navigate(`/admin/incubation/startups/${id}/${tab}`);
    else if (tab === "ecosystem") navigate(`/admin/incubation/startups/${id}/ecosystem`);
    else navigate(`/admin/incubation/startups/${id}${tab === "overview" ? "" : `?tab=${tab}`}`);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.updateStartup(id, profileForm);
      toast.success(t("admin.ecosystem.startupDetail.profileUpdated"));
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.startupDetail.updateError"));
    } finally {
      setSaving(false);
    }
  };

  const moveStage = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.moveStage(id, { ...moveForm, stage_id: Number(moveForm.stage_id) });
      toast.success(t("admin.ecosystem.startupDetail.stageUpdated"));
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.startupDetail.stageMoveError"));
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = async (event) => {
    event.preventDefault();
    if (!upload.file) return toast.error(t("admin.ecosystem.startupDetail.chooseFile"));
    setSaving(true);
    try {
      const init = await IncubationApi.initiateDocumentUpload(id, { document_type: upload.document_type, visibility: upload.visibility, file: { name: upload.file.name, size: upload.file.size, type: upload.file.type } });
      const putRes = await fetch(init.data.uploadUrl, { method: "PUT", body: upload.file, headers: { "Content-Type": upload.file.type || "application/octet-stream" } });
      if (!putRes.ok) throw new Error(t("admin.ecosystem.startupDetail.uploadFailed"));
      await IncubationApi.confirmDocumentUpload(id, init.data.uploadToken);
      setUpload({ document_type: "pitch_deck", visibility: "internal", file: null });
      toast.success(t("admin.ecosystem.startupDetail.documentUploaded"));
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.startupDetail.uploadError"));
    } finally {
      setSaving(false);
    }
  };

  const submitMilestone = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (milestoneForm.id) await IncubationApi.updateMilestone(id, milestoneForm.id, milestoneForm);
      else await IncubationApi.createMilestone(id, milestoneForm);
      toast.success(t("admin.ecosystem.startupDetail.milestoneSaved"));
      setMilestoneModal(false);
      setMilestoneForm({ title: "", milestone_type: "product", milestone_date: "" });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.startupDetail.milestoneSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteDoc = async () => {
    if (!deleteDoc) return;
    try {
      await IncubationApi.deleteDocument(id, deleteDoc.id);
      toast.success(t("admin.ecosystem.startupDetail.documentDeleted"));
      setDeleteDoc(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.startupDetail.documentDeleteError"));
    }
  };

  const confirmDeleteMilestone = async () => {
    if (!deleteMilestone) return;
    try {
      await IncubationApi.deleteMilestone(id, deleteMilestone.id);
      toast.success(t("admin.ecosystem.startupDetail.milestoneDeleted"));
      setDeleteMilestone(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.startupDetail.milestoneDeleteError"));
    }
  };

  const submitProgress = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (progressForm.id) await IncubationApi.updateProgress(id, progressForm.id, progressForm);
      else await IncubationApi.createProgress(id, progressForm);
      toast.success(t("admin.ecosystem.startupDetail.progressSaved"));
      setProgressModal(false);
      setProgressForm({ update_title: "", update_type: "product", progress_date: today(), visibility: "internal", update_content: "" });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.startupDetail.progressSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteProgress = async () => {
    if (!deleteProgressTarget) return;
    try {
      await IncubationApi.deleteProgress(id, deleteProgressTarget.id);
      toast.success(t("admin.ecosystem.startupDetail.progressDeleted"));
      setDeleteProgressTarget(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.startupDetail.progressDeleteError"));
    }
  };

  const submitMetrics = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.createMetrics(id, {
        ...metricsForm,
        users_count: metricsForm.users_count === "" ? null : metricsForm.users_count,
        customers_count: metricsForm.customers_count === "" ? null : metricsForm.customers_count,
        revenue_amount: metricsForm.revenue_amount === "" ? null : metricsForm.revenue_amount,
        team_size: metricsForm.team_size === "" ? null : metricsForm.team_size,
      });
      toast.success(t("admin.ecosystem.startupDetail.metricsCreated"));
      setMetricsModal(false);
      setMetricsForm({ snapshot_date: today(), product_stage: startup?.product_stage || "idea", revenue_currency: "VND" });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.startupDetail.metricsError"));
    } finally {
      setSaving(false);
    }
  };

  const submitSupportNeed = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.createSupportNeed(id, supportNeedForm);
      toast.success(t("admin.ecosystem.startupDetail.supportNeedCreated"));
      setSupportNeedModal(false);
      setSupportNeedForm({ need_type: "business", priority: "normal", title: "", description: "" });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.startupDetail.supportNeedError"));
    } finally {
      setSaving(false);
    }
  };

  const changeSupportStatus = async (need, status) => {
    try {
      await IncubationApi.updateSupportNeedStatus(need.id, { status, assigned_to: need.assigned_to || null });
      toast.success(t("admin.ecosystem.startupDetail.supportNeedUpdated"));
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.startupDetail.supportNeedUpdateError"));
    }
  };

  const submitSupportActivity = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.createSupportActivity(id, { ...supportActivityForm, support_need_id: supportActivityForm.support_need_id || null });
      toast.success(t("admin.ecosystem.startupDetail.supportActivityCreated"));
      setSupportActivityModal(false);
      setSupportActivityForm({ activity_type: "mentor_session", activity_date: today(), title: "" });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.startupDetail.supportActivityError"));
    } finally {
      setSaving(false);
    }
  };

  const submitAward = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.createAward(id, { ...awardForm, event_id: awardForm.event_id || null });
      toast.success(t("admin.ecosystem.startupDetail.awardRecorded"));
      setAwardModal(false);
      setAwardForm({ award_name: "", award_type: "winner", awarded_at: today() });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.startupDetail.awardError"));
    } finally {
      setSaving(false);
    }
  };

  const foundersColumns = useMemo(() => [
    { key: "full_name", label: t("admin.ecosystem.columns.founder"), render: (row) => <span className="font-black text-slate-900">{row.full_name}</span> },
    { key: "email", label: t("admin.ecosystem.columns.email"), render: (row) => row.email || "-" },
    { key: "founder_role", label: t("admin.ecosystem.columns.role"), render: (row) => <StatusBadge value={row.founder_role} /> },
    { key: "role_title", label: t("admin.ecosystem.columns.title"), render: (row) => row.role_title || "-" },
    { key: "status", label: t("admin.ecosystem.columns.status"), render: (row) => <StatusBadge value={row.status} /> },
  ], [t]);

  const historyColumns = useMemo(() => [
    { key: "action", label: t("admin.ecosystem.columns.action"), render: (row) => <StatusBadge value={row.action} /> },
    { key: "from_stage_name", label: t("admin.ecosystem.columns.from"), render: (row) => row.from_stage_name || "-" },
    { key: "to_stage_name", label: t("admin.ecosystem.columns.to") },
    { key: "reason", label: t("admin.ecosystem.columns.reason"), render: (row) => row.reason || "-" },
    { key: "actor_name", label: t("admin.ecosystem.columns.actor"), render: (row) => row.actor_name || "-" },
    { key: "created_at", label: t("admin.ecosystem.columns.created"), render: (row) => formatDate(row.created_at) },
  ], [t]);

  const milestoneColumns = useMemo(() => [
    { key: "title", label: t("admin.ecosystem.columns.milestones"), render: (row) => <span className="font-black text-slate-900">{row.title}</span> },
    { key: "milestone_type", label: t("admin.ecosystem.columns.type"), render: (row) => <StatusBadge value={row.milestone_type} /> },
    { key: "milestone_date", label: t("admin.ecosystem.columns.date"), render: (row) => formatDate(row.milestone_date) },
    { key: "created_by_name", label: t("admin.ecosystem.columns.createdBy"), render: (row) => row.created_by_name || "-" },
    { key: "actions", label: "", render: (row) => <div className="flex justify-end gap-1"><button type="button" onClick={() => { setMilestoneForm({ ...row, milestone_date: String(row.milestone_date || "").slice(0, 10) }); setMilestoneModal(true); }} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50">{t("admin.ecosystem.columns.edit")}</button><button type="button" onClick={() => setDeleteMilestone(row)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button></div> },
  ], [t]);

  const progressColumns = useMemo(() => [
    { key: "progress_date", label: t("admin.ecosystem.columns.date"), width: 120, render: (row) => formatDate(row.progress_date) },
    { key: "update_title", label: t("admin.ecosystem.columns.update"), render: (row) => <div><p className="font-black text-slate-900">{row.update_title}</p><p className="mt-1 line-clamp-2 text-sm text-slate-500">{row.update_content}</p></div> },
    { key: "update_type", label: t("admin.ecosystem.columns.type"), width: 130, render: (row) => <StatusBadge value={row.update_type} /> },
    { key: "visibility", label: t("admin.ecosystem.columns.visibility"), width: 120, render: (row) => <StatusBadge value={row.visibility} /> },
    { key: "created_by_name", label: t("admin.ecosystem.columns.createdBy"), width: 150, render: (row) => row.created_by_name || "-" },
    { key: "actions", label: "", width: 130, render: (row) => <div className="flex justify-end gap-1"><button type="button" onClick={() => { setProgressForm({ ...row, progress_date: String(row.progress_date || "").slice(0, 10) }); setProgressModal(true); }} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50">{t("admin.ecosystem.columns.edit")}</button><button type="button" onClick={() => setDeleteProgressTarget(row)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button></div> },
  ], [t]);

  const metricsColumns = useMemo(() => [
    { key: "snapshot_date", label: t("admin.ecosystem.columns.date"), render: (row) => formatDate(row.snapshot_date) },
    { key: "product_stage", label: t("admin.ecosystem.columns.stage"), render: (row) => <StatusBadge value={row.product_stage} /> },
    { key: "users_count", label: t("admin.ecosystem.columns.users"), render: (row) => row.users_count ?? "-" },
    { key: "customers_count", label: t("admin.ecosystem.columns.customers"), render: (row) => row.customers_count ?? "-" },
    { key: "revenue_amount", label: t("admin.ecosystem.columns.revenue"), render: (row) => row.revenue_amount === null || row.revenue_amount === undefined ? "-" : `${Number(row.revenue_amount).toLocaleString()} ${row.revenue_currency || "VND"}` },
    { key: "team_size", label: t("admin.ecosystem.columns.team"), render: (row) => row.team_size ?? "-" },
    { key: "flags", label: t("admin.ecosystem.columns.signals"), render: (row) => <div className="flex flex-wrap gap-1 text-xs font-bold text-slate-500">{row.mvp_completed ? <span>{t("admin.ecosystem.startupDetail.signals.mvp")}</span> : null}{row.market_validated ? <span>{t("admin.ecosystem.startupDetail.signals.validated")}</span> : null}{row.has_demo ? <span>{t("admin.ecosystem.startupDetail.signals.demo")}</span> : null}{row.has_pitch_deck ? <span>{t("admin.ecosystem.startupDetail.signals.deck")}</span> : null}{row.has_business_model ? <span>{t("admin.ecosystem.startupDetail.signals.model")}</span> : null}</div> },
  ], [t]);

  const supportNeedColumns = useMemo(() => [
    { key: "title", label: t("admin.ecosystem.columns.need"), render: (row) => <div><p className="font-black text-slate-900">{row.title}</p><p className="mt-1 line-clamp-2 text-sm text-slate-500">{row.description}</p></div> },
    { key: "need_type", label: t("admin.ecosystem.columns.type"), width: 140, render: (row) => <StatusBadge value={row.need_type} /> },
    { key: "priority", label: t("admin.ecosystem.columns.priority"), width: 110, render: (row) => <StatusBadge value={row.priority} /> },
    { key: "status", label: t("admin.ecosystem.columns.status"), width: 130, render: (row) => <StatusBadge value={row.status} /> },
    { key: "assigned_to_name", label: t("admin.ecosystem.columns.owner"), width: 150, render: (row) => row.assigned_to_name || "-" },
    { key: "actions", label: "", width: 170, render: (row) => <div className="flex justify-end gap-1"><button type="button" onClick={() => changeSupportStatus(row, "in_progress")} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50">{t("admin.ecosystem.columns.start")}</button><button type="button" onClick={() => changeSupportStatus(row, "resolved")} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50">{t("admin.ecosystem.columns.resolve")}</button></div> },
  ], [t]);

  const supportActivityColumns = useMemo(() => [
    { key: "activity_date", label: t("admin.ecosystem.columns.date"), width: 120, render: (row) => formatDate(row.activity_date) },
    { key: "title", label: t("admin.ecosystem.columns.activity"), render: (row) => <div><p className="font-black text-slate-900">{row.title}</p><p className="mt-1 line-clamp-2 text-sm text-slate-500">{row.description || row.support_need_title || "-"}</p></div> },
    { key: "activity_type", label: t("admin.ecosystem.columns.type"), width: 150, render: (row) => <StatusBadge value={row.activity_type} /> },
    { key: "related_mentor_name", label: t("admin.ecosystem.columns.mentor"), width: 150, render: (row) => row.related_mentor_name || "-" },
    { key: "created_by_name", label: t("admin.ecosystem.columns.createdBy"), width: 150, render: (row) => row.created_by_name || "-" },
  ], [t]);

  const awardColumns = useMemo(() => [
    { key: "award_name", label: t("admin.ecosystem.columns.award"), render: (row) => <span className="font-black text-slate-900">{row.award_name}</span> },
    { key: "award_type", label: t("admin.ecosystem.columns.type"), render: (row) => <StatusBadge value={row.award_type} /> },
    { key: "event_name", label: t("admin.ecosystem.columns.event"), render: (row) => row.event_name || "-" },
    { key: "awarded_at", label: t("admin.ecosystem.startupDetail.fields.awardedAt"), render: (row) => formatDate(row.awarded_at) },
    { key: "evidence_url", label: t("admin.ecosystem.columns.evidence"), render: (row) => row.evidence_url ? <a href={row.evidence_url} target="_blank" rel="noreferrer" className="font-bold text-indigo-700 hover:underline">{t("admin.ecosystem.columns.open")}</a> : "-" },
  ], [t]);

  const activityColumns = useMemo(() => [
    { key: "action", label: t("admin.ecosystem.columns.action") },
    { key: "table_name", label: t("admin.ecosystem.columns.table") },
    { key: "user_name", label: t("admin.ecosystem.columns.user"), render: (row) => row.user_name || row.user_email || "-" },
    { key: "created_at", label: t("admin.ecosystem.columns.created"), render: (row) => formatDate(row.created_at) },
  ], [t]);

  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">{t("common.loading")}</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  if (!startup) return null;

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate("/admin/incubation/startups")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={16} /> {t("common.back")}</button>
      <StartupHeader startup={startup} />
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
        {tabs.map((tab) => <button key={tab} type="button" onClick={() => openTab(tab)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${activeTab === tab ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"}`}>{t(`admin.ecosystem.startupDetail.tabs.${tab}`)}</button>)}
      </div>

      {activeTab === "overview" ? <Overview startup={startup} /> : null}
      {activeTab === "profile" ? <Panel title={t("admin.ecosystem.startupDetail.panels.profile")}><form onSubmit={saveProfile} className="space-y-4"><StartupForm form={profileForm} setForm={setProfileForm} /><div className="flex justify-end"><SaveButton saving={saving} /></div></form></Panel> : null}
      {activeTab === "founders" ? <Panel title={t("admin.ecosystem.startupDetail.panels.founders")}><AdminTable columns={foundersColumns} rows={startup.founders || []} emptyText={t("admin.ecosystem.startupDetail.empty.founders")} /></Panel> : null}
      {activeTab === "pipeline" ? <Panel title={t("admin.ecosystem.startupDetail.panels.pipeline")}><form onSubmit={moveStage} className="mb-4 grid gap-3 rounded-xl bg-slate-50 p-3 md:grid-cols-[1fr_150px_150px_1fr_auto]"><Field label={t("admin.ecosystem.startupDetail.fields.stage")}><SelectField value={moveForm.stage_id} onChange={(stage_id) => setMoveForm((prev) => ({ ...prev, stage_id }))} options={stageOptions} /></Field><Field label={t("admin.ecosystem.columns.action")}><SelectField value={moveForm.action} onChange={(action) => setMoveForm((prev) => ({ ...prev, action }))} options={["moved", "on_hold", "resumed", "graduated", "archived", "rejected"].map((value) => ({ value, label: t(`status.${value}`) || value }))} /></Field><Field label={t("admin.ecosystem.startupDetail.fields.entryStatus")}><SelectField value={moveForm.status} onChange={(status) => setMoveForm((prev) => ({ ...prev, status }))} options={["active", "on_hold", "completed", "archived"].map((value) => ({ value, label: t(`status.${value}`) || value }))} /></Field><Field label={t("admin.ecosystem.columns.reason")}><input className={inputClass} value={moveForm.reason || ""} onChange={(e) => setMoveForm((prev) => ({ ...prev, reason: e.target.value }))} /></Field><button disabled={saving} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{t("admin.ecosystem.columns.move")}</button></form><AdminTable columns={historyColumns} rows={startup.pipeline_history || []} emptyText={t("admin.ecosystem.startupDetail.empty.pipelineHistory")} /></Panel> : null}
      {activeTab === "progress" ? <Panel title={t("admin.ecosystem.startupDetail.panels.progressTimeline")} actions={<button type="button" onClick={() => { setProgressForm({ update_title: "", update_type: "product", progress_date: today(), visibility: "internal", update_content: "" }); setProgressModal(true); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white"><Plus size={16} /> {t("admin.ecosystem.common.add")}</button>}><AdminTable columns={progressColumns} rows={progressRows} emptyText={t("admin.ecosystem.startupDetail.empty.progress")} /></Panel> : null}
      {activeTab === "metrics" ? <Panel title={t("admin.ecosystem.startupDetail.panels.metricsSnapshots")} actions={<button type="button" onClick={() => { setMetricsForm({ snapshot_date: today(), product_stage: startup.product_stage || "idea", revenue_currency: "VND" }); setMetricsModal(true); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white"><Plus size={16} /> {t("admin.ecosystem.common.add")}</button>}><AdminTable columns={metricsColumns} rows={metricsRows} emptyText={t("admin.ecosystem.startupDetail.empty.metrics")} /></Panel> : null}
      {activeTab === "support" ? <div className="space-y-5"><Panel title={t("admin.ecosystem.startupDetail.panels.supportNeeds")} actions={<button type="button" onClick={() => { setSupportNeedForm({ need_type: "business", priority: "normal", title: "", description: "" }); setSupportNeedModal(true); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white"><Plus size={16} /> {t("admin.ecosystem.common.add")}</button>}><AdminTable columns={supportNeedColumns} rows={supportNeeds} emptyText={t("admin.ecosystem.startupDetail.empty.supportNeeds")} /></Panel><Panel title={t("admin.ecosystem.startupDetail.panels.supportActivities")} actions={<button type="button" onClick={() => { setSupportActivityForm({ activity_type: "mentor_session", activity_date: today(), title: "" }); setSupportActivityModal(true); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white"><Plus size={16} /> {t("admin.ecosystem.common.add")}</button>}><AdminTable columns={supportActivityColumns} rows={supportActivities} emptyText={t("admin.ecosystem.startupDetail.empty.supportActivities")} /></Panel></div> : null}
      {activeTab === "milestones" ? <Panel title={t("admin.ecosystem.startupDetail.panels.milestones")} actions={<button type="button" onClick={() => { setMilestoneForm({ title: "", milestone_type: "product", milestone_date: "" }); setMilestoneModal(true); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white"><Plus size={16} /> {t("admin.ecosystem.common.add")}</button>}><AdminTable columns={milestoneColumns} rows={startup.milestones || []} emptyText={t("admin.ecosystem.startupDetail.empty.milestones")} /></Panel> : null}
      {activeTab === "awards" ? <Panel title={t("admin.ecosystem.startupDetail.panels.awards")} actions={<button type="button" onClick={() => { setAwardForm({ award_name: "", award_type: "winner", awarded_at: today() }); setAwardModal(true); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white"><Plus size={16} /> {t("admin.ecosystem.common.add")}</button>}><AdminTable columns={awardColumns} rows={awards} emptyText={t("admin.ecosystem.startupDetail.empty.awards")} /></Panel> : null}
      {activeTab === "documents" ? <Panel title={t("admin.ecosystem.startupDetail.panels.documents")}><DocumentUploadForm upload={upload} setUpload={setUpload} onSubmit={uploadDocument} saving={saving} /><DocumentsTable documents={startup.documents || []} onDelete={setDeleteDoc} /></Panel> : null}
      {activeTab === "evaluation" ? <EvaluationSource source={startup.evaluation_source} /> : null}
      {activeTab === "activity" ? <Panel title={t("admin.ecosystem.startupDetail.panels.activityLogs")}><AdminTable columns={activityColumns} rows={startup.activity_logs || []} emptyText={t("admin.ecosystem.startupDetail.empty.activity")} /></Panel> : null}

      <FormModal open={milestoneModal} title={milestoneForm.id ? t("admin.ecosystem.startupDetail.modals.editMilestone") : t("admin.ecosystem.startupDetail.modals.addMilestone")} submitLabel={t("admin.ecosystem.common.save")} saving={saving} onClose={() => setMilestoneModal(false)} onSubmit={submitMilestone}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Title"><input required className={inputClass} value={milestoneForm.title || ""} onChange={(e) => setMilestoneForm((prev) => ({ ...prev, title: e.target.value }))} /></Field><Field label="Type"><SelectField value={milestoneForm.milestone_type || "product"} onChange={(milestone_type) => setMilestoneForm((prev) => ({ ...prev, milestone_type }))} options={milestoneTypeOptions} /></Field><Field label="Date"><input required type="date" className={inputClass} value={String(milestoneForm.milestone_date || "").slice(0, 10)} onChange={(e) => setMilestoneForm((prev) => ({ ...prev, milestone_date: e.target.value }))} /></Field><Field label="Evidence URL"><input className={inputClass} value={milestoneForm.evidence_url || ""} onChange={(e) => setMilestoneForm((prev) => ({ ...prev, evidence_url: e.target.value }))} /></Field><div className="sm:col-span-2"><Field label="Description"><textarea className={inputClass} rows={4} value={milestoneForm.description || ""} onChange={(e) => setMilestoneForm((prev) => ({ ...prev, description: e.target.value }))} /></Field></div></div>
      </FormModal>
      <FormModal open={progressModal} title={progressForm.id ? t("admin.ecosystem.startupDetail.modals.editProgress") : t("admin.ecosystem.startupDetail.modals.addProgress")} submitLabel={t("admin.ecosystem.common.save")} saving={saving} onClose={() => setProgressModal(false)} onSubmit={submitProgress}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Title"><input required className={inputClass} value={progressForm.update_title || ""} onChange={(e) => setProgressForm((prev) => ({ ...prev, update_title: e.target.value }))} /></Field><Field label="Type"><SelectField value={progressForm.update_type || "other"} onChange={(update_type) => setProgressForm((prev) => ({ ...prev, update_type }))} options={progressTypeOptions} /></Field><Field label="Date"><input required type="date" className={inputClass} value={String(progressForm.progress_date || "").slice(0, 10)} onChange={(e) => setProgressForm((prev) => ({ ...prev, progress_date: e.target.value }))} /></Field><Field label="Visibility"><SelectField value={progressForm.visibility || "internal"} onChange={(visibility) => setProgressForm((prev) => ({ ...prev, visibility }))} options={visibilityOptions} /></Field><div className="sm:col-span-2"><Field label="Content"><textarea required className={inputClass} rows={5} value={progressForm.update_content || ""} onChange={(e) => setProgressForm((prev) => ({ ...prev, update_content: e.target.value }))} /></Field></div></div>
      </FormModal>
      <FormModal open={metricsModal} title={t("admin.ecosystem.startupDetail.modals.addMetrics")} submitLabel={t("admin.ecosystem.common.save")} saving={saving} onClose={() => setMetricsModal(false)} onSubmit={submitMetrics}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Snapshot date"><input required type="date" className={inputClass} value={String(metricsForm.snapshot_date || "").slice(0, 10)} onChange={(e) => setMetricsForm((prev) => ({ ...prev, snapshot_date: e.target.value }))} /></Field><Field label="Product stage"><SelectField value={metricsForm.product_stage || "idea"} onChange={(product_stage) => setMetricsForm((prev) => ({ ...prev, product_stage }))} options={["idea", "prototype", "mvp", "beta", "launched", "revenue", "company"].map((value) => ({ value, label: value }))} /></Field><Field label="Users"><input type="number" min="0" className={inputClass} value={metricsForm.users_count || ""} onChange={(e) => setMetricsForm((prev) => ({ ...prev, users_count: e.target.value }))} /></Field><Field label="Customers"><input type="number" min="0" className={inputClass} value={metricsForm.customers_count || ""} onChange={(e) => setMetricsForm((prev) => ({ ...prev, customers_count: e.target.value }))} /></Field><Field label="Revenue"><input type="number" min="0" className={inputClass} value={metricsForm.revenue_amount || ""} onChange={(e) => setMetricsForm((prev) => ({ ...prev, revenue_amount: e.target.value }))} /></Field><Field label="Currency"><input className={inputClass} value={metricsForm.revenue_currency || "VND"} onChange={(e) => setMetricsForm((prev) => ({ ...prev, revenue_currency: e.target.value }))} /></Field><Field label="Team size"><input type="number" min="0" className={inputClass} value={metricsForm.team_size || ""} onChange={(e) => setMetricsForm((prev) => ({ ...prev, team_size: e.target.value }))} /></Field><div className="rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-600"><label className="mr-4"><input type="checkbox" checked={!!metricsForm.mvp_completed} onChange={(e) => setMetricsForm((prev) => ({ ...prev, mvp_completed: e.target.checked }))} /> MVP</label><label className="mr-4"><input type="checkbox" checked={!!metricsForm.market_validated} onChange={(e) => setMetricsForm((prev) => ({ ...prev, market_validated: e.target.checked }))} /> Validated</label><label><input type="checkbox" checked={!!metricsForm.has_demo} onChange={(e) => setMetricsForm((prev) => ({ ...prev, has_demo: e.target.checked }))} /> Demo</label></div><div className="sm:col-span-2"><Field label="Note"><textarea className={inputClass} rows={3} value={metricsForm.note || ""} onChange={(e) => setMetricsForm((prev) => ({ ...prev, note: e.target.value }))} /></Field></div></div>
      </FormModal>
      <FormModal open={supportNeedModal} title={t("admin.ecosystem.startupDetail.modals.addSupportNeed")} submitLabel={t("admin.ecosystem.common.save")} saving={saving} onClose={() => setSupportNeedModal(false)} onSubmit={submitSupportNeed}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Type"><SelectField value={supportNeedForm.need_type || "other"} onChange={(need_type) => setSupportNeedForm((prev) => ({ ...prev, need_type }))} options={supportNeedTypeOptions} /></Field><Field label="Priority"><SelectField value={supportNeedForm.priority || "normal"} onChange={(priority) => setSupportNeedForm((prev) => ({ ...prev, priority }))} options={supportPriorityOptions} /></Field><div className="sm:col-span-2"><Field label="Title"><input required className={inputClass} value={supportNeedForm.title || ""} onChange={(e) => setSupportNeedForm((prev) => ({ ...prev, title: e.target.value }))} /></Field></div><div className="sm:col-span-2"><Field label="Description"><textarea required className={inputClass} rows={5} value={supportNeedForm.description || ""} onChange={(e) => setSupportNeedForm((prev) => ({ ...prev, description: e.target.value }))} /></Field></div></div>
      </FormModal>
      <FormModal open={supportActivityModal} title={t("admin.ecosystem.startupDetail.modals.addSupportActivity")} submitLabel={t("admin.ecosystem.common.save")} saving={saving} onClose={() => setSupportActivityModal(false)} onSubmit={submitSupportActivity}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Type"><SelectField value={supportActivityForm.activity_type || "other"} onChange={(activity_type) => setSupportActivityForm((prev) => ({ ...prev, activity_type }))} options={supportActivityTypeOptions} /></Field><Field label="Date"><input required type="date" className={inputClass} value={String(supportActivityForm.activity_date || "").slice(0, 10)} onChange={(e) => setSupportActivityForm((prev) => ({ ...prev, activity_date: e.target.value }))} /></Field><div className="sm:col-span-2"><Field label="Title"><input required className={inputClass} value={supportActivityForm.title || ""} onChange={(e) => setSupportActivityForm((prev) => ({ ...prev, title: e.target.value }))} /></Field></div><Field label="Support need"><SelectField value={supportActivityForm.support_need_id || ""} onChange={(support_need_id) => setSupportActivityForm((prev) => ({ ...prev, support_need_id }))} options={[{ value: "", label: "None" }, ...supportNeeds.map((need) => ({ value: String(need.id), label: need.title }))]} /></Field><Field label="Related mentor ID"><input type="number" min="1" className={inputClass} value={supportActivityForm.related_mentor_id || ""} onChange={(e) => setSupportActivityForm((prev) => ({ ...prev, related_mentor_id: e.target.value }))} /></Field><div className="sm:col-span-2"><Field label="Description"><textarea className={inputClass} rows={4} value={supportActivityForm.description || ""} onChange={(e) => setSupportActivityForm((prev) => ({ ...prev, description: e.target.value }))} /></Field></div></div>
      </FormModal>
      <FormModal open={awardModal} title={t("admin.ecosystem.startupDetail.modals.recordAward")} submitLabel={t("admin.ecosystem.common.save")} saving={saving} onClose={() => setAwardModal(false)} onSubmit={submitAward}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Award name"><input required className={inputClass} value={awardForm.award_name || ""} onChange={(e) => setAwardForm((prev) => ({ ...prev, award_name: e.target.value }))} /></Field><Field label="Type"><SelectField value={awardForm.award_type || "other"} onChange={(award_type) => setAwardForm((prev) => ({ ...prev, award_type }))} options={awardTypeOptions} /></Field><Field label="Awarded at"><input required type="date" className={inputClass} value={String(awardForm.awarded_at || "").slice(0, 10)} onChange={(e) => setAwardForm((prev) => ({ ...prev, awarded_at: e.target.value }))} /></Field><Field label="Event ID"><input type="number" min="1" className={inputClass} value={awardForm.event_id || ""} onChange={(e) => setAwardForm((prev) => ({ ...prev, event_id: e.target.value }))} /></Field><Field label="Evidence URL"><input className={inputClass} value={awardForm.evidence_url || ""} onChange={(e) => setAwardForm((prev) => ({ ...prev, evidence_url: e.target.value }))} /></Field><div className="sm:col-span-2"><Field label="Description"><textarea className={inputClass} rows={4} value={awardForm.description || ""} onChange={(e) => setAwardForm((prev) => ({ ...prev, description: e.target.value }))} /></Field></div></div>
      </FormModal>
      <ConfirmDialog isOpen={!!deleteDoc} title={t("admin.ecosystem.startupDetail.modals.deleteDocument")} subtitle={deleteDoc?.file_name || ""} variant="delete" color="red" yesLabel={t("admin.ecosystem.common.delete")} noLabel={t("admin.ecosystem.common.cancel")} onYes={confirmDeleteDoc} onNo={() => setDeleteDoc(null)} onClose={() => setDeleteDoc(null)} />
      <ConfirmDialog isOpen={!!deleteMilestone} title={t("admin.ecosystem.startupDetail.modals.deleteMilestone")} subtitle={deleteMilestone?.title || ""} variant="delete" color="red" yesLabel={t("admin.ecosystem.common.delete")} noLabel={t("admin.ecosystem.common.cancel")} onYes={confirmDeleteMilestone} onNo={() => setDeleteMilestone(null)} onClose={() => setDeleteMilestone(null)} />
      <ConfirmDialog isOpen={!!deleteProgressTarget} title={t("admin.ecosystem.startupDetail.modals.deleteProgress")} subtitle={deleteProgressTarget?.update_title || ""} variant="delete" color="red" yesLabel={t("admin.ecosystem.common.delete")} noLabel={t("admin.ecosystem.common.cancel")} onYes={confirmDeleteProgress} onNo={() => setDeleteProgressTarget(null)} onClose={() => setDeleteProgressTarget(null)} />
    </div>
  );
}

function Overview({ startup }) {
  const { t } = useTranslation();
  const rows = [
    [t("admin.ecosystem.columns.sourceGroup"), startup.group_name || "-"],
    [t("admin.ecosystem.columns.class"), startup.class_code || "-"],
    [t("admin.ecosystem.columns.semester"), startup.semester_code || "-"],
    [t("admin.ecosystem.columns.score"), startup.selected_score ?? "-"],
    [t("admin.ecosystem.columns.selectedReason"), startup.selected_reason || "-"],
    [t("admin.ecosystem.columns.currentStageLabel"), startup.current_stage_name || "-"],
    [t("admin.ecosystem.columns.updated"), formatDate(startup.updated_at)],
  ];
  return <Panel title={t("admin.ecosystem.startupDetail.panels.overview")}><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><div className="mt-1 text-sm font-bold text-slate-800">{value}</div></div>)}</div></Panel>;
}

function EvaluationSource({ source }) {
  const { t } = useTranslation();
  if (!source) return <Panel title={t("admin.ecosystem.startupDetail.panels.evaluationSource")}><EmptyPlaceholder text={t("admin.ecosystem.startupDetail.empty.notLinkedGroup")} /></Panel>;
  return <Panel title={t("admin.ecosystem.startupDetail.panels.evaluationSource")}><div className="space-y-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-sm font-black text-slate-900">{source.topic || source.group_name}</p><p className="mt-1 text-sm text-slate-500">{source.topic_desc || source.category || t("admin.ecosystem.columns.noTopicDescription")}</p></div><div className="rounded-xl bg-indigo-50 p-4 text-sm font-bold text-indigo-700">{t("admin.ecosystem.columns.averageScore")}: {source.average_score ?? "-"}</div><pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-4 text-xs text-slate-100">{source.feedback_summary || t("admin.ecosystem.columns.noFeedbackSummary")}</pre></div></Panel>;
}
