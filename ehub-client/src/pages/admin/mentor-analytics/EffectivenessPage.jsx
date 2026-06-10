import { useCallback, useEffect, useMemo, useState } from "react";
import MentorAnalyticsApi from "@/api/mentorAnalytics";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";

const fmt = (value) => value == null ? "-" : Number(value).toFixed(1);

export default function MentorEffectivenessPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const [rows, setRows] = useState([]); const [meta, setMeta] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const res = await MentorAnalyticsApi.effectiveness(query); setRows(res?.data || []); setMeta(res?.meta || null); } catch (err) { setError(err.message || t("admin.mentorAnalytics.effectiveness.loadError")); } finally { setLoading(false); } }, [query, t]);
  useEffect(() => { load(); }, [load]);
  const columns = useMemo(() => [
    { key: "full_name", label: t("admin.mentorAnalytics.effectiveness.columns.mentor"), render: (row) => <span className="font-black text-slate-900">{row.full_name}</span> },
    { key: "mentor_type", label: t("admin.mentorAnalytics.effectiveness.columns.type"), render: (row) => <StatusBadge value={row.mentor_type} /> },
    { key: "total_groups_supported", label: t("admin.mentorAnalytics.effectiveness.columns.groups") },
    { key: "average_group_score_before", label: t("admin.mentorAnalytics.effectiveness.columns.scoreBefore"), render: (row) => fmt(row.average_group_score_before) },
    { key: "average_group_score_after", label: t("admin.mentorAnalytics.effectiveness.columns.scoreAfter"), render: (row) => fmt(row.average_group_score_after) },
    { key: "average_session_rating", label: t("admin.mentorAnalytics.effectiveness.columns.sessionRating"), render: (row) => fmt(row.average_session_rating) },
    { key: "student_feedback_score", label: t("admin.mentorAnalytics.effectiveness.columns.studentScore"), render: (row) => fmt(row.student_feedback_score) },
    { key: "lecturer_feedback_score", label: t("admin.mentorAnalytics.effectiveness.columns.lecturerScore"), render: (row) => fmt(row.lecturer_feedback_score) },
    { key: "completed_action_items_rate", label: t("admin.mentorAnalytics.effectiveness.columns.actionDone"), render: (row) => fmt(row.completed_action_items_rate) },
    { key: "continuation_rate", label: t("admin.mentorAnalytics.effectiveness.columns.continuation"), render: (row) => `${Number(row.continuation_rate || 0)}%` },
  ], [t]);
  return <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.mentorAnalytics.effectiveness.emptyText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} />;
}
