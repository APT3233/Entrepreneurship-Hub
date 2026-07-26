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
    { key: "update_title", label: t("mentorPortal.startups.columns.update"), render: (row) => <div><p className="font-medium text-text-primary">{row.update_title}</p><p className="mt-1 text-sm text-text-secondary">{row.update_content}</p></div> },
    { key: "update_type", label: t("mentorPortal.startups.columns.type"), render: (row) => <StatusBadge value={row.update_type} /> },
    { key: "visibility", label: t("mentorPortal.startups.columns.visibility"), render: (row) => <StatusBadge value={row.visibility} /> },
  ], [t]);

  if (loading) return <div className="rounded-card border border-border bg-surface p-8 text-center text-sm text-text-muted">{t("common.loading")}</div>;
  if (error) return <div className="rounded-card border border-border bg-surface p-8 text-center text-sm font-medium text-danger-text">{error}</div>;
  if (!startup) return null;

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:bg-subtle"><ArrowLeft size={16} /> {t("common.back")}</button>
      <StartupHeader startup={startup} />
      <Panel title={t("mentorPortal.startups.progress")}><AdminTable columns={columns} rows={progressRows} emptyText={t("mentorPortal.startups.emptyProgress")} /></Panel>
    </div>
  );
}
