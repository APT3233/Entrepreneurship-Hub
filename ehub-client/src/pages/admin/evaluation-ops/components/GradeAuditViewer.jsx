import { useMemo } from "react";
import AdminTable from "@/pages/admin/components/AdminTable";
import JsonDiffViewer from "@/pages/admin/evaluation-ops/components/JsonDiffViewer";
import { useTranslation } from "@/context/TranslationContext";
import { useAdminColumns } from "@/utils/adminLabels";
import { formatDate } from "@/pages/admin/evaluation-ops/shared";

export default function GradeAuditViewer({ rows, loading, error, meta, onPageChange, selected, onSelect, onClose }) {
  const { t } = useTranslation();
  const c = useAdminColumns();

  const columns = useMemo(() => [
    { key: "user", label: c.user, width: 180, render: (row) => row.user_name || row.user_email || "—" },
    { key: "action", label: c.action, width: 180, render: (row) => <span className="font-mono text-xs font-bold text-indigo-700">{row.action}</span> },
    { key: "table_name", label: c.table, width: 160 },
    { key: "record_id", label: c.record, width: 90, render: (row) => row.record_id || row.row_id || "—" },
    { key: "ip_address", label: c.ip, width: 130, render: (row) => row.ip_address || "—" },
    { key: "created_at", label: c.created, width: 170, render: (row) => formatDate(row.created_at) },
  ], [c]);

  return (
    <>
      <AdminTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        meta={meta}
        onPageChange={onPageChange}
        onRowClick={onSelect}
        emptyText={t("admin.evaluation.gradeAuditEmpty")}
      />
      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]" onClick={(event) => event.target === event.currentTarget && onClose?.()}>
          <div className="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <p className="font-mono text-xs font-bold text-indigo-700">{selected.action}</p>
                <h3 className="mt-1 text-lg font-black text-gray-900">{selected.table_name} #{selected.record_id || selected.row_id || "—"}</h3>
              </div>
              <button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50">{t("admin.actions.close")}</button>
            </div>
            <div className="max-h-[70vh] overflow-auto p-5">
              <JsonDiffViewer oldValue={selected.old_values} newValue={selected.new_values} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
