import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import AdminAccessControlApi from "@/api/adminAccessControl";
import { useToast } from "@/components/ui/Toast";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import FormModal from "@/pages/admin/components/FormModal";
import { useTranslation } from "@/context/TranslationContext";

export default function AdminPermissions() {
  const { t } = useTranslation();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", module: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await AdminAccessControlApi.getPermissions(query);
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.limit, query.search, query.module]);

  const moduleOptions = useMemo(() => {
    const modules = [...new Set(rows.map((row) => row.module).filter(Boolean))];
    return [{ value: "", label: t("common.confirm") === "Xác nhận" ? "Tất cả module" : "All modules" }, ...modules.map((module) => ({ value: module, label: module }))];
  }, [rows, t]);

  const openDetail = async (permission) => {
    try {
      const res = await AdminAccessControlApi.getPermission(permission.id);
      setDetail(res?.data || permission);
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const columns = useMemo(() => [
    { key: "permission_code", label: t("common.confirm") === "Xác nhận" ? "Mã quyền" : "Permission code", render: (row) => <span className="font-mono text-xs font-bold text-indigo-700">{row.permission_code}</span> },
    { key: "permission_name", label: t("admin.fields.permissions", { defaultValue: "Permission name" }) === "Quyền hạn" ? "Tên quyền" : "Permission name" },
    { key: "module", label: "Module", render: (row) => <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">{row.module}</span> },
    { key: "description", label: t("admin.fields.description"), render: (row) => row.description || "—" },
    { key: "actions", label: "", render: (row) => <button type="button" onClick={() => openDetail(row)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 cursor-pointer" title={t("admin.actions.detail")}><Eye size={16} /></button> },
  ], [t]);

  return (
    <>
      <FilterBar>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("common.confirm") === "Xác nhận" ? "Mã/Tên quyền..." : "Code/Name..."} />
        <FilterSelect label="Module" value={query.module} onChange={(module) => setQuery((prev) => ({ ...prev, page: 1, module }))} options={moduleOptions} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText={t("common.noData")} />
      <FormModal
        open={!!detail}
        title={t("common.confirm") === "Xác nhận" ? "Chi tiết quyền hạn" : "Permission details"}
        onClose={() => setDetail(null)}
        onSubmit={(e) => { e.preventDefault(); setDetail(null); }}
        submitLabel={t("admin.actions.close")}
      >
        {detail ? (
          <dl className="grid grid-cols-1 gap-3 text-sm">
            {Object.entries({
              Code: detail.permission_code,
              Name: detail.permission_name,
              Module: detail.module,
              [t("admin.fields.description")]: detail.description || "—",
            }).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-gray-50 p-3">
                <dt className="text-xs font-bold uppercase text-gray-400">{label}</dt>
                <dd className="mt-1 break-words font-medium text-gray-800">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </FormModal>
    </>
  );
}
