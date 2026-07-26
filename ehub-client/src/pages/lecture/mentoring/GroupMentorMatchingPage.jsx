import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { useParams } from "react-router-dom";
import MentorMatchingApi from "@/api/mentorMatching";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FormModal from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { MatchingRequestForm, ScoreBadge } from "@/pages/admin/mentor-matching/components";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function GroupMentorMatchingPage() {
  const { groupId } = useParams();
  const toast = useToast();
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ group_id: groupId, preferred_mentor_type: "any", support_needed: "", priority: "normal", required_expertise: [] });
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await MentorMatchingApi.listRequests({ group_id: groupId, limit: 20 });
      setRows(res?.data || []);
    } catch (err) {
      setError(err.message || t("lecturer.mentoringPage.matchingLoadError"));
    } finally {
      setLoading(false);
    }
  }, [groupId, t]);
  useEffect(() => { load(); }, [load]);
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await MentorMatchingApi.createRequest({ ...form, group_id: Number(groupId) });
      toast.success(t("lecturer.mentoringPage.matchingCreated"));
      setModalOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message || t("lecturer.mentoringPage.matchingError"));
    } finally {
      setSaving(false);
    }
  };
  const columns = useMemo(() => [
    { key: "support_needed", label: t("lecturer.mentoringPage.columns.supportNeeded"), render: (row) => <span className="font-medium text-slate-800">{row.support_needed}</span> },
    { key: "preferred_mentor_type", label: t("lecturer.mentoringPage.columns.preferred"), render: (row) => <StatusBadge value={row.preferred_mentor_type} /> },
    { key: "priority", label: t("lecturer.mentoringPage.fields.priority"), render: (row) => <StatusBadge value={row.priority} /> },
    { key: "status", label: t("lecturer.mentoringPage.columns.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "suggestion_count", label: t("lecturer.mentoringPage.columns.suggestions") },
    { key: "top_score", label: t("lecturer.mentoringPage.columns.topScore"), render: (row) => row.top_score ? <ScoreBadge score={row.top_score} /> : "-" },
    { key: "created_at", label: t("lecturer.mentoringPage.columns.created"), render: (row) => formatDate(row.created_at) },
    { key: "actions", label: "", render: (row) => <button className="rounded-lg p-2 text-accent-600 hover:bg-accent-50" onClick={async (event) => { event.stopPropagation(); await MentorMatchingApi.generate(row.id, { matching_method: "hybrid" }); toast.success(t("lecturer.mentoringPage.suggestionsGenerated")); await load(); }}><Sparkles size={16} /></button> },
  ], [load, toast, t]);
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button type="button" onClick={() => setModalOpen(true)} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-black text-white hover:bg-teal-700">{t("lecturer.mentoringPage.createMatchingBtn")}</button></div>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("lecturer.mentoringPage.emptyMatching")} />
      <FormModal open={modalOpen} title={t("lecturer.mentoringPage.requestMatchingTitle")} submitLabel={t("admin.ecosystem.common.create")} saving={saving} onClose={() => setModalOpen(false)} onSubmit={submit}>
        <MatchingRequestForm form={form} setForm={setForm} lockedGroupId={groupId} groups={[{ id: groupId, group_name: `Group #${groupId}` }]} expertise={[]} />
      </FormModal>
    </div>
  );
}
