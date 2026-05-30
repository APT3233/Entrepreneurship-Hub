import { useMemo, useState } from "react";
import { Eye, RefreshCcw, RotateCcw, XCircle } from "lucide-react";
import { invitationService } from "@/api/adminEvaluationOps";
import { useToast } from "@/components/ui/Toast";
import { useAdminInvitations } from "@/hooks/admin/useAdminInvitations";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import FormModal from "@/pages/admin/components/FormModal";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import JsonDiffViewer from "@/pages/admin/evaluation-ops/components/JsonDiffViewer";
import { useTranslation } from "@/context/TranslationContext";
import {
  formatDate,
  getEmailDeliveryStatusOptions,
  getInvitationStatusOptions,
  getInvitationTypeOptions,
  pageLimit,
} from "@/pages/admin/evaluation-ops/shared";

export default function AdminInvitations() {
  const { t } = useTranslation();
  const toast = useToast();
  const invitationTypeOptions = useMemo(() => getInvitationTypeOptions(t), [t]);
  const statusOptions = useMemo(() => getInvitationStatusOptions(t), [t]);
  const emailStatusOptions = useMemo(() => getEmailDeliveryStatusOptions(t), [t]);
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", type: "", status: "", email_delivery_status: "" });
  const { rows, meta, loading, error, refetch } = useAdminInvitations(query);
  const [confirmAction, setConfirmAction] = useState(null);
  const [payloadModal, setPayloadModal] = useState(null);

  const runAction = async () => {
    if (!confirmAction) return;
    try {
      const { action, row } = confirmAction;
      if (action === "retry") await invitationService.retryEmailEvent(row.source_id);
      if (action === "resend") await invitationService.resend(row.type, row.source_id);
      if (action === "revoke") await invitationService.revoke(row.type, row.source_id);
      toast.success(t("admin.toasts.statusSuccess"));
      setConfirmAction(null);
      await refetch();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const columns = [
    { key: "type", label: t("filterLabels.type"), render: (row) => <StatusBadge value={row.type} /> },
    { key: "email", label: t("admin.fields.email"), render: (row) => row.email || row.student_name || row.event_type || "—" },
    { key: "class", label: t("filterLabels.class"), render: (row) => row.group_name || row.class_code || row.public_id || "—" },
    { key: "status", label: t("filterLabels.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "email_delivery_status", label: t("filterLabels.email"), render: (row) => <StatusBadge value={row.email_delivery_status || "pending"} /> },
    { key: "attempts", label: "Attempts", render: (row) => Number(row.attempts || 0) },
    { key: "last_error", label: "Last error", render: (row) => <span className="line-clamp-2 max-w-[260px]">{row.last_error || "—"}</span> },
    { key: "expires_at", label: "Expires/retry", render: (row) => formatDate(row.expires_at) },
    { key: "created_at", label: t("common.created"), render: (row) => formatDate(row.created_at) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          {row.type === "email_event" ? (
            <ActionButton onClick={() => setConfirmAction({ action: "retry", row })} title="Retry" tone="blue"><RotateCcw size={16} /></ActionButton>
          ) : (
            <>
              <ActionButton onClick={() => setConfirmAction({ action: "resend", row })} title="Resend" tone="blue"><RefreshCcw size={16} /></ActionButton>
              <ActionButton onClick={() => setConfirmAction({ action: "revoke", row })} title="Revoke" tone="red"><XCircle size={16} /></ActionButton>
            </>
          )}
          <ActionButton onClick={() => setPayloadModal(row.payload || row.last_error || row)} title={t("admin.actions.detail")}><Eye size={16} /></ActionButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <FilterBar>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("searchPlaceholders.invitations")} />
        <FilterSelect label={t("filterLabels.type")} value={query.type} onChange={(type) => setQuery((prev) => ({ ...prev, page: 1, type }))} options={invitationTypeOptions} />
        <FilterSelect label={t("filterLabels.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={statusOptions} />
        <FilterSelect label={t("filterLabels.email")} value={query.email_delivery_status} onChange={(email_delivery_status) => setQuery((prev) => ({ ...prev, page: 1, email_delivery_status }))} options={emailStatusOptions} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText={t("admin.empty.invitations")} />
      <ConfirmDialog
        isOpen={!!confirmAction}
        title={t("admin.dialogs.statusConfirmTitle")}
        subtitle={confirmAction?.row ? `${confirmAction.action} · ${confirmAction.row.type}` : ""}
        variant={
          confirmAction?.action === "revoke"
            ? "revoke"
            : confirmAction?.action === "resend"
              ? "send"
              : confirmAction?.action === "retry"
                ? "restore"
                : "confirm"
        }
        color={confirmAction?.action === "revoke" ? "red" : "blue"}
        yesLabel={t("common.confirm")}
        onYes={runAction}
        onClose={() => setConfirmAction(null)}
      />
      <FormModal open={!!payloadModal} title="Payload" onClose={() => setPayloadModal(null)} onSubmit={(e) => { e.preventDefault(); setPayloadModal(null); }} submitLabel={t("admin.actions.close")}>
        <JsonDiffViewer value={payloadModal} />
      </FormModal>
    </>
  );
}
