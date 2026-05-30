import { useCallback, useEffect, useState } from "react";
import { logService } from "@/api/adminEvaluationOps";
import AdminTable from "@/pages/admin/components/AdminTable";
import { useTranslation } from "@/context/TranslationContext";
import { formatDate, pageLimit } from "@/pages/admin/student-group/shared";

export default function ClassActivityTab({ classCode }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: classCode || "" });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!classCode) return;
    setLoading(true);
    setError("");
    try {
      const res = await logService.listAudit({ ...query, search: classCode });
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setLoading(false);
    }
  }, [classCode, query, t]);

  useEffect(() => {
    setQuery((prev) => ({ ...prev, page: 1, search: classCode || "" }));
  }, [classCode]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { key: "action", label: "Action", render: (row) => <span className="font-mono text-xs font-bold text-indigo-700">{row.action}</span> },
    { key: "table_name", label: "Table", render: (row) => row.table_name || "—" },
    { key: "title", label: "Title", render: (row) => row.title || "—" },
    { key: "user_name", label: t("admin.fields.fullName", { defaultValue: "User" }), render: (row) => row.user_name || row.user_email || "—" },
    { key: "created_at", label: t("common.created"), render: (row) => formatDate(row.created_at) },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {t("common.confirm") === "Xác nhận"
          ? `Nhật ký thao tác liên quan mã lớp ${classCode} (audit log).`
          : `Audit log entries related to class code ${classCode}.`}
      </p>
      <AdminTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        meta={meta}
        onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))}
        emptyText={t("common.noData")}
      />
    </div>
  );
}
