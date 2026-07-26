import { useMemo, useState, useEffect } from "react";
import { X, Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";
import { useAdminApiAccessLogs } from "@/hooks/admin/useAdminLogs";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { useTranslation } from "@/context/TranslationContext";
import { getMethodOptions, pageLimit } from "@/pages/admin/evaluation-ops/shared";
import { formatDate } from "@/utils/dateTimeDisplay";

export default function ApiAccessLogsPage() {
  const { t, language } = useTranslation();
  const methodOptions = useMemo(() => getMethodOptions(t), [t]);

  const formatDateTimeSingle = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleString(language === "en" ? "en-US" : "vi-VN");
  };
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", method: "" });
  const { rows, meta, loading, error, refetch } = useAdminApiAccessLogs(query);

  const [liveInterval, setLiveInterval] = useState(0); // 0 = off
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
      "Method": row.method,
      "Path": row.path,
      "Status": row.status_code || "—",
      "Response Time (ms)": row.response_time != null ? `${row.response_time} ms` : "—",
      "User ID": row.user_id || "—",
      "User Name": row.user_name || "—",
      "User Email": row.user_email || "—",
      "IP Address": row.ip_address || "—",
      "Timestamp": formatDateTimeSingle(row.timestamp),
      "Request ID": row.request_id || "—",
      "User Agent": row.user_agent || "—"
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "API_Logs");
    worksheet["!cols"] = [10, 40, 10, 20, 20, 25, 25, 15, 25, 30, 40].map(w => ({ wch: w }));
    XLSX.writeFile(workbook, `api_access_logs_${getFormattedTimeSuffix()}.xlsx`);
  };

  const exportToTxt = () => {
    let text = "==================== API ACCESS LOGS REPORT ====================\n\n";
    rows.forEach((row, i) => {
      text += `[Log #${i + 1}]\n`;
      text += `Method: ${row.method}\n`;
      text += `Path: ${row.path}\n`;
      text += `Status Code: ${row.status_code || "—"}\n`;
      text += `Response Time: ${row.response_time != null ? `${row.response_time} ms` : "—"}\n`;
      text += `User ID: ${row.user_id || "—"}\n`;
      text += `User Name: ${row.user_name || "—"}\n`;
      text += `User Email: ${row.user_email || "—"}\n`;
      text += `IP Address: ${row.ip_address || "—"}\n`;
      text += `Timestamp: ${formatDateTimeSingle(row.timestamp)}\n`;
      text += `Request ID: ${row.request_id || "—"}\n`;
      text += `User Agent: ${row.user_agent || "—"}\n`;
      text += `----------------------------------------------------------------\n\n`;
    });
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `api_access_logs_${getFormattedTimeSuffix()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (liveInterval <= 0) return;

    const intervalId = setInterval(() => {
      refetch(true);
    }, liveInterval);

    return () => clearInterval(intervalId);
  }, [liveInterval, refetch]);

  const intervalOptions = useMemo(() => [
    { value: 0, label: language === "en" ? "Off" : "Tắt" },
    { value: 1000, label: language === "en" ? "1s" : "1 giây" },
    { value: 5000, label: language === "en" ? "5s" : "5 giây" },
    { value: 15000, label: language === "en" ? "15s" : "15 giây" },
    { value: 30000, label: language === "en" ? "30s" : "30 giây" },
    { value: 60000, label: language === "en" ? "1m" : "1 phút" },
  ], [language]);

  const columns = [
    { key: "method", label: t("filterLabels.method"), width: 90, render: (row) => <span className="font-mono text-xs font-bold">{row.method}</span> },
    { key: "user_id", label: t("admin.fields.userId") || "User ID", width: 100, render: (row) => <span className="font-mono text-xs text-gray-600">{row.user_id || "—"}</span> },
    { key: "path", label: t("admin.fields.path") || "Path", width: 350, render: (row) => <span className="text-sm text-gray-800 truncate block w-full" title={row.path}>{row.path}</span> },
    { key: "status_code", label: t("filterLabels.status"), width: 100, render: (row) => <StatusBadge value={String(row.status_code)} /> },
    { key: "response_time", label: t("admin.fields.responseTime") || "Response Time", width: 120, render: (row) => <span className="font-mono text-xs text-gray-600">{row.response_time != null ? `${row.response_time} ms` : "—"}</span> },
    { key: "user_name", label: t("nav.users"), width: 160, render: (row) => row.user_name || row.user_email || "—" },
    { key: "ip_address", label: "IP", width: 120, render: (row) => row.ip_address || "—" },
    { key: "user_agent", label: t("admin.fields.userAgent") || "User Agent", width: 250, render: (row) => <span className="text-xs text-gray-500 truncate block w-full" title={row.user_agent}>{row.user_agent || "—"}</span> },
    { key: "timestamp", label: t("admin.fields.timestamp") || "Timestamp", width: 180, render: (row) => formatDate(row.timestamp) },
  ];

  return (
    <>
      <FilterBar
        right={
          <div className="flex items-center gap-2">
            <FilterSelect
              label={
                <span className="flex items-center gap-1.5 select-none font-semibold">
                  {liveInterval > 0 && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                  Live
                </span>
              }
              value={liveInterval}
              onChange={setLiveInterval}
              options={intervalOptions}
            />
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
          </div>
        }
      >
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder="Path, IP, user..." />
        <FilterSelect label={t("filterLabels.method")} value={query.method} onChange={(method) => setQuery((prev) => ({ ...prev, page: 1, method }))} options={methodOptions} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, ...(limit ? { limit } : {}) }))} emptyText={t("admin.empty.apiAccessLogs")} onRowClick={setSelectedLog} />

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-card bg-surface shadow-2xl overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3 bg-gray-50/50">
              <div className="flex items-center gap-2 max-w-[80%]">
                <span className="font-mono text-[10px] font-bold bg-accent-bg text-accent px-1.5 py-0.5 rounded uppercase">
                  {selectedLog.method}
                </span>
                <span className="text-xs font-semibold text-gray-700 truncate select-all font-mono" title={selectedLog.path}>
                  {selectedLog.path}
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
                  <span className="text-gray-400 font-medium">{t("admin.fields.userId") || "User ID"}</span>
                  <span className="font-mono text-gray-800 font-semibold">{selectedLog.user_id || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-400 font-medium">{t("nav.users") || "Tài khoản"}</span>
                  <span className="text-gray-800 font-semibold truncate max-w-[200px]" title={selectedLog.user_name || selectedLog.user_email}>{selectedLog.user_name || selectedLog.user_email || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-400 font-medium">{t("filterLabels.status") || "Trạng thái"}</span>
                  <StatusBadge value={String(selectedLog.status_code)} />
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-400 font-medium">{t("admin.fields.responseTime") || "Thời gian phản hồi"}</span>
                  <span className="font-mono text-gray-800 font-semibold">{selectedLog.response_time != null ? `${selectedLog.response_time} ms` : "—"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-400 font-medium">IP Address</span>
                  <span className="font-mono text-gray-800 font-semibold">{selectedLog.ip_address || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-400 font-medium">{t("admin.fields.timestamp") || "Thời gian ghi nhận"}</span>
                  <span className="text-gray-800 font-semibold">{formatDateTimeSingle(selectedLog.timestamp)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-400 font-medium">Request ID</span>
                  <span className="font-mono text-gray-400 select-all max-w-[200px] truncate" title={selectedLog.request_id}>{selectedLog.request_id || "—"}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                  {t("admin.fields.userAgent") || "User Agent"}
                </label>
                <div className="text-[10px] font-mono text-gray-500 bg-gray-50 px-2 py-1.5 rounded-lg border border-border select-all leading-relaxed max-h-[50px] overflow-y-auto">
                  {selectedLog.user_agent || "—"}
                </div>
              </div>
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
