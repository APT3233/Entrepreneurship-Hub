import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminMentorApi from "@/api/adminMentors";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import FilterBar from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import { MentorAvatar } from "./components";

export default function PendingMentorsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", status: "pending" });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await AdminMentorApi.getMentors(query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("admin.mentors.loadPendingError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async () => {
    if (!confirm) return;
    try {
      await AdminMentorApi.updateMentorStatus(confirm.mentor.id, confirm.status);
      toast.success(t("admin.mentors.reviewedSuccess"));
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.mentors.actionFailed"));
    }
  };

  const columns = useMemo(() => [
    { key: "avatar", label: "", width: 70, render: (row) => <MentorAvatar mentor={row} /> },
    { key: "full_name", label: t("admin.mentors.name"), render: (row) => <span className="font-black text-slate-900">{row.full_name}</span> },
    { key: "email", label: t("admin.mentors.email") },
    { key: "mentor_type", label: t("admin.mentors.type"), render: (row) => <StatusBadge value={row.mentor_type} /> },
    { key: "organization", label: t("admin.mentors.organization"), render: (row) => row.organization || "—" },
    { key: "created_at", label: t("admin.mentors.created"), render: (row) => formatDate(row.created_at) },
    { key: "actions", label: "", width: 160, render: (row) => (
      <div className="flex justify-end gap-1">
        <button type="button" onClick={() => navigate(`/admin/mentors/${row.id}`)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"><Eye size={16} /></button>
        <button type="button" onClick={() => setConfirm({ mentor: row, status: "active", actionKey: "approve", color: "green" })} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"><CheckCircle2 size={16} /></button>
        <button type="button" onClick={() => setConfirm({ mentor: row, status: "rejected", actionKey: "reject", color: "red" })} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><XCircle size={16} /></button>
      </div>
    ) },
  ], [navigate, t]);

  const confirmTitle = useMemo(() => {
    if (!confirm) return "";
    return t(`admin.mentors.${confirm.actionKey}Title`);
  }, [confirm, t]);

  const confirmSubtitle = useMemo(() => {
    if (!confirm) return "";
    return t("admin.mentors.confirmPendingSubtitle", {
      name: confirm.mentor.full_name,
      status: t(`status.${confirm.status}`),
    });
  }, [confirm, t]);

  return (
    <>
      <FilterBar><SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.mentors.searchPendingPlaceholder")} /></FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.mentors.emptyPendingText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} onRowClick={(row) => navigate(`/admin/mentors/${row.id}`)} />
      <ConfirmDialog isOpen={!!confirm} title={confirmTitle} subtitle={confirmSubtitle} variant="confirm" color={confirm?.color} yesLabel={t("admin.mentors.yesLabel")} noLabel={t("admin.mentors.noLabel")} onYes={updateStatus} onNo={() => setConfirm(null)} onClose={() => setConfirm(null)} />
    </>
  );
}
