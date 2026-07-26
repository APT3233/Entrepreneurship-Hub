import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { SelectField } from "@/pages/admin/incubation/components";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Megaphone } from "lucide-react";
import { formatDate } from "@/utils/dateTimeDisplay";

const statusValues = ["interested", "applied"];

export default function StudentOpportunitiesPage() {
  const { id } = useParams();
  const toast = useToast();
  const { t } = useTranslation();
  const [startups, setStartups] = useState([]);
  const [selectedStartupId, setSelectedStartupId] = useState(id || "");
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [applyTarget, setApplyTarget] = useState(null);
  const [applyForm, setApplyForm] = useState({ application_status: "interested", application_note: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const statusOptions = useMemo(() => statusValues.map((value) => ({ value, label: t(`status.${value}`) || value })), [t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [startupRes, opportunityRes] = await Promise.all([
        IncubationApi.myStartups({ limit: 100 }),
        IncubationApi.studentOpportunities({ limit: 100, status: "open" }),
      ]);
      const startupRows = startupRes?.data || [];
      const currentStartupId = selectedStartupId || id || startupRows[0]?.id || "";
      setStartups(startupRows);
      setSelectedStartupId(currentStartupId ? String(currentStartupId) : "");
      setOpportunities(opportunityRes?.data || []);
      if (currentStartupId) {
        const appRes = await IncubationApi.myStartupOpportunities(currentStartupId, { limit: 100 });
        setApplications(appRes?.data || []);
      } else setApplications([]);
    } catch (err) {
      setError(err.message || t("student.startupProfile.opportunitiesLoadError"));
    } finally {
      setLoading(false);
    }
  }, [id, selectedStartupId, t]);

  useEffect(() => { load(); }, [load]);

  const appliedMap = useMemo(() => new Map((applications || []).map((row) => [Number(row.opportunity_id), row])), [applications]);

  const submitApply = async (event) => {
    event.preventDefault();
    if (!selectedStartupId || !applyTarget) return;
    setSaving(true);
    try {
      await IncubationApi.applyMyStartupOpportunity(selectedStartupId, applyTarget.id, applyForm);
      toast.success(t("student.startupProfile.applicationSaved"));
      setApplyTarget(null);
      setApplyForm({ application_status: "interested", application_note: "" });
      await load();
    } catch (err) {
      toast.error(err.message || t("student.startupProfile.applicationError"));
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => [
    { key: "title", label: t("student.startupProfile.columns.opportunity"), render: (row) => <div><p className="font-semibold text-text-primary">{row.title}</p><p className="mt-1 text-sm text-text-secondary">{row.description || row.partner_name || "-"}</p></div> },
    { key: "opportunity_type", label: t("admin.ecosystem.common.type"), render: (row) => <StatusBadge value={row.opportunity_type} /> },
    { key: "partner_name", label: t("student.startupProfile.columns.partner"), render: (row) => row.partner_name || "-" },
    { key: "deadline", label: t("student.startupProfile.columns.deadline"), render: (row) => formatDate(row.deadline) },
    { key: "visibility", label: t("admin.ecosystem.common.visibility"), render: (row) => <StatusBadge value={row.visibility} /> },
    { key: "application", label: t("student.startupProfile.columns.application"), render: (row) => appliedMap.get(Number(row.id)) ? <StatusBadge value={appliedMap.get(Number(row.id)).application_status} /> : "-" },
    { key: "actions", label: "", width: 100, render: (row) => <button type="button" disabled={!selectedStartupId} onClick={() => { setApplyTarget(row); setApplyForm({ application_status: appliedMap.get(Number(row.id))?.application_status || "interested", application_note: appliedMap.get(Number(row.id))?.application_note || "" }); }} className="rounded-lg px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent-50 disabled:opacity-40">{t("student.startupProfile.actions.apply")}</button> },
  ], [appliedMap, selectedStartupId, t]);

  if (loading) return <div className="rounded-2xl bg-surface p-8 text-center text-sm text-text-muted">{t("common.loading")}</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;

  return (
    <div className="space-y-5">
      <PageHeader title="Cơ hội" description="Các cuộc thi và chương trình ươm tạo đang mở" />
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-text-primary">{t("student.startupProfile.panels.opportunities")}</h2>
          <select className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary" value={selectedStartupId} onChange={(e) => setSelectedStartupId(e.target.value)}>{startups.map((startup) => <option key={startup.id} value={startup.id}>{startup.startup_name}</option>)}</select>
        </div>
        {opportunities.length === 0 ? (
          <EmptyState
            icon={<Megaphone size={24} />}
            title="Chưa có cơ hội nào đang mở"
            description="Các cuộc thi, chương trình ươm tạo… sẽ hiện ở đây khi được mở."
          />
        ) : (
          <AdminTable columns={columns} rows={opportunities} emptyText={t("student.startupProfile.empty.opportunities")} />
        )}
      </div>
      <FormModal open={!!applyTarget} title={applyTarget?.title || t("student.startupProfile.modals.applyOpportunity")} submitLabel={t("common.save")} saving={saving} onClose={() => setApplyTarget(null)} onSubmit={submitApply}>
        <div className="grid gap-4">
          <Field label={t("common.status")}><SelectField value={applyForm.application_status} onChange={(application_status) => setApplyForm((prev) => ({ ...prev, application_status }))} options={statusOptions} /></Field>
          <Field label={t("student.startupProfile.fields.note")}><textarea rows={4} className={inputClass} value={applyForm.application_note} onChange={(e) => setApplyForm((prev) => ({ ...prev, application_note: e.target.value }))} /></Field>
        </div>
      </FormModal>
    </div>
  );
}
