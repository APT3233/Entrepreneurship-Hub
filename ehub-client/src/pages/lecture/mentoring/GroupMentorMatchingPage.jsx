import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { useParams } from "react-router-dom";
import MentorMatchingApi from "@/api/mentorMatching";
import { useToast } from "@/components/ui/Toast";
import AdminTable from "@/pages/admin/components/AdminTable";
import FormModal from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { MatchingRequestForm, ScoreBadge } from "@/pages/admin/mentor-matching/components";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function GroupMentorMatchingPage() {
  const { groupId } = useParams();
  const toast = useToast();
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ group_id: groupId, preferred_mentor_type: "any", support_needed: "", priority: "normal", required_expertise: [] });
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => { setLoading(true); setError(""); try { const res = await MentorMatchingApi.listRequests({ group_id: groupId, limit: 20 }); setRows(res?.data || []); } catch (err) { setError(err.message || "Unable to load matching requests"); } finally { setLoading(false); } }, [groupId]);
  useEffect(() => { load(); }, [load]);
  const submit = async (event) => { event.preventDefault(); setSaving(true); try { await MentorMatchingApi.createRequest({ ...form, group_id: Number(groupId) }); toast.success("Matching request created"); setModalOpen(false); await load(); } catch (err) { toast.error(err.message || "Unable to create request"); } finally { setSaving(false); } };
  const columns = useMemo(() => [
    { key: "support_needed", label: "Support needed", render: (row) => <span className="font-medium text-slate-800">{row.support_needed}</span> },
    { key: "preferred_mentor_type", label: "Preferred", render: (row) => <StatusBadge value={row.preferred_mentor_type} /> },
    { key: "priority", label: "Priority", render: (row) => <StatusBadge value={row.priority} /> },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "suggestion_count", label: "Suggestions" },
    { key: "top_score", label: "Top score", render: (row) => row.top_score ? <ScoreBadge score={row.top_score} /> : "-" },
    { key: "created_at", label: "Created", render: (row) => formatDate(row.created_at) },
    { key: "actions", label: "", render: (row) => <button className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50" onClick={async (event) => { event.stopPropagation(); await MentorMatchingApi.generate(row.id, { matching_method: "hybrid" }); toast.success("Suggestions generated"); await load(); }}><Sparkles size={16} /></button> },
  ], [load, toast]);
  return <div className="space-y-4"><div className="flex justify-end"><button type="button" onClick={() => setModalOpen(true)} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-black text-white hover:bg-teal-700">Create matching request</button></div><AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText="No matching requests" /><FormModal open={modalOpen} title="Request mentor matching" submitLabel="Create" saving={saving} onClose={() => setModalOpen(false)} onSubmit={submit}><MatchingRequestForm form={form} setForm={setForm} lockedGroupId={groupId} groups={[{ id: groupId, group_name: `Group #${groupId}` }]} expertise={[]} /></FormModal></div>;
}
