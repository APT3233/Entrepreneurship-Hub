import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { Panel, StartupHeader } from "@/pages/admin/incubation/components";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function MentorStartupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [startup, setStartup] = useState(null);
  const [progressRows, setProgressRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [startupRes, progressRes] = await Promise.all([
        IncubationApi.mentorStartup(id),
        IncubationApi.mentorStartupProgress(id, { limit: 100 }),
      ]);
      setStartup(startupRes?.data || null);
      setProgressRows(progressRes?.data || []);
    } catch (err) {
      setError(err.message || t("mentorPortal.startups.loadError"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  const columns = useMemo(() => [
    { key: "progress_date", label: t("mentorPortal.startups.columns.date"), render: (row) => formatDate(row.progress_date) },
    { key: "update_title", label: t("mentorPortal.startups.columns.update"), render: (row) => <div><p className="font-black text-slate-900">{row.update_title}</p><p className="mt-1 text-sm text-slate-500">{row.update_content}</p></div> },
    { key: "update_type", label: t("mentorPortal.startups.columns.type"), render: (row) => <StatusBadge value={row.update_type} /> },
    { key: "visibility", label: t("mentorPortal.startups.columns.visibility"), render: (row) => <StatusBadge value={row.visibility} /> },
  ], [t]);

  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400">{t("common.loading")}</div>;
  if (error) return <div className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;
  if (!startup) return null;

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={16} /> {t("common.back")}</button>
      <StartupHeader startup={startup} />
      <Panel title={t("mentorPortal.startups.progress")}><AdminTable columns={columns} rows={progressRows} emptyText={t("mentorPortal.startups.emptyProgress")} /></Panel>
    </div>
  );
}
