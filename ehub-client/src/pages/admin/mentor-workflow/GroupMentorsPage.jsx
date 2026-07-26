import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminMentorApi from "@/api/adminMentors";
import groupService from "@/api/adminStudentGroup/groupService";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import FormModal from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import { MentorAssignmentForm } from "./components";

export default function GroupMentorsPage() {
  const { t } = useTranslation();
  const { groupId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({ mentor_id: "", assignment_type: "primary", expected_sessions: null, note: "" });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [assignmentsRes, mentorsRes, groupsRes] = await Promise.all([
        MentorWorkflowApi.adminGroupAssignments(groupId),
        AdminMentorApi.getMentors({ limit: 100, status: "active" }),
        groupService.list({ limit: 100 }),
      ]);
      setData(assignmentsRes?.data || null);
      setMentors(mentorsRes?.data || []);
      setGroups(groupsRes?.data || []);
    } catch (err) {
      toast.error(err.message || t("admin.mentorWorkflow.groupMentors.loadError"));
    } finally {
      setLoading(false);
    }
  }, [groupId, t, toast]);

  useEffect(() => { load(); }, [load]);

  const assign = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await MentorWorkflowApi.adminCreateGroupAssignment(groupId, form);
      toast.success(t("admin.mentorWorkflow.groupMentors.assigned"));
      setModalOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.mentorWorkflow.groupMentors.assignError"));
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => [
    { key: "mentor_name", label: t("admin.mentorWorkflow.groupMentors.columns.mentor"), render: (row) => <span className="font-black text-slate-900">{row.mentor_name}</span> },
    { key: "mentor_type", label: t("admin.mentorWorkflow.assignments.columns.mentorType"), render: (row) => <StatusBadge value={row.mentor_type} /> },
    { key: "assignment_type", label: t("admin.mentorWorkflow.assignments.columns.type"), render: (row) => <StatusBadge value={row.assignment_type} /> },
    { key: "status", label: t("admin.mentorWorkflow.groupMentors.columns.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "created_at", label: t("common.created"), render: (row) => formatDate(row.created_at) },
  ], [t]);

  if (loading) return <div className="rounded-card bg-surface p-8 text-center text-sm text-slate-400">{t("common.loading")}...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold text-slate-700"><ArrowLeft size={16} /> {t("common.back")}</button>
        <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white"><Plus size={16} /> {t("admin.mentorWorkflow.groupMentors.assignMentor")}</button>
      </div>
      <section className="rounded-card border border-border bg-surface p-5">
        <h2 className="text-xl font-black text-slate-900">{data?.group?.group_name}</h2>
        <p className="mt-1 text-sm text-slate-500">{data?.group?.topic || t("admin.mentorWorkflow.common.noTopic")} · {data?.group?.class_code}</p>
      </section>
      <AdminTable columns={columns} rows={data?.assignments || []} emptyText={t("admin.mentorWorkflow.groupMentors.emptyText")} />
      <FormModal open={modalOpen} title={t("admin.mentorWorkflow.assignments.modalTitle")} submitLabel={t("admin.mentorWorkflow.assignments.modalSubmit")} saving={saving} onClose={() => setModalOpen(false)} onSubmit={assign}>
        <MentorAssignmentForm form={form} setForm={setForm} mentors={mentors} groups={groups} lockedGroupId={groupId} />
      </FormModal>
    </div>
  );
}
