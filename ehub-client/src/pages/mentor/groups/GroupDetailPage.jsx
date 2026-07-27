import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { Panel } from "@/pages/admin/mentor-analytics/components";
import { formatDate } from "@/utils/dateTimeDisplay";
import useDocumentTitle from "@/hooks/useDocumentTitle";

export default function MentorGroupDetailPage() {
  const { t } = useTranslation();
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  useDocumentTitle(data?.group?.group_name || null, 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await MentorWorkflowApi.mentorGroup(groupId);
      setData(res?.data || null);
    } catch (err) {
      setError(err.message || t("mentorPortal.groups.loadError"));
    } finally {
      setLoading(false);
    }
  }, [groupId, t]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="rounded-card border border-border bg-surface p-8 text-center text-sm text-text-muted">{t("common.loading") || "Loading..."}</div>;
  if (error) return <div className="rounded-card border border-border bg-surface p-8 text-center text-sm font-medium text-danger-text">{error}</div>;
  if (!data) return null;

  const { group, members, checkpoints, sessions, action_items: actionItems } = data;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:bg-subtle">
        <ArrowLeft size={16} /> {t("mentorPortal.sessionDetail.back")}
      </button>

      <section className="rounded-card border border-border bg-surface p-5">
        <h2 className="text-h1 font-medium text-text-primary">{group.group_name}</h2>
        <p className="mt-1 text-sm text-text-secondary">
          {group.group_code} · {group.class_code} · {group.subject_code} · {group.semester_name}
        </p>
        {group.topic ? <p className="mt-3 text-sm font-medium text-text-primary">{group.topic}</p> : null}
        {group.topic_desc ? <p className="mt-1 text-sm text-text-secondary">{group.topic_desc}</p> : null}
      </section>

      <Panel title={t("mentorPortal.groups.members")}>
        <AdminTable
          columns={[
            { key: "student_code", label: t("mentorPortal.groups.studentCode") },
            { key: "full_name", label: t("mentorPortal.groups.fullName"), render: (row) => <span className="font-medium text-text-primary">{row.full_name}</span> },
            { key: "email", label: t("mentorPortal.groups.email") },
            { key: "major", label: t("mentorPortal.groups.major"), render: (row) => row.major || "-" },
            { key: "role", label: t("mentorPortal.groups.roleInGroup"), render: (row) => <StatusBadge value={row.role} /> },
          ]}
          rows={members || []}
          emptyText={t("mentorPortal.groups.noMembers")}
        />
      </Panel>

      <Panel title={t("mentorPortal.groups.checkpoints")}>
        <AdminTable
          columns={[
            { key: "title", label: t("mentorPortal.groups.checkpointTitle"), render: (row) => <span className="font-medium text-text-primary">{row.title}</span> },
            { key: "due_date", label: t("mentorPortal.groups.dueDate"), render: (row) => formatDate(row.due_date) },
            { key: "submission_status", label: t("mentorPortal.groups.submission"), render: (row) => <StatusBadge value={row.submission_status || "not_submitted"} /> },
            { key: "submitted_at", label: t("mentorPortal.groups.submittedAt"), render: (row) => formatDate(row.submitted_at) },
          ]}
          rows={checkpoints || []}
          emptyText={t("mentorPortal.groups.noCheckpoints")}
        />
      </Panel>

      <Panel title={t("mentorPortal.groups.sessions")}>
        <AdminTable
          columns={[
            { key: "title", label: t("mentorPortal.sessions.title"), render: (row) => <span className="font-medium text-text-primary">{row.title}</span> },
            { key: "scheduled_start_at", label: t("mentorPortal.sessions.scheduled"), render: (row) => formatDate(row.scheduled_start_at) },
            { key: "status", label: t("mentorPortal.sessions.status"), render: (row) => <StatusBadge value={row.status} /> },
          ]}
          rows={sessions || []}
          emptyText={t("mentorPortal.sessions.noSessions")}
          onRowClick={(row) => navigate(`/mentor/sessions/${row.id}`)}
        />
      </Panel>

      <Panel title={t("mentorPortal.groups.actionItems")}>
        <AdminTable
          columns={[
            { key: "title", label: t("mentorPortal.sessionDetail.actionTitle"), render: (row) => <span className="font-medium text-text-primary">{row.title}</span> },
            { key: "assigned_to_name", label: t("mentorPortal.groups.assignee"), render: (row) => row.assigned_to_name || "-" },
            { key: "due_date", label: t("mentorPortal.sessionDetail.actionDue"), render: (row) => formatDate(row.due_date) },
            { key: "status", label: t("mentorPortal.sessionDetail.actionStatus"), render: (row) => <StatusBadge value={row.status} /> },
          ]}
          rows={actionItems || []}
          emptyText={t("mentorPortal.sessionDetail.noActionItems")}
        />
      </Panel>
    </div>
  );
}
