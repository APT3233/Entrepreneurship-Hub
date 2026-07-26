import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import { useToast } from "@/components/ui/Toast";
import AdminTable from "@/pages/admin/components/AdminTable";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { Panel, SelectField, StartupHeader } from "./components";
import { formatDate } from "@/utils/dateTimeDisplay";
import { useTranslation } from "@/context/TranslationContext";

export default function StartupEcosystemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  const connectionTypeOptions = useMemo(() => [
    "introduction", "mentoring", "pilot", "customer", "investor_interest", "incubation_program", "partnership", "other"
  ].map((value) => ({ value, label: t(`status.${value}`) || value })), [t]);

  const connectionStatusOptions = useMemo(() => [
    "proposed", "contacted", "in_progress", "successful", "rejected", "cancelled"
  ].map((value) => ({ value, label: t(`status.${value}`) || value })), [t]);

  const applicationStatusOptions = useMemo(() => [
    "interested", "applied", "shortlisted", "accepted", "rejected", "withdrawn"
  ].map((value) => ({ value, label: t(`status.${value}`) || value })), [t]);

  const [startup, setStartup] = useState(null);
  const [connections, setConnections] = useState([]);
  const [applications, setApplications] = useState([]);
  const [connectionForm, setConnectionForm] = useState({ partner_id: "", connection_type: "introduction", status: "proposed", contact_date: "", follow_up_date: "", note: "", outcome: "" });
  const [applicationForm, setApplicationForm] = useState({ opportunity_id: "", application_status: "interested", application_note: "" });
  const [connectionModal, setConnectionModal] = useState(false);
  const [applicationModal, setApplicationModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [startupRes, partnerRes, appRes] = await Promise.all([
        IncubationApi.getStartup(id),
        IncubationApi.listStartupPartners(id, { limit: 100 }),
        IncubationApi.listStartupOpportunities(id, { limit: 100 }),
      ]);
      setStartup(startupRes?.data || null);
      setConnections(partnerRes?.data || []);
      setApplications(appRes?.data || []);
    } catch (err) {
      setError(err.message || t("admin.ecosystem.startupEcosystem.toasts.loadError"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  const submitConnection = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.createStartupPartner(id, { ...connectionForm, partner_id: Number(connectionForm.partner_id), contact_date: connectionForm.contact_date || null, follow_up_date: connectionForm.follow_up_date || null });
      toast.success(t("admin.ecosystem.startupEcosystem.toasts.connectionAdded"));
      setConnectionModal(false);
      setConnectionForm({ partner_id: "", connection_type: "introduction", status: "proposed", contact_date: "", follow_up_date: "", note: "", outcome: "" });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.startupEcosystem.toasts.connectionAddError"));
    } finally {
      setSaving(false);
    }
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.applyOpportunity(id, applicationForm.opportunity_id, applicationForm);
      toast.success(t("admin.ecosystem.startupEcosystem.toasts.applicationSaved"));
      setApplicationModal(false);
      setApplicationForm({ opportunity_id: "", application_status: "interested", application_note: "" });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.startupEcosystem.toasts.applicationSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const updateConnection = async (row, status) => {
    try {
      await IncubationApi.updatePartnerConnectionStatus(row.id, { status, follow_up_date: row.follow_up_date || null, note: row.note || null, outcome: row.outcome || null });
      toast.success(t("admin.ecosystem.startupEcosystem.toasts.connectionUpdated"));
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.startupEcosystem.toasts.connectionUpdateError"));
    }
  };

  const updateApplication = async (row, application_status) => {
    try {
      await IncubationApi.updateOpportunityApplicationStatus(row.id, { application_status, result_note: row.result_note || null });
      toast.success(t("admin.ecosystem.startupEcosystem.toasts.applicationUpdated"));
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.ecosystem.startupEcosystem.toasts.applicationUpdateError"));
    }
  };

  const connectionColumns = useMemo(() => [
    { key: "partner_name", label: t("admin.ecosystem.startupEcosystem.columns.partner"), render: (row) => <span className="font-black text-slate-900">{row.partner_name}</span> },
    { key: "partner_type", label: t("admin.ecosystem.startupEcosystem.columns.partnerType"), render: (row) => <StatusBadge value={row.partner_type} /> },
    { key: "connection_type", label: t("admin.ecosystem.startupEcosystem.columns.connection"), render: (row) => <StatusBadge value={row.connection_type} /> },
    { key: "status", label: t("admin.ecosystem.startupEcosystem.columns.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "contact_date", label: t("admin.ecosystem.startupEcosystem.columns.contact"), render: (row) => formatDate(row.contact_date) },
    { key: "follow_up_date", label: t("admin.ecosystem.startupEcosystem.columns.followUp"), render: (row) => formatDate(row.follow_up_date) },
    { key: "outcome", label: t("admin.ecosystem.startupEcosystem.columns.outcome"), render: (row) => row.outcome || row.note || "-" },
    { key: "actions", label: "", width: 160, render: (row) => <div className="flex justify-end gap-1">{row.status !== "in_progress" ? <button type="button" onClick={() => updateConnection(row, "in_progress")} className="rounded-lg px-2 py-1 text-xs font-bold text-accent hover:bg-accent-bg">{t("admin.ecosystem.startupEcosystem.actions.progress")}</button> : null}{row.status !== "successful" ? <button type="button" onClick={() => updateConnection(row, "successful")} className="rounded-lg px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50">{t("admin.ecosystem.startupEcosystem.actions.success")}</button> : null}</div> },
  ], [t]);

  const applicationColumns = useMemo(() => [
    { key: "title", label: t("admin.ecosystem.startupEcosystem.columns.opportunity"), render: (row) => <span className="font-black text-slate-900">{row.title || row.opportunity_title}</span> },
    { key: "opportunity_type", label: t("admin.ecosystem.startupEcosystem.columns.type"), render: (row) => <StatusBadge value={row.opportunity_type} /> },
    { key: "partner_name", label: t("admin.ecosystem.startupEcosystem.columns.partner"), render: (row) => row.partner_name || "-" },
    { key: "deadline", label: t("admin.ecosystem.startupEcosystem.columns.deadline"), render: (row) => formatDate(row.deadline) },
    { key: "application_status", label: t("admin.ecosystem.startupEcosystem.columns.status"), render: (row) => <StatusBadge value={row.application_status} /> },
    { key: "submitted_at", label: t("admin.ecosystem.startupEcosystem.columns.submitted"), render: (row) => formatDate(row.submitted_at) },
    { key: "actions", label: "", width: 170, render: (row) => <div className="flex justify-end gap-1">{row.application_status !== "accepted" ? <button type="button" onClick={() => updateApplication(row, "accepted")} className="rounded-lg px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50">{t("admin.ecosystem.startupEcosystem.actions.accept")}</button> : null}{row.application_status !== "rejected" ? <button type="button" onClick={() => updateApplication(row, "rejected")} className="rounded-lg px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50">{t("admin.ecosystem.startupEcosystem.actions.reject")}</button> : null}</div> },
  ], [t]);

  if (loading) return <div className="rounded-card bg-surface p-8 text-center text-sm text-slate-400">{t("admin.ecosystem.common.loading")}</div>;
  if (error) return <div className="rounded-card bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  if (!startup) return null;

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate(`/admin/incubation/startups/${id}`)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={16} /> {t("admin.ecosystem.common.back")}</button>
      <StartupHeader startup={startup} />
      <Panel title={t("admin.ecosystem.startupEcosystem.panels.partnerConnections")} actions={<button type="button" onClick={() => setConnectionModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-white"><Plus size={16} /> {t("admin.ecosystem.startupEcosystem.actions.addConnection")}</button>}>
        <AdminTable columns={connectionColumns} rows={connections} emptyText={t("admin.ecosystem.startupEcosystem.empty.noPartnerConnections")} />
      </Panel>
      <Panel title={t("admin.ecosystem.startupEcosystem.panels.opportunityApplications")} actions={<button type="button" onClick={() => setApplicationModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-white"><Plus size={16} /> {t("admin.ecosystem.startupEcosystem.actions.apply")}</button>}>
        <AdminTable columns={applicationColumns} rows={applications} emptyText={t("admin.ecosystem.startupEcosystem.empty.noOpportunityApplications")} />
      </Panel>
      <FormModal open={connectionModal} title={t("admin.ecosystem.startupEcosystem.modals.addConnectionTitle")} submitLabel={t("admin.ecosystem.common.save")} saving={saving} onClose={() => setConnectionModal(false)} onSubmit={submitConnection}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.ecosystem.startupEcosystem.fields.partnerId")}><input required type="number" className={inputClass} value={connectionForm.partner_id} onChange={(e) => setConnectionForm((prev) => ({ ...prev, partner_id: e.target.value }))} /></Field>
          <Field label={t("admin.ecosystem.startupEcosystem.fields.connectionType")}><SelectField value={connectionForm.connection_type} onChange={(connection_type) => setConnectionForm((prev) => ({ ...prev, connection_type }))} options={connectionTypeOptions} /></Field>
          <Field label={t("admin.ecosystem.startupEcosystem.fields.status")}><SelectField value={connectionForm.status} onChange={(status) => setConnectionForm((prev) => ({ ...prev, status }))} options={connectionStatusOptions} /></Field>
          <Field label={t("admin.ecosystem.startupEcosystem.fields.contactDate")}><input type="date" className={inputClass} value={connectionForm.contact_date} onChange={(e) => setConnectionForm((prev) => ({ ...prev, contact_date: e.target.value }))} /></Field>
          <Field label={t("admin.ecosystem.startupEcosystem.fields.followUpDate")}><input type="date" className={inputClass} value={connectionForm.follow_up_date} onChange={(e) => setConnectionForm((prev) => ({ ...prev, follow_up_date: e.target.value }))} /></Field>
          <div className="sm:col-span-2"><Field label={t("admin.ecosystem.startupEcosystem.fields.note")}><textarea rows={3} className={inputClass} value={connectionForm.note} onChange={(e) => setConnectionForm((prev) => ({ ...prev, note: e.target.value }))} /></Field></div>
          <div className="sm:col-span-2"><Field label={t("admin.ecosystem.startupEcosystem.fields.outcome")}><textarea rows={3} className={inputClass} value={connectionForm.outcome} onChange={(e) => setConnectionForm((prev) => ({ ...prev, outcome: e.target.value }))} /></Field></div>
        </div>
      </FormModal>
      <FormModal open={applicationModal} title={t("admin.ecosystem.startupEcosystem.modals.applyOpportunityTitle")} submitLabel={t("admin.ecosystem.common.save")} saving={saving} onClose={() => setApplicationModal(false)} onSubmit={submitApplication}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.ecosystem.startupEcosystem.fields.opportunityId")}><input required type="number" className={inputClass} value={applicationForm.opportunity_id} onChange={(e) => setApplicationForm((prev) => ({ ...prev, opportunity_id: e.target.value }))} /></Field>
          <Field label={t("admin.ecosystem.startupEcosystem.fields.status")}><SelectField value={applicationForm.application_status} onChange={(application_status) => setApplicationForm((prev) => ({ ...prev, application_status }))} options={applicationStatusOptions.slice(0, 2)} /></Field>
          <div className="sm:col-span-2"><Field label={t("admin.ecosystem.startupEcosystem.fields.note")}><textarea rows={4} className={inputClass} value={applicationForm.application_note} onChange={(e) => setApplicationForm((prev) => ({ ...prev, application_note: e.target.value }))} /></Field></div>
        </div>
      </FormModal>
    </div>
  );
}
