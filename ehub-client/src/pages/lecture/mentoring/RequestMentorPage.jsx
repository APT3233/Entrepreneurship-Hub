import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import { Field, inputClass } from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { priorityOptions, requestRoleOptions, Select } from "@/pages/admin/mentor-workflow/components";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function RequestMentorPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [form, setForm] = useState({ requested_role: "any", requested_expertise: "", problem_statement: "", support_needed: "", priority: "normal" });
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await MentorWorkflowApi.lecturerAssignmentRequests({ group_id: groupId, limit: 50 });
      setRequests(res?.data || []);
    } finally {
      setLoadingRequests(false);
    }
  }, [groupId]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await MentorWorkflowApi.lecturerRequestMentor(groupId, { ...form, requested_expertise: form.requested_expertise ? form.requested_expertise.split(",").map((item) => item.trim()).filter(Boolean) : null });
      toast.success(t("lecturer.mentoringPage.requestCreated"));
      setForm({ requested_role: "any", requested_expertise: "", problem_statement: "", support_needed: "", priority: "normal" });
      await loadRequests();
    } catch (err) {
      toast.error(err.message || t("lecturer.mentoringPage.requestError"));
    } finally {
      setSaving(false);
    }
  };

  const cancelRequest = async (row) => {
    try {
      await MentorWorkflowApi.lecturerUpdateAssignmentRequest(row.id, { status: "cancelled" });
      toast.success(t("lecturer.mentoringPage.requestCancelled"));
      await loadRequests();
    } catch (err) {
      toast.error(err.message || t("lecturer.mentoringPage.requestError"));
    }
  };
  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700"><ArrowLeft size={16} /> {t("common.back")}</button>
      <form onSubmit={submit} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-black text-slate-900">{t("lecturer.mentoringPage.requestTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("lecturer.mentoringPage.fields.requestedRole")}><Select value={form.requested_role} onChange={(value) => set("requested_role", value)} options={requestRoleOptions} /></Field>
          <Field label={t("lecturer.mentoringPage.fields.priority")}><Select value={form.priority} onChange={(value) => set("priority", value)} options={priorityOptions} /></Field>
          <Field label={t("lecturer.mentoringPage.fields.expertise")}><input className={inputClass} placeholder="pitching, ai_ml" value={form.requested_expertise} onChange={(e) => set("requested_expertise", e.target.value)} /></Field>
        </div>
        <div className="mt-4 space-y-4">
          <Field label={t("lecturer.mentoringPage.fields.problemStatement")}><textarea className={inputClass} rows={3} value={form.problem_statement} onChange={(e) => set("problem_statement", e.target.value)} /></Field>
          <Field label={t("lecturer.mentoringPage.fields.supportNeeded")}><textarea className={inputClass} rows={4} value={form.support_needed} onChange={(e) => set("support_needed", e.target.value)} required /></Field>
        </div>
        <div className="mt-4 flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white"><Send size={16} /> {t("lecturer.mentoringPage.sendRequest")}</button></div>
      </form>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-slate-900">{t("lecturer.mentoringPage.existingRequests")}</h3>
        <AdminTable
          columns={[
            { key: "support_needed", label: t("lecturer.mentoringPage.fields.supportNeeded"), render: (row) => <span className="font-bold text-slate-900">{row.support_needed}</span> },
            { key: "requested_role", label: t("lecturer.mentoringPage.fields.requestedRole"), render: (row) => <StatusBadge value={row.requested_role} /> },
            { key: "priority", label: t("lecturer.mentoringPage.fields.priority"), render: (row) => <StatusBadge value={row.priority} /> },
            { key: "status", label: t("lecturer.mentoringPage.columns.status"), render: (row) => <StatusBadge value={row.status} /> },
            { key: "created_at", label: t("mentorPortal.sessionDetail.noteCreated"), render: (row) => formatDate(row.created_at) },
            { key: "actions", label: "", width: 110, render: (row) => row.status === "open" ? (
              <div className="flex justify-end">
                <button onClick={() => cancelRequest(row)} className="rounded-control p-2 text-danger-text hover:bg-danger-bg" title={t("lecturer.mentoringPage.cancelRequest")}><Trash2 size={16} /></button>
              </div>
            ) : null },
          ]}
          rows={requests}
          loading={loadingRequests}
          emptyText={t("lecturer.mentoringPage.noRequests")}
        />
      </section>
    </div>
  );
}
