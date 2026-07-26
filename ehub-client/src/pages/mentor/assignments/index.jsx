import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function MentorAssignmentsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await MentorWorkflowApi.mentorAssignments(query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("mentorPortal.assignments.loadError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  const respond = async () => {
    if (!confirm) return;
    try {
      await MentorWorkflowApi.mentorRespondAssignment(confirm.row.id, { response: confirm.response, rejection_reason: confirm.response === "decline" ? "Declined by mentor" : undefined });
      toast.success(t("mentorPortal.assignments.saved"));
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("mentorPortal.assignments.respondError"));
    }
  };

  const columns = useMemo(() => [
    { key: "group_name", label: t("mentorPortal.assignments.group"), render: (row) => <span className="font-medium text-text-primary">{row.group_name}</span> },
    { key: "topic", label: t("mentorPortal.assignments.topic"), render: (row) => row.topic || "-" },
    { key: "class_code", label: t("mentorPortal.assignments.class") },
    { key: "assignment_type", label: t("mentorPortal.assignments.type"), render: (row) => <StatusBadge value={row.assignment_type} /> },
    { key: "status", label: t("mentorPortal.assignments.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "start_date", label: t("mentorPortal.assignments.start"), render: (row) => formatDate(row.start_date) },
    { key: "expected_sessions", label: t("mentorPortal.assignments.expected"), render: (row) => row.expected_sessions ?? "-" },
    { key: "actions", label: "", width: 120, render: (row) => ['proposed', 'pending_mentor'].includes(row.status) ? <div className="flex justify-end gap-1"><button onClick={() => setConfirm({ row, response: "accept", title: t("mentorPortal.assignments.acceptTitle"), color: "green" })} className="rounded-control p-2 text-success-text hover:bg-success-bg"><CheckCircle2 size={16} /></button><button onClick={() => setConfirm({ row, response: "decline", title: t("mentorPortal.assignments.declineTitle"), color: "red" })} className="rounded-control p-2 text-danger-text hover:bg-danger-bg"><XCircle size={16} /></button></div> : null },
  ], [t]);

  return (
    <>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("mentorPortal.assignments.noAssignments")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} />
      <ConfirmDialog isOpen={!!confirm} title={confirm?.title} subtitle={confirm ? `${confirm.row.group_name} · ${confirm.row.topic || ''}` : ""} variant="confirm" color={confirm?.color} yesLabel={t("mentorPortal.assignments.confirm")} noLabel={t("common.cancel") || "Cancel"} onYes={respond} onNo={() => setConfirm(null)} onClose={() => setConfirm(null)} />
    </>
  );
}
