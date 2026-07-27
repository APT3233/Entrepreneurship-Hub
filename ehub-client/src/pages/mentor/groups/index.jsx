import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";

export default function MentorGroupsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await MentorWorkflowApi.mentorGroups();
      setRows(res?.data || []);
    } catch (err) {
      setError(err.message || t("mentorPortal.groups.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const columns = useMemo(() => [
    { key: "group_name", label: t("mentorPortal.groups.group"), render: (row) => <span className="font-medium text-text-primary">{row.group_name}</span> },
    { key: "topic", label: t("mentorPortal.groups.topic"), render: (row) => row.topic || "-" },
    { key: "class_code", label: t("mentorPortal.groups.class") },
    { key: "member_count", label: t("mentorPortal.groups.members") },
    { key: "completed_sessions", label: t("mentorPortal.groups.sessions"), render: (row) => `${row.completed_sessions}/${row.total_sessions}` },
    { key: "open_action_items", label: t("mentorPortal.groups.openActionItems") },
    { key: "assignment_type", label: t("mentorPortal.groups.type"), render: (row) => <StatusBadge value={row.assignment_type} /> },
    { key: "assignment_status", label: t("mentorPortal.groups.status"), render: (row) => <StatusBadge value={row.assignment_status} /> },
  ], [t]);

  return (
    <AdminTable
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyText={t("mentorPortal.groups.noGroups")}
      onRowClick={(row) => navigate(`/mentor/groups/${row.group_id}`)}
    />
  );
}
