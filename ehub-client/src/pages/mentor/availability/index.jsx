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

  if (loading) return <div className="rounded-card border border-border bg-surface p-8 text-center text-sm text-text-muted">{t("common.loading") || "Loading..."}</div>;
  if (error) return <div className="rounded-card border border-border bg-surface p-8 text-center text-sm font-medium text-danger-text">{error}</div>;

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-h1 font-medium text-text-primary">{t("mentorPortal.availability.title")}</h2>
        <button type="button" disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-control bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"><Save size={16} /> {t("mentorPortal.availability.save")}</button>
      </div>
      <AvailabilityEditor items={items} setItems={setItems} />
    </div>
  );
}
