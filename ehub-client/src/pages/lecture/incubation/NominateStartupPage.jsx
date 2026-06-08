import { useEffect, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import GroupApi from "@/api/group";
import IncubationApi from "@/api/incubation";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import { Field, inputClass } from "@/pages/admin/components/FormModal";
import { SelectField } from "@/pages/admin/incubation/components";

export default function NominateStartupPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [group, setGroup] = useState(null);
  const [form, setForm] = useState({ source_type: "manual", nomination_reason: "", support_needed: "", potential_score: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    GroupApi.getById(groupId).then((res) => mounted && setGroup(res?.data || null)).catch((err) => toast.error(err.message || t("lecturer.incubationPage.groupLoadError"))).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [groupId, toast, t]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await IncubationApi.lecturerNominate(groupId, { ...form, potential_score: form.potential_score === "" ? null : Number(form.potential_score) });
      toast.success(t("lecturer.incubationPage.nominationSubmitted"));
      navigate("/lecturer/incubation/nominations");
    } catch (err) {
      toast.error(err.message || t("lecturer.incubationPage.nominationError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">{t("common.loading")}</div>;

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={16} /> {t("common.back")}</button>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">{t("lecturer.incubationPage.nominateTitle")}</h2>
        <p className="mt-1 text-sm text-slate-500">{group?.topic || group?.group_name || `Group #${groupId}`}</p>
        {group?.topic_desc ? <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{group.topic_desc}</p> : null}
      </div>
      <form onSubmit={submit} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("lecturer.incubationPage.fields.source")}><SelectField value={form.source_type} onChange={(source_type) => setForm((prev) => ({ ...prev, source_type }))} options={[{ value: "manual", label: t("status.manual") || "manual" }, { value: "evaluation_result", label: t("status.evaluation_result") || "evaluation_result" }]} /></Field>
          <Field label={t("lecturer.incubationPage.fields.potentialScore")}><input type="number" min="0" className={inputClass} value={form.potential_score} onChange={(e) => setForm((prev) => ({ ...prev, potential_score: e.target.value }))} /></Field>
          <div className="sm:col-span-2"><Field label={t("lecturer.incubationPage.fields.nominationReason")}><textarea required className={inputClass} rows={5} value={form.nomination_reason} onChange={(e) => setForm((prev) => ({ ...prev, nomination_reason: e.target.value }))} /></Field></div>
          <div className="sm:col-span-2"><Field label={t("lecturer.incubationPage.fields.supportNeeded")}><textarea className={inputClass} rows={4} value={form.support_needed} onChange={(e) => setForm((prev) => ({ ...prev, support_needed: e.target.value }))} /></Field></div>
        </div>
        <div className="mt-5 flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"><Send size={16} /> {t("lecturer.incubationPage.submitNomination")}</button></div>
      </form>
    </div>
  );
}
