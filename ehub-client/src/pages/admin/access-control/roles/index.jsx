import { useEffect, useMemo, useState } from "react";
import { Plus, ShieldCheck, SquarePen } from "lucide-react";
import { useSelector } from "react-redux";
import AdminAccessControlApi from "@/api/adminAccessControl";
import { useToast } from "@/components/ui/Toast";
import { selectAuthUser } from "@/store/slices/authSlice";
import { checkPermission } from "@/utils/permissions";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar from "@/pages/admin/components/FilterBar";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import { useTranslation } from "@/context/TranslationContext";

const emptyRole = { role_code: "", role_name: "", description: "", permissions: [] };

export default function AdminRoles() {
  const { t } = useTranslation();
  const toast = useToast();
  const authUser = useSelector(selectAuthUser);
  const canWrite = checkPermission(authUser, "admin.roles.update");
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({ type: null, role: null });
  const [form, setForm] = useState(emptyRole);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        AdminAccessControlApi.getRoles(),
        AdminAccessControlApi.getPermissions({ page: 1, limit: 100 }),
      ]);
      setRoles(rolesRes?.data || []);
      setPermissions(permissionsRes?.data || []);
      setPage(1);
    } catch (err) {
      setError(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc, permission) => {
      const module = permission.module || "core";
      if (!acc[module]) acc[module] = [];
      acc[module].push(permission);
      return acc;
    }, {});
  }, [permissions]);

  const pagedRoles = useMemo(() => roles.slice((page - 1) * limit, page * limit), [roles, page]);
  const roleMeta = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(roles.length / limit));
    return {
      page,
      limit,
      total: roles.length,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    };
  }, [roles.length, page]);

  const openCreate = () => {
    setForm(emptyRole);
    setModal({ type: "create", role: null });
  };

  const openEdit = async (role) => {
    try {
      const res = await AdminAccessControlApi.getRole(role.id);
      const detail = res?.data || role;
      setForm({
        role_code: detail.role_code || "",
        role_name: detail.role_name || "",
        description: detail.description || "",
        permissions: detail.permissions || [],
      });
      setModal({ type: "edit", role: detail });
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const openPermissions = async (role) => {
    try {
      const res = await AdminAccessControlApi.getRole(role.id);
      const detail = res?.data || role;
      setForm({ ...emptyRole, permissions: detail.permissions || [] });
      setModal({ type: "permissions", role: detail });
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const togglePermission = (permissionCode) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionCode)
        ? prev.permissions.filter((item) => item !== permissionCode)
        : [...prev.permissions, permissionCode],
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.type === "create") {
        await AdminAccessControlApi.createRole({
          role_code: form.role_code,
          role_name: form.role_name,
          description: form.description,
        });
        toast.success(t("admin.toasts.createSuccess"));
      } else if (modal.type === "edit") {
        const payload = {
          role_name: form.role_name,
          description: form.description,
        };
        if (!modal.role?.is_system) payload.role_code = form.role_code;
        await AdminAccessControlApi.updateRole(modal.role.id, payload);
        toast.success(t("admin.toasts.updateSuccess"));
      } else if (modal.type === "permissions") {
        await AdminAccessControlApi.assignRolePermissions(modal.role.id, form.permissions);
        toast.success(t("admin.toasts.updateSuccess"));
      }
      setModal({ type: null, role: null });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => [
    { key: "role_code", label: t("admin.fields.roleCode"), render: (row) => <span className="font-mono text-xs font-bold text-accent">{row.role_code}</span> },
    { key: "role_name", label: t("admin.fields.roleName") },
    { key: "description", label: t("admin.fields.description"), render: (row) => row.description || "—" },
    {
      key: "is_system",
      label: t("admin.fields.systemRole"),
      render: (row) => (row.is_system ? t("filters.yes") : t("filters.no")),
    },
    { key: "total_users", label: t("admin.rolesPage.usersCount"), render: (row) => Number(row.total_users || 0) },
    { key: "total_permissions", label: t("admin.fields.permissions"), render: (row) => Number(row.total_permissions || 0) },
    {
      key: "actions",
      label: "",
      render: (row) => canWrite ? (
        <div className="flex justify-end gap-1">
          <button type="button" onClick={() => openEdit(row)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 cursor-pointer" title={t("admin.actions.edit")}><SquarePen size={16} /></button>
          <button type="button" onClick={() => openPermissions(row)} className="rounded-lg p-2 text-accent hover:bg-accent-bg cursor-pointer" title={t("admin.actions.assignRoles")}><ShieldCheck size={16} /></button>
        </div>
      ) : null,
    },
  ], [t, canWrite]);

  return (
    <>
      <FilterBar
        right={canWrite ? (
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover cursor-pointer">
            <Plus size={16} /> {t("admin.actions.create")}
          </button>
        ) : null}
      >
        <p className="text-sm text-gray-500">
          {t("admin.rolesPage.description")}
        </p>
      </FilterBar>

      <AdminTable columns={columns} rows={pagedRoles} loading={loading} error={error} emptyText={t("common.noData")} meta={roleMeta} onPageChange={setPage} />

      <FormModal
        open={["create", "edit", "permissions"].includes(modal.type)}
        title={modal.type === "permissions" ? t("admin.actions.assignRoles") : modal.type === "create" ? t("admin.actions.create") + " Role" : t("admin.actions.edit") + " Role"}
        onClose={() => setModal({ type: null, role: null })}
        onSubmit={save}
        saving={saving}
      >
        {modal.type === "permissions" ? (
          <div className="space-y-5">
            {Object.entries(groupedPermissions).map(([module, items]) => (
              <div key={module}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{module}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {items.map((permission) => (
                    <label key={permission.id} className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer">
                      <input className="mt-1" type="checkbox" checked={form.permissions.includes(permission.permission_code)} onChange={() => togglePermission(permission.permission_code)} />
                      <span>
                        <span className="block text-sm font-semibold text-gray-800">{permission.permission_name}</span>
                        <span className="block font-mono text-xs text-gray-400">{permission.permission_code}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <Field label={t("admin.fields.roleCode")}>
              <input className={inputClass} value={form.role_code} onChange={(e) => setForm({ ...form, role_code: e.target.value })} disabled={Boolean(modal.role?.is_system)} required />
            </Field>
            <Field label={t("admin.fields.roleName")}>
              <input className={inputClass} value={form.role_name} onChange={(e) => setForm({ ...form, role_name: e.target.value })} required />
            </Field>
            <Field label={t("admin.fields.description")}>
              <textarea className={`${inputClass} min-h-24`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
        )}
      </FormModal>
    </>
  );
}
