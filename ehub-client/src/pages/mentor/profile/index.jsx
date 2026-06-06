import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import MentorPortalApi from "@/api/mentorPortal";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import { ExpertiseEditor, MentorForm, MentorHeader } from "@/pages/admin/mentor-management/components";

export default function MentorProfilePage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "expertise" ? "expertise" : "profile";
  const toast = useToast();
  const [mentor, setMentor] = useState(null);
  const [areas, setAreas] = useState([]);
  const [form, setForm] = useState({});
  const [expertiseItems, setExpertiseItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [profileRes, areasRes] = await Promise.all([
        MentorPortalApi.getProfile(),
        MentorPortalApi.getExpertiseAreas({ limit: 100, status: "active" }),
      ]);
      const data = profileRes?.data || null;
      setMentor(data);
      setForm(data || {});
      setExpertiseItems((data?.expertise || []).map((item) => ({ ...item, expertise_id: String(item.expertise_id) })));
      setAreas(areasRes?.data || []);
    } catch (err) {
      setError(err.message || t("mentorPortal.profile.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { status: _status, reviewed_by: _reviewedBy, reviewed_at: _reviewedAt, created_by: _createdBy, ...payload } = form;
      const res = await MentorPortalApi.updateProfile(payload);
      setMentor(res?.data || mentor);
      toast.success(t("mentorPortal.profile.updated"));
      await load();
    } catch (err) {
      toast.error(err.message || t("mentorPortal.profile.updateError"));
    } finally {
      setSaving(false);
    }
  };

  const saveExpertise = async () => {
    setSaving(true);
    try {
      const items = expertiseItems.filter((item) => item.expertise_id).map((item) => ({ ...item, expertise_id: Number(item.expertise_id) }));
      const res = await MentorPortalApi.replaceExpertise(items);
      setExpertiseItems((res?.data || []).map((item) => ({ ...item, expertise_id: String(item.expertise_id) })));
      toast.success(t("mentorPortal.profile.expertiseUpdated"));
      await load();
    } catch (err) {
      toast.error(err.message || t("mentorPortal.profile.updateExpertiseError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">{t("common.loading") || "Loading..."}</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  if (!mentor) return null;

  return (
    <div className="space-y-5">
      <MentorHeader mentor={mentor} />
      <div className="flex gap-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
        <button type="button" onClick={() => setSearchParams({})} className={`rounded-xl px-3 py-2 text-sm font-bold ${activeTab === "profile" ? "bg-teal-50 text-teal-700" : "text-slate-500 hover:bg-slate-50"}`}>{t("mentorPortal.profile.tabProfile")}</button>
        <button type="button" onClick={() => setSearchParams({ tab: "expertise" })} className={`rounded-xl px-3 py-2 text-sm font-bold ${activeTab === "expertise" ? "bg-teal-50 text-teal-700" : "text-slate-500 hover:bg-slate-50"}`}>{t("mentorPortal.profile.tabExpertise")}</button>
      </div>
      {activeTab === "profile" ? (
        <form onSubmit={saveProfile} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <MentorForm form={form} setForm={setForm} />
          <div className="mt-4 flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50"><Save size={16} /> {t("mentorPortal.profile.saveProfile")}</button></div>
        </form>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <ExpertiseEditor areas={areas} items={expertiseItems} setItems={setExpertiseItems} />
          <div className="mt-4 flex justify-end"><button type="button" disabled={saving} onClick={saveExpertise} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50"><Save size={16} /> {t("mentorPortal.profile.saveExpertise")}</button></div>
        </div>
      )}
    </div>
  );
}
