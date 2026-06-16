import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Lock, Plus, RotateCcw, ShieldCheck, SquarePen, User, Settings, KeyRound, ShieldAlert, GraduationCap, CheckCircle2, Phone, MapPin, Handshake } from "lucide-react";
import { useSelector } from "react-redux";
import AdminAccessControlApi from "@/api/adminAccessControl";
import { useToast } from "@/components/ui/Toast";
import { selectAuthUser } from "@/store/slices/authSlice";
import { checkPermission } from "@/utils/permissions";
import { useAdminUrlQuerySync } from "@/hooks/admin/useAdminUrlQuerySync";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import { useTranslation } from "@/context/TranslationContext";
import { formatDate } from "@/utils/dateTimeDisplay";
import {
  applyRoleToggle,
  canAssignRoleToUser,
  getRoleAssignmentError,
  isStaffAccount,
  isStaffRoleCode,
  isStudentAccount,
} from "@/utils/roleAssignment";

import Dropdown from "@/components/ui/filter/DropDown";
import { CAMPUS_OPTIONS } from "@/pages/admin/student-group/shared";

const emptyForm = {
  username: "",
  email: "",
  password: "",
  full_name: "",
  phone: "",
  campus: "",
  avatar_url: "",
  status: "active",
  roles: [],
};

function UserAvatar({ user }) {
  if (user.avatar_url) {
    return <img src={user.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover border border-gray-100" />;
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
      {(user.full_name || user.username || "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

const getRoleBadgeStyle = (role) => {
  switch (role) {
    case "admin":
      return "bg-rose-50 text-rose-700 border border-rose-200/60";
    case "department_head":
      return "bg-purple-50 text-purple-700 border border-purple-200/60";
    case "lecturer":
      return "bg-blue-50 text-blue-700 border border-blue-200/60";
    case "student":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200/60";
    case "guest":
      return "bg-amber-50 text-amber-700 border border-amber-200/60";
    case "mentor":
      return "bg-teal-50 text-teal-700 border border-teal-200/60";
    default:
      return "bg-slate-50 text-slate-700 border border-slate-200/60";
  }
};

const getRoleLabel = (role, t) => {
  const key = `admin.userRoles.${role}`;
  const label = t(key);
  return label === key ? role : label;
};

const getRoleCardConfig = (roleCode, t) => {
  switch (roleCode) {
    case "admin":
      return {
        icon: ShieldAlert,
        colorClass: "rose",
        title: t("admin.roleCards.admin.title"),
        desc: t("admin.roleCards.admin.desc"),
        activeBorder: "border-rose-500 ring-2 ring-rose-100 bg-rose-50/10",
        iconBg: "bg-rose-50 text-rose-600",
      };
    case "lecturer":
      return {
        icon: GraduationCap,
        colorClass: "indigo",
        title: t("admin.roleCards.lecturer.title"),
        desc: t("admin.roleCards.lecturer.desc"),
        activeBorder: "border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50/10",
        iconBg: "bg-indigo-50 text-indigo-600",
      };
    case "student":
      return {
        icon: User,
        colorClass: "emerald",
        title: t("admin.roleCards.student.title"),
        desc: t("admin.roleCards.student.desc"),
        activeBorder: "border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/10",
        iconBg: "bg-emerald-50 text-emerald-600",
      };
    case "mentor":
      return {
        icon: Handshake,
        colorClass: "teal",
        title: t("admin.roleCards.mentor.title"),
        desc: t("admin.roleCards.mentor.desc"),
        activeBorder: "border-teal-500 ring-2 ring-teal-100 bg-teal-50/10",
        iconBg: "bg-teal-50 text-teal-600",
      };
    default:
      return {
        icon: User,
        colorClass: "slate",
        title: getRoleLabel(roleCode, t),
        desc: t("admin.roleCards.defaultDesc"),
        activeBorder: "border-slate-500 ring-2 ring-slate-100 bg-slate-50/10",
        iconBg: "bg-slate-50 text-slate-600",
      };
  }
};

export default function AdminUsers() {
  const { t } = useTranslation();
  const toast = useToast();
  const authUser = useSelector(selectAuthUser);
  const canWrite = checkPermission(authUser, "admin.users.update");
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", status: "", role: "" });
  useAdminUrlQuerySync({
    query,
    setQuery,
    keys: ["page", "search", "status", "role"],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({ type: null, user: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmUser, setConfirmUser] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, rolesRes] = await Promise.all([
        AdminAccessControlApi.getUsers(query),
        AdminAccessControlApi.getRoles(),
      ]);
      setRows(usersRes?.data || []);
      setMeta(usersRes?.meta || null);
      const allowedRoles = ["admin", "lecturer", "student", "mentor"];
      const filteredRoles = (rolesRes?.data || []).filter((r) => allowedRoles.includes(r.role_code));
      setRoles(filteredRoles);
    } catch (err) {
      setError(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.limit, query.search, query.status, query.role]);

  const roleOptions = useMemo(() => [
    { value: "", label: t("lookupAll.roles") },
    ...roles.map((role) => ({ value: role.role_code, label: role.role_name || role.role_code })),
  ], [roles, t]);

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ type: "create", user: null });
  };

  const openEdit = useCallback((user) => {
    setForm({
      username: user.username || "",
      email: user.email || "",
      password: "",
      full_name: user.full_name || "",
      phone: user.phone || "",
      campus: user.campus || "",
      avatar_url: user.avatar_url || "",
      status: user.status || "active",
      roles: user.roles || [],
    });
    setModal({ type: "edit", user });
  }, []);

  const openRoles = useCallback((user) => {
    setForm({ ...emptyForm, roles: user.roles || [] });
    setModal({ type: "roles", user });
  }, []);

  const openDetail = useCallback(async (user) => {
    try {
      const res = await AdminAccessControlApi.getUser(user.id);
      setModal({ type: "detail", user: res?.data || user });
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  }, [t, toast]);

  const saveUser = async (e) => {
    e.preventDefault();
    if (modal.type === "create" || modal.type === "roles") {
      const roleError = getRoleAssignmentError(
        form.roles,
        modal.type === "roles" ? modal.user : null,
        t,
      );
      if (roleError) {
        toast.error(roleError);
        return;
      }
    }
    setSaving(true);
    try {
      if (modal.type === "create") {
        const payload = { ...form, roles: form.roles };
        await AdminAccessControlApi.createUser(payload);
        toast.success(t("admin.toasts.createSuccess"));
      } else if (modal.type === "edit") {
        const { password: _password, roles: _roles, ...payload } = form;
        await AdminAccessControlApi.updateUser(modal.user.id, payload);
        toast.success(t("admin.toasts.updateSuccess"));
      } else if (modal.type === "roles") {
        await AdminAccessControlApi.assignUserRoles(modal.user.id, form.roles);
        toast.success(t("admin.toasts.updateSuccess"));
      }
      setModal({ type: null, user: null });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (roleCode) => {
    if (modal.type === "roles" && !canAssignRoleToUser(modal.user, roleCode)) return;
    setForm((prev) => ({ ...prev, roles: applyRoleToggle(prev.roles, roleCode) }));
  };

  const toggleLock = async () => {
    if (!confirmUser) return;
    try {
      const nextStatus = confirmUser.status === "locked" ? "active" : "locked";
      await AdminAccessControlApi.updateUserStatus(confirmUser.id, nextStatus);
      toast.success(t("admin.toasts.statusSuccess"));
      setConfirmUser(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const columns = useMemo(() => [
    { key: "avatar", label: t("admin.fields.avatar") || "Avatar", render: (row) => <UserAvatar user={row} /> },
    { key: "full_name", label: t("admin.fields.fullName"), render: (row) => <span className="font-semibold text-gray-900">{row.full_name}</span> },
    { key: "email", label: t("admin.fields.email") },
    { key: "username", label: t("admin.fields.username") },
    {
      key: "roles",
      label: t("admin.fields.roles"),
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.roles || []).map((role) => (
            <span
              key={role}
              className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${getRoleBadgeStyle(role)}`}
            >
              {getRoleLabel(role, t)}
            </span>
          ))}
        </div>
      ),
    },
    { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "last_login_at", label: t("admin.fields.lastLogin"), render: (row) => formatDate(row.last_login_at) },
    { key: "created_at", label: t("common.created"), render: (row) => formatDate(row.created_at) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button type="button" onClick={() => openDetail(row)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 cursor-pointer" title={t("admin.actions.detail")}><Eye size={16} /></button>
          {canWrite && <button type="button" onClick={() => openEdit(row)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 cursor-pointer" title={t("admin.actions.edit")}><SquarePen size={16} /></button>}
          {canWrite && <button type="button" onClick={() => openRoles(row)} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 cursor-pointer" title={t("admin.actions.assignRoles")}><ShieldCheck size={16} /></button>}
          {canWrite && <button type="button" onClick={() => setConfirmUser(row)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 cursor-pointer" title="Lock/unlock">{row.status === "locked" ? <RotateCcw size={16} /> : <Lock size={16} />}</button>}
        </div>
      ),
    },
  ], [t, canWrite, openDetail, openEdit, openRoles, setConfirmUser]);

  const filterStatusOptions = useMemo(() => [
    { value: "", label: t("filters.all") },
    { value: "active", label: t("status.active") },
    { value: "inactive", label: t("status.inactive") },
    { value: "locked", label: t("status.locked") },
  ], [t]);

  return (
    <>
      <FilterBar
        right={canWrite ? (
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer">
            <Plus size={16} /> {t("admin.actions.create")}
          </button>
        ) : null}
      >
        <SearchInput
          value={query.search}
          onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))}
          placeholder={t("searchPlaceholders.users")}
        />
        <FilterSelect
          label={t("admin.fields.status")}
          value={query.status}
          onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))}
          options={filterStatusOptions}
        />
        <FilterSelect label={t("admin.fields.roles")} value={query.role} onChange={(role) => setQuery((prev) => ({ ...prev, page: 1, role }))} options={roleOptions} />
      </FilterBar>

      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} />

      <FormModal
        open={["create", "edit", "roles"].includes(modal.type)}
        title={
          modal.type === "create"
            ? t("admin.dialogs.createUser")
            : modal.type === "roles"
            ? t("admin.actions.assignRoles")
            : t("admin.dialogs.editUser")
        }
        onClose={() => setModal({ type: null, user: null })}
        onSubmit={saveUser}
        saving={saving}
      >
        {modal.type === "roles" ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <ShieldCheck size={16} />
              </span>
              <div>
                <h4 className="text-sm font-bold text-gray-800">
                  {t("admin.roles.sectionTitle")}
                </h4>
                <p className="text-[11px] text-gray-400 font-medium">
                  {t("admin.roles.assignSubtitle", { name: modal.user?.full_name || "" })}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {roles.map((role) => {
                const isDisabled = !canAssignRoleToUser(modal.user, role.role_code);
                const isChecked = form.roles.includes(role.role_code);
                const config = getRoleCardConfig(role.role_code, t);
                const RoleIcon = config.icon;
                return (
                  <div
                    key={role.id}
                    onClick={() => {
                      if (!isDisabled) toggleRole(role.role_code);
                    }}
                    className={`relative flex items-start gap-4 rounded-2xl border p-5 transition-all duration-300 outline-none select-none ${
                      isDisabled 
                        ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200" 
                        : `cursor-pointer border-gray-200 hover:shadow-md ${isChecked ? `${config.activeBorder}` : "hover:border-gray-300 hover:bg-gray-50/30"}`
                    }`}
                  >
                    {isChecked && !isDisabled && (
                      <span className="absolute top-4 right-4 text-emerald-600">
                        <CheckCircle2 size={18} strokeWidth={2.5} />
                      </span>
                    )}
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform ${config.iconBg} ${isChecked ? "scale-105" : ""}`}>
                      <RoleIcon size={20} strokeWidth={2} />
                    </div>
                    <div className="flex-1 space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800 leading-none">{config.title}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{config.desc}</p>
                      {isDisabled && isStudentAccount(modal.user) && isStaffRoleCode(role.role_code) && (
                        <p className="text-[10px] text-red-500 font-bold mt-1.5 leading-snug">
                          {`⚠️ ${t("admin.errors.roleStudentCannotStaffHint")}`}
                        </p>
                      )}
                      {isDisabled && isStaffAccount(modal.user) && role.role_code === "student" && (
                        <p className="text-[10px] text-red-500 font-bold mt-1.5 leading-snug">
                          {`⚠️ ${t("admin.errors.roleStaffCannotStudentHint")}`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Section 1: Account Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <User size={16} />
                </span>
                <h4 className="text-sm font-bold text-gray-800">
                  {t("admin.sections.accountInfo")}
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t("admin.fields.fullName")}>
                  <input className={inputClass} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                </Field>
                <Field label={t("admin.fields.username")}>
                  <input className={inputClass} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                </Field>
                <Field label={t("admin.fields.email")}>
                  <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </Field>
                {modal.type === "create" ? (
                  <Field label={t("admin.fields.password")}>
                    <input type="password" className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={t("admin.placeholders.passwordMin")} required />
                  </Field>
                ) : null}
              </div>
            </div>

            {/* Section 2: Additional details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Settings size={16} />
                </span>
                <h4 className="text-sm font-bold text-gray-800">
                  {t("admin.sections.additionalDetails")}
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t("admin.fields.phone")}>
                  <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Field>
                <Field label={t("admin.fields.campus")}>
                  <Dropdown
                    label={t("admin.placeholders.selectCampus")}
                    value={form.campus}
                    onChange={(value) => setForm({ ...form, campus: value })}
                    options={CAMPUS_OPTIONS}
                  />
                </Field>
                <Field label={t("admin.fields.status")}>
                  <Dropdown
                    label="Status"
                    value={form.status}
                    onChange={(value) => setForm({ ...form, status: value })}
                    options={[
                      { value: "active", label: t("status.active") },
                      { value: "inactive", label: t("status.inactive") },
                      { value: "locked", label: t("status.locked") },
                    ]}
                  />
                </Field>
              </div>
            </div>

            {/* Section 3: Roles Selection (Create Mode Only) */}
            {modal.type === "create" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <KeyRound size={16} />
                  </span>
                  <h4 className="text-sm font-bold text-gray-800">
                    {t("admin.fields.roles")}
                  </h4>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {roles.map((role) => {
                    const isChecked = form.roles.includes(role.role_code);
                    const config = getRoleCardConfig(role.role_code, t);
                    const RoleIcon = config.icon;
                    return (
                      <div
                        key={role.id}
                        onClick={() => toggleRole(role.role_code)}
                        className={`relative flex items-start gap-4 rounded-2xl border p-5 transition-all duration-300 outline-none select-none cursor-pointer border-gray-200 hover:shadow-md ${
                          isChecked ? `${config.activeBorder}` : "hover:border-gray-300 hover:bg-gray-50/30"
                        }`}
                      >
                        {isChecked && (
                          <span className="absolute top-4 right-4 text-emerald-600">
                            <CheckCircle2 size={18} strokeWidth={2.5} />
                          </span>
                        )}
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform ${config.iconBg} ${isChecked ? "scale-105" : ""}`}>
                          <RoleIcon size={20} strokeWidth={2} />
                        </div>
                        <div className="flex-1 space-y-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-800 leading-none">{config.title}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{config.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </FormModal>

      <FormModal
        open={modal.type === "detail"}
        title={t("admin.dialogs.userDetail")}
        onClose={() => setModal({ type: null, user: null })}
        onSubmit={(e) => { e.preventDefault(); setModal({ type: null, user: null }); }}
        submitLabel={t("admin.actions.close")}
      >
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {modal.user && Object.entries({
            [t("admin.fields.fullName")]: modal.user.full_name,
            [t("admin.fields.email")]: modal.user.email,
            [t("admin.fields.username")]: modal.user.username,
            [t("admin.fields.roles")]: (modal.user.roles || []).join(", "),
            Permissions: (modal.user.permissions || []).join(", ") || "—",
            [t("admin.fields.status")]: modal.user.status,
            [t("admin.fields.campus")]: modal.user.campus || "—",
          }).map(([label, value]) => (
            <div key={label} className="rounded-xl bg-gray-50 p-3">
              <dt className="text-xs font-bold uppercase text-gray-400">{label}</dt>
              <dd className="mt-1 break-words font-medium text-gray-800">{value}</dd>
            </div>
          ))}
        </dl>
      </FormModal>

      <ConfirmDialog
        isOpen={!!confirmUser}
        title={confirmUser?.status === "locked" ? t("admin.dialogs.unlockUser") : t("admin.dialogs.lockUser")}
        subtitle={t("admin.dialogs.lockUserSubtitle", { email: confirmUser?.email || "" })}
        variant={confirmUser?.status === "locked" ? "unlock" : "lock"}
        color={confirmUser?.status === "locked" ? "green" : "red"}
        yesLabel={t("admin.actions.confirm")}
        onYes={toggleLock}
        onClose={() => setConfirmUser(null)}
      />
    </>
  );
}
