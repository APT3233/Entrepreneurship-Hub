import { useMemo, useState } from "react";
import { useTranslation } from "@/context/TranslationContext";
import { Download, RotateCcw, Trash2, FileDown } from "lucide-react";
import { fileService } from "@/api/adminProjectSubmission";
import { useToast } from "@/components/ui/Toast";
import { useSubmissionFiles } from "@/hooks/admin/useSubmissionFiles";
import { useAdminUrlQuerySync } from "@/hooks/admin/useAdminUrlQuerySync";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import {
  fetchAllAdminRows,
  formatBytes,
  formatDate,
  getBooleanOptions,
  getFileSourceOptions,
  pageLimit,
} from "@/pages/admin/project-submission/shared";
import { countActiveAdminFilters } from "@/pages/admin/shared/filterUtils";
import { downloadCsv } from "@/utils/exportCsv";

export default function AdminSubmissionFiles() {
  const { t } = useTranslation();
  const toast = useToast();
  const fileSourceOptions = useMemo(() => getFileSourceOptions(t), [t]);
  const booleanOptions = useMemo(() => getBooleanOptions(t), [t]);
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", source: "", is_deleted: "" });
  useAdminUrlQuerySync({
    query,
    setQuery,
    keys: ["page", "search", "source", "is_deleted"],
  });
  const { rows, meta, loading, error, refetch } = useSubmissionFiles(query);
  const [confirmFile, setConfirmFile] = useState(null);

  const runAction = async () => {
    if (!confirmFile) return;
    try {
      if (Number(confirmFile.is_deleted || 0)) await fileService.restore(confirmFile.source, confirmFile.id);
      else await fileService.remove(confirmFile.source, confirmFile.id);
      toast.success("Đã cập nhật file");
      setConfirmFile(null);
      await refetch();
    } catch (err) {
      toast.error(err.message || "Không cập nhật được file.");
    }
  };

  const exportAll = async () => {
    try {
      const all = await fetchAllAdminRows(fileService.list, query);
      if (!all.length) {
        toast.error("Không có dữ liệu để export.");
        return;
      }
      downloadCsv({
        filename: `admin-submission-files-${new Date().toISOString().slice(0, 10)}.csv`,
        headers: ["id", "source", "submission_id", "file_name", "file_type", "mime_type", "file_size", "group_name", "parent_title", "uploaded_by_name", "uploaded_at", "is_deleted"],
        rows: all.map((r) => ({
          id: r.id,
          source: r.source,
          submission_id: r.submission_id,
          file_name: r.file_name,
          file_type: r.file_type,
          mime_type: r.mime_type,
          file_size: r.file_size,
          group_name: r.group_name || "",
          parent_title: r.parent_title || "",
          uploaded_by_name: r.uploaded_by_name || r.uploaded_by || "",
          uploaded_at: r.uploaded_at || "",
          is_deleted: r.is_deleted,
        })),
      });
    } catch (err) {
      toast.error(err.message || "Không export được dữ liệu.");
    }
  };

  const columns = [
    { key: "file_name", label: "File name", render: (row) => <span className="font-semibold text-gray-900">{row.file_name}</span> },
    { key: "file_type", label: "Type", render: (row) => row.file_type || "—" },
    { key: "mime_type", label: "MIME", render: (row) => row.mime_type || "—" },
    { key: "file_size", label: "Size", render: (row) => formatBytes(row.file_size) },
    { key: "source", label: "Source", render: (row) => <StatusBadge value={row.source} /> },
    { key: "submission", label: "Submission", render: (row) => `${row.source} #${row.submission_id}` },
    { key: "group", label: "Group", render: (row) => row.group_name || "—" },
    { key: "parent", label: "Checkpoint/Assignment", render: (row) => row.parent_title },
    { key: "uploaded_by", label: "Uploaded by", render: (row) => row.uploaded_by_name || row.uploaded_by || "—" },
    { key: "uploaded_at", label: "Uploaded", render: (row) => formatDate(row.uploaded_at) },
    { key: "is_deleted", label: "Deleted", render: (row) => Number(row.is_deleted || 0) ? <StatusBadge value="deleted" /> : "—" },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => window.open(row.file_url || row.file_path, "_blank", "noreferrer")} title="Preview/download"><Download size={16} /></ActionButton>
          <ActionButton onClick={() => setConfirmFile(row)} title={Number(row.is_deleted || 0) ? "Restore" : "Soft delete"} tone={Number(row.is_deleted || 0) ? "green" : "red"}>
            {Number(row.is_deleted || 0) ? <RotateCcw size={16} /> : <Trash2 size={16} />}
          </ActionButton>
        </div>
      ),
    },
  ];

  const activeFilterCount = countActiveAdminFilters(query, ["page", "limit", "search"]);

  return (
    <>
      <FilterBar
        search={(
          <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("searchPlaceholders.submissionFiles")} />
        )}
        activeFilterCount={activeFilterCount}
        onClear={() => setQuery((prev) => ({ ...prev, page: 1, search: "", source: "", is_deleted: "" }))}
        right={(
          <button type="button" onClick={exportAll} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <FileDown size={16} /> Export CSV
          </button>
        )}
      >
        <FilterSelect label={t("filterLabels.source")} value={query.source} onChange={(source) => setQuery((prev) => ({ ...prev, page: 1, source }))} options={fileSourceOptions} />
        <FilterSelect label={t("filterLabels.deleted")} value={query.is_deleted} onChange={(is_deleted) => setQuery((prev) => ({ ...prev, page: 1, is_deleted }))} options={booleanOptions} />
      </FilterBar>

      <AdminTable
        columns={columns}
        rows={rows.map((file) => ({ ...file, row_key: `${file.source}:${file.id}` }))}
        rowKey="row_key"
        loading={loading}
        error={error}
        meta={meta}
        onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))}
        emptyText={t("admin.empty.submissionFiles")}
      />

      <ConfirmDialog
        isOpen={!!confirmFile}
        title={Number(confirmFile?.is_deleted || 0) ? "Restore file" : "Soft delete file"}
        subtitle={confirmFile?.file_name || ""}
        variant={Number(confirmFile?.is_deleted || 0) ? "restore" : "delete"}
        color={Number(confirmFile?.is_deleted || 0) ? "green" : "red"}
        yesLabel={Number(confirmFile?.is_deleted || 0) ? "Restore" : "Delete"}
        onYes={runAction}
        onClose={() => setConfirmFile(null)}
      />
    </>
  );
}
