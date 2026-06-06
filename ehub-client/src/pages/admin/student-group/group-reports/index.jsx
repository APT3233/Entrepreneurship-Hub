import { useMemo, useState } from "react";
import { ExternalLink, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { reportService } from "@/api/adminStudentGroup";
import { useToast } from "@/components/ui/Toast";
import { useGroupReports } from "@/hooks/admin/useGroupReports";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal from "@/pages/admin/components/FormModal";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import DetailGrid from "@/pages/admin/academic/components/DetailGrid";
import { useTranslation } from "@/context/TranslationContext";
import { formatDate, getIssueTypeOptions, pageLimit } from "@/pages/admin/student-group/shared";

export default function AdminGroupReports() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", issue_type: "" });
  const { rows, meta, loading, error } = useGroupReports(query);
  const [detail, setDetail] = useState(null);

  const issueTypeOptions = useMemo(() => getIssueTypeOptions(t), [t]);

  const openDetail = async (report) => {
    try {
      const res = await reportService.get(report.id);
      setDetail(res?.data || report);
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const columns = [
    { key: "group", label: t("admin.fields.group"), render: (row) => <span className="font-semibold text-gray-900">{row.group_name || "—"}</span> },
    { key: "student", label: t("admin.fields.fullName", { defaultValue: "Student" }) === "Họ và tên" ? "Sinh viên" : "Student", render: (row) => `${row.student_code} - ${row.student_name}` },
    { key: "issue_type", label: t("common.confirm") === "Xác nhận" ? "Vấn đề" : "Issue", render: (row) => <StatusBadge value={row.issue_type} /> },
    { key: "description", label: t("admin.fields.description"), render: (row) => <span className="line-clamp-2">{row.description}</span> },
    { key: "created_at", label: t("common.created"), render: (row) => formatDate(row.created_at) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => openDetail(row)} title={t("admin.actions.detail")}><Eye size={16} /></ActionButton>
          <ActionButton onClick={() => navigate(`/admin/groups/${row.group_id}`)} title={t("common.confirm") === "Xác nhận" ? "Đến nhóm" : "Go to group"} tone="indigo"><ExternalLink size={16} /></ActionButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <FilterBar>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("common.confirm") === "Xác nhận" ? "Nhóm, sinh viên..." : "Group, student..."} />
        <FilterSelect label={t("filterLabels.issue")} value={query.issue_type} onChange={(issue_type) => setQuery((prev) => ({ ...prev, page: 1, issue_type }))} options={issueTypeOptions} />
      </FilterBar>

      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText={t("common.noData")} />

      <FormModal
        open={!!detail}
        title={t("common.confirm") === "Xác nhận" ? "Chi tiết báo cáo" : "Group report details"}
        onClose={() => setDetail(null)}
        onSubmit={(event) => { event.preventDefault(); setDetail(null); }}
        submitLabel={t("admin.actions.close")}
      >
        {detail ? (
          <DetailGrid items={[
            [t("admin.fields.group"), detail.group_name || "—"],
            [t("admin.fields.fullName", { defaultValue: "Student" }) === "Họ và tên" ? "Sinh viên" : "Student", `${detail.student_code} - ${detail.student_name}`],
            [t("admin.fields.email"), detail.email],
            [t("common.confirm") === "Xác nhận" ? "Vấn đề" : "Issue", detail.issue_type],
            [t("admin.fields.description"), detail.description],
            [t("common.created"), formatDate(detail.created_at)],
          ]} />
        ) : null}
      </FormModal>
    </>
  );
}
