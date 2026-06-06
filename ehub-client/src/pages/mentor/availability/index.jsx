import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import MentorPortalApi from "@/api/mentorPortal";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import { AvailabilityEditor } from "@/pages/admin/mentor-management/components";

export default function MentorAvailabilityPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await MentorPortalApi.getAvailability();
      setItems(res?.data || []);
    } catch (err) {
      setError(err.message || t("mentorPortal.availability.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await MentorPortalApi.replaceAvailability(items);
      setItems(res?.data || []);
      toast.success(t("mentorPortal.availability.updated"));
    } catch (err) {
      toast.error(err.message || t("mentorPortal.availability.updateError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">{t("common.loading") || "Loading..."}</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900">{t("mentorPortal.availability.title")}</h2>
        <button type="button" disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50"><Save size={16} /> {t("mentorPortal.availability.save")}</button>
      </div>
      <AvailabilityEditor items={items} setItems={setItems} />
    </div>
  );
}
