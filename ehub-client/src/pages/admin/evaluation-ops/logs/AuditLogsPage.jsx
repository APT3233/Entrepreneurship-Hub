import { useState } from "react";
import { X, Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";
import { useAdminAuditLogs } from "@/hooks/admin/useAdminLogs";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import { useTranslation } from "@/context/TranslationContext";
import { pageLimit } from "@/pages/admin/evaluation-ops/shared";

export default function AuditLogsPage() {
  const { t, language } = useTranslation();
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "" });
  const { rows, meta, loading, error } = useAdminAuditLogs(query);
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
      "Action": row.action,
      "Table Name": row.table_name || "—",
      "Title": row.title || "—",
      "User / Account": row.user_name || row.user_email || "—",
      "Created At": formatDate(row.created_at),
      "Record ID": row.row_id || "—",
      "Old Values": typeof row.old_values === "object" ? JSON.stringify(row.old_values) : (row.old_values || "—"),
      "New Values": typeof row.new_values === "object" ? JSON.stringify(row.new_values) : (row.new_values || "—")
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit_Logs");
    worksheet["!cols"] = [15, 20, 30, 25, 25, 15, 40, 40].map(w => ({ wch: w }));
    XLSX.writeFile(workbook, `audit_logs_${getFormattedTimeSuffix()}.xlsx`);
  };

  const exportToTxt = () => {
    let text = "==================== AUDIT LOGS REPORT ====================\n\n";
    rows.forEach((row, i) => {
      text += `[Log #${i + 1}]\n`;
      text += `Action: ${row.action}\n`;
      text += `Table Name: ${row.table_name || "—"}\n`;
      text += `Record ID: ${row.row_id || "—"}\n`;
      text += `Title: ${row.title || "—"}\n`;
      text += `User / Account: ${row.user_name || row.user_email || "—"}\n`;
      text += `Created At: ${formatDate(row.created_at)}\n`;
      text += `Old Values: ${typeof row.old_values === "object" ? JSON.stringify(row.old_values) : (row.old_values || "—")}\n`;
      text += `New Values: ${typeof row.new_values === "object" ? JSON.stringify(row.new_values) : (row.new_values || "—")}\n`;
      text += `-----------------------------------------------------------\n\n`;
    });
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit_logs_${getFormattedTimeSuffix()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (value) => value ? new Date(value).toLocaleString(language === "en" ? "en-US" : "vi-VN") : "—";

  const columns = [
    { key: "action", label: t("admin.fields.action") || "Action", width: 150, render: (row) => <span className="font-mono text-xs font-bold text-indigo-700">{row.action}</span> },
    { key: "table_name", label: t("admin.fields.tableName") || "Table", width: 150, render: (row) => row.table_name || "—" },
    { key: "title", label: t("admin.fields.title") || "Title", width: 250, render: (row) => row.title || "—" },
    { key: "user_name", label: t("nav.users"), width: 180, render: (row) => row.user_name || row.user_email || "—" },
    { key: "created_at", label: t("common.created"), width: 180, render: (row) => formatDate(row.created_at) },
  ];

  const renderJsonBlock = (val) => {
    if (!val) return "—";
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
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer select-none transition-colors"
            >
              <Download size={15} className="text-gray-400" />
              {t("common.export") || "Xuất file"}
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 mt-1.5 z-20 w-40 rounded-xl border border-gray-100 bg-white py-1 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-100">
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
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder="Action, table, user..." />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, ...(limit ? { limit } : {}) }))} emptyText={t("admin.empty.auditLogs")} onRowClick={setSelectedLog} />

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 bg-gray-50/50">
              <div className="flex items-center gap-2 max-w-[80%]">
                <span className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded uppercase">
                  {selectedLog.action}
                </span>
                <span className="text-xs font-semibold text-gray-700 truncate" title={selectedLog.title || t("nav.auditLogs")}>
                  {selectedLog.title || t("nav.auditLogs")}
                </span>
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
                  <span className="text-gray-800 font-semibold">{selectedLog.table_name || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-400 font-medium">Record ID</span>
                  <span className="font-mono text-gray-800 font-semibold">{selectedLog.row_id || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-400 font-medium">{t("nav.users") || "Người thực hiện"}</span>
                  <span className="text-gray-800 font-semibold truncate max-w-[200px]" title={selectedLog.user_name || selectedLog.user_email}>{selectedLog.user_name || selectedLog.user_email || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-400 font-medium">{t("common.created") || "Thời gian thực hiện"}</span>
                  <span className="text-gray-800 font-semibold">{formatDate(selectedLog.created_at)}</span>
                </div>
              </div>

              {/* JSON diff display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                    Old Values
                  </label>
                  <pre className="text-[10px] font-mono text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100 max-h-[90px] overflow-y-auto whitespace-pre-wrap break-all select-all leading-normal">
                    {renderJsonBlock(selectedLog.old_values)}
                  </pre>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                    New Values
                  </label>
                  <pre className="text-[10px] font-mono text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100 max-h-[90px] overflow-y-auto whitespace-pre-wrap break-all select-all leading-normal">
                    {renderJsonBlock(selectedLog.new_values)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-gray-100 px-5 py-2.5 bg-gray-50/35">
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
