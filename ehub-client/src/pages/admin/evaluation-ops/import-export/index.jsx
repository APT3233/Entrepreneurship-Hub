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
import { useAdminColumns } from "@/utils/adminLabels";
import { formatDate, getImportStatusOptions, pageLimit } from "@/pages/admin/evaluation-ops/shared";

export default function AdminImportExport() {
  const { t } = useTranslation();
  const c = useAdminColumns();
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
      toast.info(res?.data?.message || t("admin.evaluationOps.importExport.notImplemented"));
    } catch (err) {
      toast.error(err.message || t("admin.evaluationOps.importExport.actionFailed"));
    }
  };

  const columns = [
    { key: "file_name", label: c.file, render: (row) => <span className="font-semibold text-gray-900">{row.file_name}</span> },
    { key: "target_table", label: c.targetTable },
    { key: "target_class", label: c.targetClass, render: (row) => row.class_code || "—" },
    { key: "total_rows", label: c.total },
    { key: "success_rows", label: c.success },
    { key: "failed_rows", label: t("admin.evaluationOps.importExport.failed") },
    { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "started_at", label: c.started, render: (row) => formatDate(row.started_at) },
    { key: "completed_at", label: c.completed, render: (row) => formatDate(row.completed_at) },
    { key: "user", label: c.user, render: (row) => row.user_name || row.user_email || "—" },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end">
          <ActionButton onClick={() => setJsonModal(row.error_details || [])} title={t("admin.evaluationOps.importExport.importErrors")} tone="blue"><Eye size={16} /></ActionButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <PlannedState
        title={t("admin.evaluationOps.importExport.plannedTitle")}
        message={t("admin.evaluationOps.importExport.plannedMessage")}
      />
      <div className="mt-4">
        <FilterBar
          right={(
            <>
              <button type="button" onClick={() => runPlanned("upload")} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <Upload size={16} /> {t("admin.evaluationOps.importExport.upload")}
              </button>
              <button type="button" onClick={() => runPlanned("template")} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <Download size={16} /> {t("admin.evaluationOps.importExport.template")}
              </button>
              <button type="button" onClick={() => runPlanned("export")} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover">
                <FileDown size={16} /> {t("common.export")}
              </button>
            </>
          )}
        >
          <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("searchPlaceholders.importLogs")} />
          <FilterSelect label={t("filterLabels.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={importStatusOptions} />
          <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
            {t("admin.evaluationOps.importExport.table")}
            <input className="h-10 w-36 rounded-xl border border-border px-3 text-sm text-gray-700 outline-none focus:border-accent focus:ring-2 focus:ring-accent" value={query.target_table} onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, target_table: e.target.value }))} placeholder={t("admin.evaluationOps.importExport.targetTablePlaceholder")} />
          </label>
        </FilterBar>
        <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText={t("admin.empty.importLogs")} />
      </div>
      <FormModal open={jsonModal !== null} title={t("admin.evaluationOps.importExport.importErrors")} onClose={() => setJsonModal(null)} onSubmit={(e) => { e.preventDefault(); setJsonModal(null); }} submitLabel={t("admin.evaluationOps.importExport.importErrorsOk")}>
        <JsonDiffViewer payload={jsonModal} />
      </FormModal>
    </>
  );
}
