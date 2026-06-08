import { useState } from "react";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminMentorApi from "@/api/adminMentors";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import { MentorForm } from "./components";

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
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
    if (!form.full_name.trim()) return toast.error(t("admin.mentors.fields.fullNameRequired") || "Full name is required");
    if (!form.email.trim()) return toast.error(t("admin.mentors.fields.emailRequired") || "Email is required");
    setSaving(true);
    try {
      const res = await AdminMentorApi.createMentor(form);
      toast.success(t("admin.mentors.fields.createSuccess") || "Mentor created successfully");
      navigate(`/admin/mentors/${res?.data?.id || ""}`);
    } catch (err) {
      toast.error(err.message || t("admin.mentors.fields.createError") || "Unable to create mentor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <UserPlus size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">{t("admin.mentors.create") || "Add New Mentor"}</h1>
            <p className="text-xs font-semibold text-slate-400">
              {t("admin.mentors.createSub") || "Register a new professional mentor in the system"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/admin/mentors")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft size={14} /> {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50 cursor-pointer shadow-sm shadow-teal-100"
          >
            <Save size={14} /> {saving ? t("admin.mentors.saving") : t("admin.mentors.createSubmit") || "Create Mentor"}
          </button>
        </div>
      </div>

      {/* Form Workspace */}
      <MentorForm form={form} setForm={setForm} showStatus />
    </form>
  );
}
