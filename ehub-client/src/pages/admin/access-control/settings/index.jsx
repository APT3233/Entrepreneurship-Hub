import { useEffect, useMemo, useState } from "react";
import { SquarePen } from "lucide-react";
import { useSelector } from "react-redux";
import AdminAccessControlApi from "@/api/adminAccessControl";
import { useToast } from "@/components/ui/Toast";
import { selectAuthUser } from "@/store/slices/authSlice";
import { checkPermission } from "@/utils/permissions";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import { useTranslation } from "@/context/TranslationContext";
import { formatDate } from "@/utils/dateTimeDisplay";

function validateValue(value, dataType, isVi) {
  const raw = String(value ?? "");
  if (dataType === "integer" && !/^-?\d+$/.test(raw.trim())) {
    return isVi ? "Giá trị phải là số nguyên." : "Value must be an integer.";
  }
  if (dataType === "boolean" && !["true", "false", "1", "0"].includes(raw.trim().toLowerCase())) {
    return isVi ? "Giá trị boolean phải là true/false." : "Boolean value must be true or false.";
  }
  if (dataType === "json") {
    try {
      JSON.parse(raw);
    } catch {
      return isVi ? "Giá trị JSON không hợp lệ." : "Invalid JSON value.";
    }
  }
  return "";
}

export default function AdminSettings() {
  const { t, language } = useTranslation();
  const toast = useToast();
  const authUser = useSelector(selectAuthUser);
  const canWrite = checkPermission(authUser, "admin.settings.update");
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", module: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await AdminAccessControlApi.getSettings(query);
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

  const openEdit = (setting) => {
    setEditing(setting);
    setValue(setting.setting_value || "");
  };

  const save = async (e) => {
    e.preventDefault();
    if (!editing) return;
    const isVi = t("common.confirm") === "Xác nhận";
    const validation = validateValue(value, editing.data_type, isVi);
    if (validation) {
      toast.error(validation);
      return;
    }
    setSaving(true);
    try {
      await AdminAccessControlApi.updateSetting(editing.id, value);
      toast.success(t("admin.toasts.updateSuccess"));
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => [
    { key: "setting_key", label: t("admin.fields.key"), render: (row) => <span className="font-mono text-xs font-bold text-indigo-700">{row.setting_key}</span> },
    { key: "setting_value", label: t("admin.fields.value"), render: (row) => <span className="block max-w-sm truncate" title={row.setting_value}>{row.setting_value}</span> },
    { key: "data_type", label: t("common.confirm") === "Xác nhận" ? "Kiểu" : "Type" },
    { key: "module", label: "Module", render: (row) => <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">{row.module}</span> },
    { key: "description", label: t("admin.fields.description"), render: (row) => row.description || "—" },
    { key: "updated_at", label: t("common.updated"), render: (row) => formatDate(row.updated_at) },
    { key: "actions", label: "", render: (row) => canWrite ? <button type="button" onClick={() => openEdit(row)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 cursor-pointer" title={t("admin.actions.edit")}><SquarePen size={16} /></button> : null },
  ], [t, canWrite]);

  return (
    <>
      <FilterBar>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("common.confirm") === "Xác nhận" ? "Key hoặc mô tả cấu hình..." : "Key or description..."} />
        <FilterSelect label="Module" value={query.module} onChange={(module) => setQuery((prev) => ({ ...prev, page: 1, module }))} options={moduleOptions} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText={t("common.noData")} />
      <FormModal open={!!editing} title={t("common.confirm") === "Xác nhận" ? "Chỉnh sửa cấu hình" : "Edit setting"} onClose={() => setEditing(null)} onSubmit={save} saving={saving}>
        {editing ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 p-3 text-sm">
              <p className="font-mono font-bold text-gray-900">{editing.setting_key}</p>
              <p className="mt-1 text-gray-500">{editing.description || (t("common.confirm") === "Xác nhận" ? "Không có mô tả." : "No description.")}</p>
              <p className="mt-2 text-xs font-bold uppercase text-gray-400">Data type: {editing.data_type}</p>
            </div>
            <Field label={t("admin.fields.value")}>
              <textarea className={`${inputClass} min-h-32 font-mono`} value={value} onChange={(e) => setValue(e.target.value)} />
            </Field>
          </div>
        ) : null}
      </FormModal>
    </>
  );
}
