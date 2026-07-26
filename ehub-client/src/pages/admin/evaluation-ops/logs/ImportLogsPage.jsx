import { useMemo, useState } from "react";
import { X, Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";
import { useAdminImportLogs } from "@/hooks/admin/useAdminImportLogs";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { useTranslation } from "@/context/TranslationContext";
import { formatDate, getImportStatusOptions, pageLimit } from "@/pages/admin/evaluation-ops/shared";

export default function ImportLogsPage() {
  const { t, language } = useTranslation();
  const importStatusOptions = useMemo(() => getImportStatusOptions(t), [t]);

  const formatDateTimeSingle = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleString(language === "en" ? "en-US" : "vi-VN");
  };
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", status: "", target_table: "" });
  const { rows, meta, loading, error } = useAdminImportLogs(query);
  const [selectedLog, setSelectedLog] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);

  const getFormattedTimeSuffix = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const dateStr = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const timeStr = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    return `${dateStr}_${timeStr}`;
  };

  const exportToExcel = () => {
    const data = rows.map((row) => ({
      "File Name": row.file_name,
      "Target Table": row.target_table || "—",
      "Status": row.status || "—",
      "Success Rows": row.success_rows || 0,
      "Total Rows": row.total_rows || 0,
      "Imported By Name": row.imported_by_name || "—",
      "Imported By ID": row.imported_by_id || "—",
      "Created At": formatDateTimeSingle(row.created_at),
      "Error Message": row.error_message || "—",
      "Error Log": row.error_log ? JSON.stringify(row.error_log) : "—"
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Import_Logs");
    worksheet["!cols"] = [35, 20, 15, 15, 15, 25, 20, 25, 40, 40].map(w => ({ wch: w }));
    XLSX.writeFile(workbook, `import_logs_${getFormattedTimeSuffix()}.xlsx`);
  };

  const exportToTxt = () => {
    let text = "==================== IMPORT LOGS REPORT ====================\n\n";
    rows.forEach((row, i) => {
      text += `[Log #${i + 1}]\n`;
      text += `File Name: ${row.file_name}\n`;
      text += `Target Table: ${row.target_table || "—"}\n`;
      text += `Status: ${row.status || "—"}\n`;
      text += `Success Rows: ${row.success_rows || 0}\n`;
      text += `Total Rows: ${row.total_rows || 0}\n`;
      text += `Imported By Name: ${row.imported_by_name || "—"}\n`;
      text += `Imported By ID: ${row.imported_by_id || "—"}\n`;
      text += `Created At: ${formatDateTimeSingle(row.created_at)}\n`;
      text += `Error Message: ${row.error_message || "—"}\n`;
      text += `Error Log: ${row.error_log ? JSON.stringify(row.error_log) : "—"}\n`;
      text += `------------------------------------------------------------\n\n`;
    });
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `import_logs_${getFormattedTimeSuffix()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { key: "file_name", label: t("admin.fields.fileName") || "File", width: 250, render: (row) => <span className="font-semibold text-gray-900">{row.file_name}</span> },
    { key: "target_table", label: t("admin.fields.tableName") || "Table", width: 150, render: (row) => row.target_table || "—" },
    { key: "status", label: t("filterLabels.status"), width: 120, render: (row) => <StatusBadge value={row.status} /> },
    { key: "total_rows", label: t("admin.fields.rows") || "Rows", width: 100, render: (row) => `${row.success_rows || 0}/${row.total_rows || 0}` },
    { key: "imported_by_name", label: t("admin.fields.importedBy") || "By", width: 180, render: (row) => row.imported_by_name || "—" },
    { key: "created_at", label: t("common.created"), width: 180, render: (row) => formatDate(row.created_at) },
  ];

  const renderErrorLog = (val) => {
    if (!val) return null;
    try {
      const parsed = typeof val === "string" ? JSON.parse(val) : val;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(val);
    }
  };

  return (
    <>
      <FilterBar
        right={
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer select-none transition-colors"
            >
              <Download size={15} className="text-gray-400" />
              {t("common.export") || "Xuất file"}
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 mt-1.5 z-20 w-40 rounded-xl border border-border bg-surface py-1 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      exportToExcel();
                      setExportOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <FileSpreadsheet size={14} className="text-emerald-500" />
                    Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportToTxt();
                      setExportOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <FileText size={14} className="text-blue-500" />
                    TXT (.txt)
                  </button>
                </div>
              </>
            )}
          </div>
        }
      >
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("searchPlaceholders.importLogs")} />
        <FilterSelect label={t("filterLabels.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={importStatusOptions} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, ...(limit ? { limit } : {}) }))} emptyText={t("admin.empty.importLogs")} onRowClick={setSelectedLog} />

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-card bg-surface shadow-2xl overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3 bg-gray-50/50">
              <div className="flex items-center gap-2 max-w-[80%]">
                <span className="text-xs font-bold text-gray-700 truncate" title={selectedLog.file_name}>
                  {selectedLog.file_name}
                </span>
                <StatusBadge value={selectedLog.status} />
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedLog(null)} 
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-3 max-h-[60vh] overflow-y-auto space-y-2">
              <div className="divide-y divide-gray-50 text-xs">
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-400 font-medium">{t("admin.fields.tableName") || "Bảng dữ liệu"}</span>
                  <span className="text-gray-800 font-semibold">{selectedLog.target_table || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-400 font-medium">{t("admin.fields.rows") || "Số dòng (Thành công / Tổng số)"}</span>
                  <span className="font-mono text-gray-800 font-semibold">{selectedLog.success_rows || 0} / {selectedLog.total_rows || 0}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-400 font-medium">{t("admin.fields.importedBy") || "Người thực hiện"}</span>
                  <span className="text-gray-800 font-semibold truncate max-w-[200px]">{selectedLog.imported_by_name || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-400 font-medium">{t("common.created") || "Thời gian thực hiện"}</span>
                  <span className="text-gray-800 font-semibold">{formatDateTimeSingle(selectedLog.created_at)}</span>
                </div>
              </div>

              {/* Error messages or error log */}
              {selectedLog.error_message && (
                <div className="pt-2 border-t border-border">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-red-500 block mb-0.5">
                    Error Message
                  </label>
                  <div className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-1.5 rounded-lg border border-red-100 break-all select-all leading-relaxed">
                    {selectedLog.error_message}
                  </div>
                </div>
              )}

              {selectedLog.error_log && (
                <div className="pt-2 border-t border-border">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                    Detailed Error Log
                  </label>
                  <pre className="text-[10px] font-mono text-gray-600 bg-gray-50 p-2 rounded-lg border border-border max-h-[100px] overflow-y-auto whitespace-pre-wrap break-all select-all leading-normal">
                    {renderErrorLog(selectedLog.error_log)}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-border px-5 py-2.5 bg-gray-50/35">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-gray-100 hover:bg-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-700 cursor-pointer transition-colors"
              >
                {t("common.close") || "Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
