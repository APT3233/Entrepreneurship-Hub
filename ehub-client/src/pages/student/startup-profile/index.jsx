import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { StartupLogo } from "@/pages/admin/incubation/components";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Rocket } from "lucide-react";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function StudentStartupProfilesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await IncubationApi.myStartups(query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("student.startupProfile.loadError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  const columns = useMemo(() => [
    { key: "logo", label: "", width: 64, render: (row) => <StartupLogo startup={row} /> },
    { key: "startup_name", label: t("student.startupProfile.columns.startup"), render: (row) => <span className="font-semibold text-text-primary">{row.startup_name}</span> },
    { key: "product_stage", label: t("student.startupProfile.columns.product"), render: (row) => <StatusBadge value={row.product_stage} /> },
    { key: "startup_status", label: t("common.status"), render: (row) => <StatusBadge value={row.startup_status} /> },
    { key: "current_stage_name", label: t("student.startupProfile.columns.pipeline"), render: (row) => row.current_stage_name || "-" },
    { key: "updated_at", label: t("student.startupProfile.columns.updated"), render: (row) => formatDate(row.updated_at) },
  ], [t]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title={t("student.startupProfile.pageTitle")} description="Hồ sơ startup của bạn và tiến trình ươm tạo" />
      {!loading && !error && rows.length === 0 ? (
        <EmptyState
          icon={<Rocket size={24} />}
          title="Chưa có hồ sơ startup"
          description="Hồ sơ startup sẽ xuất hiện ở đây khi được liên kết với tài khoản của bạn."
        />
      ) : (
        <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("student.startupProfile.emptyList")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} onRowClick={(row) => navigate(`/student/startups/${row.id}`)} />
      )}
    </div>
  );
}
