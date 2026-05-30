import { useMemo, useState } from "react";
import { Ban, Clock, Eye, RefreshCw } from "lucide-react";
import { inviteService } from "@/api/adminStudentGroup";
import { useToast } from "@/components/ui/Toast";
import { useGroupInvites } from "@/hooks/admin/useGroupInvites";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal from "@/pages/admin/components/FormModal";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import DetailGrid from "@/pages/admin/academic/components/DetailGrid";
import { useTranslation } from "@/context/TranslationContext";
import { formatDate, getInviteStatusOptions, pageLimit } from "@/pages/admin/student-group/shared";

export default function AdminGroupInvites() {
  const { t, language } = useTranslation();
  const toast = useToast();
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", status: "" });
  const { rows, meta, loading, error, refetch } = useGroupInvites(query);
  const [detail, setDetail] = useState(null);

  const inviteStatusOptions = useMemo(() => getInviteStatusOptions(t), [t]);

  const runAction = async (invite, action) => {
    try {
      if (action === "resend") await inviteService.resend(invite.id);
      if (action === "revoke") await inviteService.revoke(invite.id);
      if (action === "expire") await inviteService.expire(invite.id);
      toast.success(t("admin.toasts.statusSuccess"));
      await refetch();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const columns = [
    { key: "group", label: t("nav.studentGroups", { defaultValue: "Group" }) === "Nhóm sinh viên" ? "Nhóm" : "Group", render: (row) => <span className="font-semibold text-gray-900">{row.group_code} - {row.group_name}</span> },
    { key: "student", label: t("admin.fields.fullName", { defaultValue: "Student" }) === "Họ và tên" ? "Sinh viên" : "Student", render: (row) => `${row.student_code} - ${row.student_name}` },
    { key: "intended_role", label: t("common.confirm") === "Xác nhận" ? "Vai trò" : "Role", render: (row) => <StatusBadge value={row.intended_role} /> },
    { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "email_delivery_status", label: "Email", render: (row) => row.email_delivery_status || "—" },
    { key: "expires_at", label: t("common.confirm") === "Xác nhận" ? "Hết hạn" : "Expires", render: (row) => formatDate(row.expires_at) },
    { key: "invited_by", label: t("common.confirm") === "Xác nhận" ? "Người mời" : "Invited by", render: (row) => row.invited_by_name || row.invited_by || "—" },
    { key: "created_at", label: t("common.created"), render: (row) => formatDate(row.created_at) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => setDetail(row)} title={t("admin.actions.detail")}><Eye size={16} /></ActionButton>
          <ActionButton onClick={() => runAction(row, "resend")} title="Resend" tone="blue"><RefreshCw size={16} /></ActionButton>
          <ActionButton onClick={() => runAction(row, "expire")} title="Expire" tone="gray"><Clock size={16} /></ActionButton>
          <ActionButton onClick={() => runAction(row, "revoke")} title="Revoke" tone="red"><Ban size={16} /></ActionButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <FilterBar>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("common.confirm") === "Xác nhận" ? "Nhóm, sinh viên..." : "Group, student..."} />
        <FilterSelect label={t("admin.fields.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={inviteStatusOptions} />
      </FilterBar>

      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText={t("common.noData")} />

      <FormModal
        open={!!detail}
        title={t("common.confirm") === "Xác nhận" ? "Chi tiết lời mời" : "Group invite details"}
        onClose={() => setDetail(null)}
        onSubmit={(event) => { event.preventDefault(); setDetail(null); }}
        submitLabel={t("admin.actions.close")}
      >
        {detail ? (
          <DetailGrid items={[
            [t("nav.studentGroups", { defaultValue: "Group" }) === "Nhóm sinh viên" ? "Nhóm" : "Group", `${detail.group_code} - ${detail.group_name}`],
            [t("admin.fields.fullName", { defaultValue: "Student" }) === "Họ và tên" ? "Sinh viên" : "Student", `${detail.student_code} - ${detail.student_name}`],
            [t("admin.fields.email"), detail.email],
            [t("common.confirm") === "Xác nhận" ? "Vai trò" : "Role", detail.intended_role],
            [t("admin.fields.status"), detail.status],
            [t("common.confirm") === "Xác nhận" ? "Trạng thái Email" : "Email status", detail.email_delivery_status || "—"],
            [t("common.confirm") === "Xác nhận" ? "Lỗi gửi Email" : "Email error", detail.email_last_error || "—"],
            [t("common.confirm") === "Xác nhận" ? "Hết hạn" : "Expires", formatDate(detail.expires_at)],
            [t("common.created"), formatDate(detail.created_at)],
          ]} />
        ) : null}
      </FormModal>
    </>
  );
}
