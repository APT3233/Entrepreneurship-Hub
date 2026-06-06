import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminMentorApi from "@/api/adminMentors";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import { MentorForm } from "./components";

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  avatar_url: "",
  mentor_type: "business",
  organization: "",
  position_title: "",
  bio: "",
  years_of_experience: null,
  linkedin_url: "",
  portfolio_url: "",
  cv_file_url: "",
  status: "pending",
  visibility: "internal",
};

export default function CreateMentorPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) return toast.error(t("admin.mentors.fields.fullNameRequired"));
    if (!form.email.trim()) return toast.error(t("admin.mentors.fields.emailRequired"));
    setSaving(true);
    try {
      const res = await AdminMentorApi.createMentor(form);
      toast.success(t("admin.mentors.fields.createSuccess"));
      navigate(`/admin/mentors/${res?.data?.id || ""}`);
    } catch (err) {
      toast.error(err.message || t("admin.mentors.fields.createError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <button type="button" onClick={() => navigate("/admin/mentors")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={16} /> {t("common.cancel")}</button>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50"><Save size={16} /> {saving ? t("admin.mentors.saving") : t("admin.mentors.createSubmit")}</button>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <MentorForm form={form} setForm={setForm} showStatus />
      </div>
    </form>
  );
}
