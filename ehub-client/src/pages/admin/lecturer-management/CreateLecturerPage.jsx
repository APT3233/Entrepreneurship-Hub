import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLecturerApi from "@/api/adminLecturer";
import { useToast } from "@/components/ui/Toast";
import { LecturerForm } from "./components";
import { useTranslation } from "@/context/TranslationContext";

const emptyForm = {
  full_name: "",
  email: "",
  username: "",
  phone: "",
  avatar_url: "",
  password: "",
  status: "active",
  profile: {
    department: "",
    academic_title: "",
    specialization: "",
    bio: "",
    office_location: "",
    contact_note: "",
  },
};

export default function CreateLecturerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    
    if (!form.full_name || !form.full_name.trim()) {
      toast.error("Vui lòng nhập họ và tên.");
      return;
    }
    if (!form.username || !form.username.trim()) {
      toast.error("Vui lòng nhập tên đăng nhập.");
      return;
    }
    if (!form.email || !form.email.trim()) {
      toast.error("Vui lòng nhập email.");
      return;
    }
    if (form.password && form.password.length < 8) {
      toast.error("Mật khẩu phải chứa ít nhất 8 ký tự.");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      const res = await AdminLecturerApi.createLecturer(payload);
      toast.success(t("admin.toasts.createLecturerSuccess"));
      navigate(`/admin/lecturers/${res?.data?.id || ""}`);
    } catch (err) {
      let detailMsg = "";
      if (err.details && Array.isArray(err.details)) {
        detailMsg = err.details
          .map((d) => {
            if (d.field === "password") {
              if (d.type === "string.min") {
                return "Mật khẩu phải chứa ít nhất 8 ký tự.";
              }
              if (d.type === "string.max") {
                return "Mật khẩu không được quá 128 ký tự.";
              }
            }
            if (d.field === "email") {
              return "Email không hợp lệ.";
            }
            return d.message;
          })
          .join(", ");
      }
      const fullMsg = detailMsg ? `${err.message}: ${detailMsg}` : err.message;
      toast.error(fullMsg || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <button type="button" onClick={() => navigate("/admin/lecturers")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <ArrowLeft size={16} /> {t("common.cancel")}
        </button>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          <Save size={16} /> {saving ? `${t("common.loading")}...` : t("nav.createLecturer")}
        </button>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <LecturerForm form={form} setForm={setForm} />
      </div>
    </form>
  );
}
