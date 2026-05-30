import { useMemo, useState } from "react";
import { Download, Eye, FileDown, Upload } from "lucide-react";
import { importExportService } from "@/api/adminEvaluationOps";
import { useToast } from "@/components/ui/Toast";
import { useAdminImportLogs } from "@/hooks/admin/useAdminImportLogs";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal from "@/pages/admin/components/FormModal";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import JsonDiffViewer from "@/pages/admin/evaluation-ops/components/JsonDiffViewer";
import PlannedState from "@/pages/admin/evaluation-ops/components/PlannedState";
import { useTranslation } from "@/context/TranslationContext";
import { formatDate, getImportStatusOptions, pageLimit } from "@/pages/admin/evaluation-ops/shared";

export default function AdminImportExport() {
  const { t } = useTranslation();
  const importStatusOptions = useMemo(() => getImportStatusOptions(t), [t]);
  const toast = useToast();
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", status: "", target_table: "" });
  const { rows, meta, loading, error } = useAdminImportLogs(query);
  const [jsonModal, setJsonModal] = useState(null);

  const runPlanned = async (action) => {
    try {
      const serviceCall = {
        upload: importExportService.upload,
        template: importExportService.downloadTemplate,
        export: importExportService.exportData,
      }[action];
      const res = await serviceCall();
      toast.info(res?.data?.message || "Import/export API chưa triển khai.");
    } catch (err) {
      toast.error(err.message || "Thao tác import/export thất bại.");
    }
  };

  const columns = [
    { key: "file_name", label: "File", render: (row) => <span className="font-semibold text-gray-900">{row.file_name}</span> },
    { key: "target_table", label: "Target table" },
    { key: "target_class", label: "Target class", render: (row) => row.class_code || "—" },
    { key: "total_rows", label: "Total" },
    { key: "success_rows", label: "Success" },
    { key: "failed_rows", label: "Failed" },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "started_at", label: "Started", render: (row) => formatDate(row.started_at) },
    { key: "completed_at", label: "Completed", render: (row) => formatDate(row.completed_at) },
    { key: "user", label: "User", render: (row) => row.user_name || row.user_email || "—" },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end">
          <ActionButton onClick={() => setJsonModal(row.error_details || [])} title="Import errors" tone="blue"><Eye size={16} /></ActionButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <PlannedState
        title="Upload/export file API đang ở planned state"
        message="Lịch sử import đọc từ import_logs thật. Các thao tác upload template/export đã có service và endpoint placeholder để nối file processor sau."
      />
      <div className="mt-4">
        <FilterBar
          right={(
            <>
              <button type="button" onClick={() => runPlanned("upload")} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <Upload size={16} /> Upload
              </button>
              <button type="button" onClick={() => runPlanned("template")} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <Download size={16} /> Template
              </button>
              <button type="button" onClick={() => runPlanned("export")} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                <FileDown size={16} /> Export
              </button>
            </>
          )}
        >
          <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("searchPlaceholders.importLogs")} />
          <FilterSelect label={t("filterLabels.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={importStatusOptions} />
          <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
            Table
            <input className="h-10 w-36 rounded-xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" value={query.target_table} onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, target_table: e.target.value }))} placeholder="students" />
          </label>
        </FilterBar>
        <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText={t("admin.empty.importLogs")} />
      </div>
      <FormModal open={jsonModal !== null} title="Import errors" onClose={() => setJsonModal(null)} onSubmit={(e) => { e.preventDefault(); setJsonModal(null); }} submitLabel="OK">
        <JsonDiffViewer payload={jsonModal} />
      </FormModal>
    </>
  );
}
