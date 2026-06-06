import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useToast } from "@/components/ui/Toast";
import { Field, inputClass } from "@/pages/admin/components/FormModal";
import { priorityOptions, requestRoleOptions, Select } from "@/pages/admin/mentor-workflow/components";

export default function RequestMentorPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ requested_role: "any", requested_expertise: "", problem_statement: "", support_needed: "", priority: "normal" });
  const [saving, setSaving] = useState(false);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const submit = async (e) => { e.preventDefault(); setSaving(true); try { await MentorWorkflowApi.lecturerRequestMentor(groupId, { ...form, requested_expertise: form.requested_expertise ? form.requested_expertise.split(",").map((item) => item.trim()).filter(Boolean) : null }); toast.success("Mentor request created"); navigate(-1); } catch (err) { toast.error(err.message || "Unable to request mentor"); } finally { setSaving(false); } };
  return <form onSubmit={submit} className="space-y-5"><button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700"><ArrowLeft size={16} /> Back</button><section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-black text-slate-900">Request mentor</h2><div className="grid gap-4 sm:grid-cols-2"><Field label="Requested role"><Select value={form.requested_role} onChange={(value) => set("requested_role", value)} options={requestRoleOptions} /></Field><Field label="Priority"><Select value={form.priority} onChange={(value) => set("priority", value)} options={priorityOptions} /></Field><Field label="Expertise"><input className={inputClass} placeholder="pitching, ai_ml" value={form.requested_expertise} onChange={(e) => set("requested_expertise", e.target.value)} /></Field></div><div className="mt-4 space-y-4"><Field label="Problem statement"><textarea className={inputClass} rows={3} value={form.problem_statement} onChange={(e) => set("problem_statement", e.target.value)} /></Field><Field label="Support needed"><textarea className={inputClass} rows={4} value={form.support_needed} onChange={(e) => set("support_needed", e.target.value)} required /></Field></div><div className="mt-4 flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white"><Send size={16} /> Send request</button></div></section></form>;
}
