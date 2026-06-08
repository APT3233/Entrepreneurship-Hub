import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function ClassMentorAssignmentsPage() {
  const { classId } = useParams();
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
      const res = await MentorWorkflowApi.lecturerClassAssignments(classId, query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("lecturer.mentoringPage.assignmentsLoadError"));
    } finally {
      setLoading(false);
    }
  }, [classId, query, t]);
  useEffect(() => { load(); }, [load]);
  const columns = useMemo(() => [
    { key: "mentor_name", label: t("lecturer.mentoringPage.columns.mentor"), render: (row) => <span className="font-black text-slate-900">{row.mentor_name}</span> },
    { key: "group_name", label: t("lecturer.mentoringPage.columns.group") },
    { key: "topic", label: t("lecturer.mentoringPage.columns.topic"), render: (row) => row.topic || "-" },
    { key: "assignment_type", label: t("lecturer.mentoringPage.columns.type"), render: (row) => <StatusBadge value={row.assignment_type} /> },
    { key: "status", label: t("lecturer.mentoringPage.columns.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "start_date", label: t("lecturer.mentoringPage.columns.start"), render: (row) => formatDate(row.start_date) },
  ], [t]);
  return <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("lecturer.mentoringPage.emptyAssignments")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} />;
}
