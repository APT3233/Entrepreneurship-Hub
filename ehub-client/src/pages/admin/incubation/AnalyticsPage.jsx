import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import IncubationApi from "@/api/incubation";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { Metric, Panel } from "./components";
import { formatDate } from "@/utils/dateTimeDisplay";
import { useTranslation } from "@/context/TranslationContext";

const toArray = (value) => (Array.isArray(value) ? value : []);

const asRows = (rows, keyPrefix = "row") =>
  toArray(rows).map((row, index) => ({
    ...row,
    _key: `${keyPrefix}-${row.id || row.code || row.date || row.issue_type || index}`,
  }));

export default function AnalyticsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const kind = useMemo(() => {
    if (location.pathname.endsWith("/pipeline")) return "pipeline";
    if (location.pathname.endsWith("/progress")) return "progress";
    if (location.pathname.endsWith("/events")) return "events";
    if (location.pathname.endsWith("/ecosystem-health")) return "health";
    return "overview";
  }, [location.pathname]);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setError("");
      try {
        let nextData;
        if (kind === "overview") {
          const [overview, events, alumni] = await Promise.all([
            IncubationApi.analyticsOverview(),
            IncubationApi.analyticsEvents(),
            IncubationApi.analyticsAlumniPartners(),
          ]);
          nextData = {
            overview: overview?.data || {},
            events: events?.data || {},
            alumni: alumni?.data || {},
          };
        } else if (kind === "pipeline") {
          nextData = (await IncubationApi.analyticsPipeline())?.data || {};
        } else if (kind === "progress") {
          nextData = (await IncubationApi.analyticsProgress())?.data || {};
        } else if (kind === "events") {
          nextData = (await IncubationApi.analyticsEvents())?.data || {};
        } else {
          const payload = (await IncubationApi.analyticsEcosystemHealth())?.data;
          nextData = Array.isArray(payload) ? payload : toArray(payload?.rows ?? payload?.issues);
        }
        if (active) setData(nextData);
      } catch (err) {
        if (active) setError(err.message || t("admin.ecosystem.analytics.loadError"));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [kind, t]);

  if (loading) return <div className="rounded-card bg-surface p-8 text-center text-sm text-slate-400">{t("admin.ecosystem.analytics.loading")}</div>;
  if (error) return <div className="rounded-card bg-rose-50 p-8 text-center text-sm font-bold text-rose-600">{error}</div>;

  if (kind === "health") {
    const columns = [
      { key: "startup_name", label: t("admin.ecosystem.analytics.columns.startup"), render: (row) => <button type="button" onClick={() => navigate(`/admin/incubation/startups/${row.startup_id}`)} className="font-black text-accent hover:underline">{row.startup_name}</button> },
      { key: "issue_type", label: t("admin.ecosystem.analytics.columns.issue"), render: (row) => <StatusBadge value={row.issue_type} /> },
      { key: "severity", label: t("admin.ecosystem.analytics.columns.severity"), render: (row) => <StatusBadge value={row.severity} /> },
      { key: "reason", label: t("admin.ecosystem.analytics.columns.reason") },
      { key: "suggested_action", label: t("admin.ecosystem.analytics.columns.action") },
      { key: "last_activity", label: t("admin.ecosystem.analytics.columns.activity"), render: (row) => formatDate(row.last_activity) },
    ];
    return <Panel title={t("admin.ecosystem.analytics.panels.health")}><AdminTable rowKey="_key" columns={columns} rows={asRows(data, "health")} emptyText={t("admin.ecosystem.analytics.empty.health")} /></Panel>;
  }

  if (kind === "pipeline") {
    const stageColumns = [
      { key: "name", label: t("admin.ecosystem.analytics.columns.stage") },
      { key: "total", label: t("admin.ecosystem.analytics.columns.startups") },
      { key: "avg_days_in_stage", label: t("admin.ecosystem.analytics.columns.avgDays"), render: (row) => row.avg_days_in_stage ?? "-" },
    ];
    const stuckColumns = [
      { key: "startup_name", label: t("admin.ecosystem.analytics.columns.startup"), render: (row) => <button type="button" onClick={() => navigate(`/admin/incubation/startups/${row.id}`)} className="font-black text-accent hover:underline">{row.startup_name}</button> },
      { key: "current_stage_name", label: t("admin.ecosystem.analytics.columns.stage") },
      { key: "days_in_stage", label: t("admin.ecosystem.analytics.columns.days") },
      { key: "startup_status", label: t("admin.ecosystem.analytics.columns.status"), render: (row) => <StatusBadge value={row.startup_status} /> },
    ];
    return <div className="space-y-5"><Panel title={t("admin.ecosystem.analytics.panels.pipeline")}><AdminTable rowKey="_key" columns={stageColumns} rows={asRows(data?.stages, "stage")} emptyText={t("admin.ecosystem.analytics.empty.pipeline")} /></Panel><Panel title={t("admin.ecosystem.analytics.panels.stuck")}><AdminTable rowKey="id" columns={stuckColumns} rows={toArray(data?.stuck_startups)} emptyText={t("admin.ecosystem.analytics.empty.stuck")} /></Panel></div>;
  }

  if (kind === "progress") {
    const metrics = data.latest_metrics || {};
    const columns = [
      { key: "label", label: t("admin.ecosystem.analytics.columns.type") },
      { key: "total", label: t("admin.ecosystem.analytics.columns.total") },
    ];
    return (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <Metric label={t("admin.ecosystem.analytics.metrics.mvpCompleted")} value={metrics.mvp_completed || 0} />
          <Metric label={t("admin.ecosystem.analytics.metrics.marketValidated")} value={metrics.market_validated || 0} tone="emerald" />
          <Metric label={t("admin.ecosystem.analytics.metrics.revenueReported")} value={metrics.revenue_reported || 0} tone="amber" />
          <Metric label={t("admin.ecosystem.analytics.metrics.avgTeamSize")} value={metrics.avg_team_size || 0} />
        </div>
        <Panel title={t("admin.ecosystem.analytics.panels.productStage")}><AdminTable rowKey="_key" columns={columns} rows={asRows((data.product_stage_distribution || []).map((row) => ({ label: row.product_stage, total: row.total })), "product")} emptyText={t("admin.ecosystem.analytics.empty.product")} /></Panel>
        <Panel title={t("admin.ecosystem.analytics.panels.milestones")}><AdminTable rowKey="_key" columns={columns} rows={asRows((data.milestones_by_type || []).map((row) => ({ label: row.milestone_type, total: row.total })), "milestone")} emptyText={t("admin.ecosystem.analytics.empty.milestone")} /></Panel>
      </div>
    );
  }

  if (kind === "events") {
    const cards = data.cards || {};
    const columns = [{ key: "label", label: t("admin.ecosystem.analytics.columns.category") }, { key: "total", label: t("admin.ecosystem.analytics.columns.total") }];
    return (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <Metric label={t("admin.ecosystem.analytics.metrics.events")} value={cards.total_events || 0} />
          <Metric label={t("admin.ecosystem.analytics.metrics.startupsJoined")} value={cards.startups_participated || 0} tone="emerald" />
          <Metric label={t("admin.ecosystem.analytics.metrics.feedbacks")} value={cards.feedback_count || 0} tone="amber" />
          <Metric label={t("admin.ecosystem.analytics.metrics.avgRating")} value={cards.average_judge_rating || 0} />
        </div>
        <Panel title={t("admin.ecosystem.analytics.panels.awards")}><AdminTable rowKey="_key" columns={columns} rows={asRows((data.awards_by_category || []).map((row) => ({ label: row.award_type, total: row.total })), "award")} emptyText={t("admin.ecosystem.analytics.empty.award")} /></Panel>
        <Panel title={t("admin.ecosystem.analytics.panels.interest")}><AdminTable rowKey="_key" columns={columns} rows={asRows((data.interest_levels || []).map((row) => ({ label: row.interest_level, total: row.total })), "interest")} emptyText={t("admin.ecosystem.analytics.empty.interest")} /></Panel>
      </div>
    );
  }

  const cards = data?.overview?.cards || {};
  const alumniCards = data?.alumni?.cards || {};
  const columns = [{ key: "name", label: t("admin.ecosystem.analytics.columns.stage") }, { key: "total", label: t("admin.ecosystem.analytics.columns.total") }];
  const partnerColumns = [{ key: "partner_type", label: t("admin.ecosystem.analytics.columns.partnerType") }, { key: "total", label: t("admin.ecosystem.analytics.columns.total") }];
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label={t("admin.ecosystem.analytics.metrics.totalStartups")} value={cards.total_startups || 0} />
        <Metric label={t("admin.ecosystem.analytics.metrics.active")} value={cards.active_startups || 0} tone="emerald" />
        <Metric label={t("admin.ecosystem.analytics.metrics.graduated")} value={cards.graduated_startups || 0} tone="amber" />
        <Metric label={t("admin.ecosystem.analytics.metrics.conversion")} value={data?.overview?.conversion_rate || 0} />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label={t("admin.ecosystem.analytics.metrics.withMvp")} value={cards.startups_with_mvp || 0} />
        <Metric label={t("admin.ecosystem.analytics.metrics.withRevenue")} value={cards.startups_with_revenue || 0} />
        <Metric label={t("admin.ecosystem.analytics.metrics.partnerConnected")} value={cards.startups_connected_to_partners || 0} />
        <Metric label={t("admin.ecosystem.analytics.metrics.alumniFounders")} value={alumniCards.total_alumni_founders || 0} />
      </div>
      <Panel title={t("admin.ecosystem.analytics.panels.startupStage")}><AdminTable rowKey="_key" columns={columns} rows={asRows(data?.overview?.startups_by_stage || [], "stage")} emptyText={t("admin.ecosystem.analytics.empty.stage")} /></Panel>
      <Panel title={t("admin.ecosystem.analytics.panels.partnerType")}><AdminTable rowKey="_key" columns={partnerColumns} rows={asRows(data?.alumni?.partners_by_type || [], "partner")} emptyText={t("admin.ecosystem.analytics.empty.partner")} /></Panel>
    </div>
  );
}
