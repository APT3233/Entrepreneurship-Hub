import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, KeyRound, Save, Trash2 } from "lucide-react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import AdminLecturerApi from "@/api/adminLecturer";
import { useToast } from "@/components/ui/Toast";
import { selectAuthUser } from "@/store/slices/authSlice";
import { checkPermission } from "@/utils/permissions";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { Field, inputClass } from "@/pages/admin/components/FormModal";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import Dropdown from "@/components/ui/filter/DropDown";
import { LecturerHeader, LecturerOverviewCards, RoleBadge } from "./components";
import { formatDate } from "@/utils/dateTimeDisplay";
import { useTranslation } from "@/context/TranslationContext";

const tabs = [
  { key: "overview", path: "" },
  { key: "profile", path: "profile" },
  { key: "classes", path: "classes" },
  { key: "grading", path: "grading" },
  { key: "created-content", path: "created-content" },
  { key: "activity", path: "activity" },
  { key: "permissions", path: "permissions" },
  { key: "password", path: "password" },
];

const activeTabFromPath = (pathname) => {
  const match = tabs.find((tab) => tab.path && pathname.endsWith(`/${tab.path}`));
  return match?.key || "overview";
};

function SmallTable({ title, columns, rows, emptyText }) {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-black text-slate-900">{title}</h3>
      <AdminTable columns={columns} rows={rows || []} emptyText={emptyText} />
    </div>
  );
}

export default function LecturerDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const authUser = useSelector(selectAuthUser);
  const canUpdate = checkPermission(authUser, "core.lecturer.update");
  const canDelete = checkPermission(authUser, "core.lecturer.delete");
  const activeTab = activeTabFromPath(location.pathname);

  const getTabLabel = (key) => {
    switch (key) {
      case "overview": return t("common.overview");
      case "profile": return t("profile.title");
      case "classes": return t("nav.classes");
      case "grading": return t("lecturer.grading");
      case "created-content": return t("admin.createdContent");
      case "activity": return t("nav.auditLogs");
      case "permissions": return t("nav.permissions");
      case "password": return t("profile.changePassword");
      default: return "";
    }
  };

  const [lecturer, setLecturer] = useState(null);
  const [tabData, setTabData] = useState(null);
  const [classesMeta, setClassesMeta] = useState(null);
  const [activityMeta, setActivityMeta] = useState(null);
  const [classQuery, setClassQuery] = useState({ page: 1, limit: 10, semester_id: "", subject_id: "", status: "" });
  const [activityQuery, setActivityQuery] = useState({ page: 1, limit: 10, action: "", table_name: "", status_code: "" });
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileForm, setProfileForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({ new_password: "", confirm_password: "", force_logout: true });
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadLecturer = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await AdminLecturerApi.getLecturer(id);
      setLecturer(res?.data || null);
    } catch (err) {
      setError(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  const loadTab = useCallback(async () => {
    setTabLoading(true);
    try {
      if (activeTab === "overview") {
        const res = await AdminLecturerApi.getOverview(id);
        setTabData(res?.data || {});
      } else if (activeTab === "profile") {
        const res = await AdminLecturerApi.getProfile(id);
        const data = res?.data || {};
        setProfileForm({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || "",
          status: data.status || "active",
          display_name: data.display_name || "",
          bio: data.bio || "",
          department: data.department || "",
          academic_title: data.academic_title || "",
          specialization: data.specialization || "",
          office_location: data.office_location || "",
          contact_note: data.contact_note || "",
          timezone: data.timezone || "",
          locale: data.locale || "",
        });
        setTabData(data);
      } else if (activeTab === "classes") {
        const res = await AdminLecturerApi.getClasses(id, classQuery);
        setTabData(res?.data || []);
        setClassesMeta(res?.meta || null);
      } else if (activeTab === "grading") {
        const res = await AdminLecturerApi.getGrading(id);
        setTabData(res?.data || {});
      } else if (activeTab === "created-content") {
        const res = await AdminLecturerApi.getCreatedContent(id);
        setTabData(res?.data || {});
      } else if (activeTab === "activity") {
        const res = await AdminLecturerApi.getActivity(id, activityQuery);
        setTabData(res?.data || {});
        setActivityMeta(res?.meta || null);
      } else if (activeTab === "permissions") {
        const res = await AdminLecturerApi.getPermissions(id);
        setTabData(res?.data || {});
      } else if (activeTab === "password") {
        setPasswordForm({ new_password: "", confirm_password: "", force_logout: true });
        setTabData({});
      }
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
      setTabData(null);
    } finally {
      setTabLoading(false);
    }
  }, [activeTab, activityQuery, classQuery, id, toast, t]);

  useEffect(() => {
    loadLecturer();
  }, [loadLecturer]);

  useEffect(() => {
    loadTab();
  }, [loadTab]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await AdminLecturerApi.updateProfile(id, profileForm);
      setLecturer(res?.data || lecturer);
      toast.success(t("admin.toasts.updateLecturerSuccess"));
      await loadTab();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password.length < 8) {
      toast.error(t("common.confirm") === "Xác nhận" ? "Mật khẩu mới phải có tối thiểu 8 ký tự" : "New password must be at least 8 characters");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error(t("common.confirm") === "Xác nhận" ? "Mật khẩu xác nhận không khớp" : "Password confirmation does not match");
      return;
    }
    setSaving(true);
    try {
      const res = await AdminLecturerApi.updatePassword(id, passwordForm);
      setLecturer(res?.data || lecturer);
      setPasswordForm({ new_password: "", confirm_password: "", force_logout: true });
      toast.success(t("common.confirm") === "Xác nhận" ? "Đã đổi mật khẩu giảng viên" : "Lecturer password updated");
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const deleteLecturer = async () => {
    try {
      await AdminLecturerApi.deleteLecturer(id);
      toast.success(t("admin.toasts.deleteLecturerSuccess"));
      setDeleteOpen(false);
      navigate("/admin/lecturers", { replace: true });
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const recentClassColumns = useMemo(() => [
    { key: "class_code", label: t("filterLabels.class"), render: (row) => <span className="font-bold text-slate-900">{row.class_code}</span> },
    { key: "subject_code", label: t("admin.fields.subjectCode") },
    { key: "semester_code", label: t("admin.fields.semester") },
    { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "enrolled_count", label: t("admin.fields.enrolledCount") },
    { key: "group_count", label: t("admin.fields.groupCount") },
  ], [t]);

  const gradingColumns = useMemo(() => [
    { key: "target_type", label: t("filterLabels.type"), render: (row) => <StatusBadge value={row.target_type} /> },
    { key: "target_title", label: t("admin.fields.title"), render: (row) => <span className="font-semibold text-slate-900">{row.target_title}</span> },
    { key: "class_code", label: t("filterLabels.class") },
    { key: "total_submissions", label: t("admin.fields.groupCount") },
    { key: "pending_grading", label: t("admin.fields.pendingGradingCount") },
    { key: "draft_evaluations", label: t("status.draft") },
    { key: "graded_count", label: t("admin.fields.gradedSubmissionsCount") },
    { key: "completion_rate", label: t("status.completed"), render: (row) => `${row.completion_rate || 0}%` },
    { key: "last_graded_at", label: t("admin.fields.lastGradedAt"), render: (row) => formatDate(row.last_graded_at) },
  ], [t]);

  if (loading) return <div className="rounded-card bg-surface p-8 text-center text-sm text-slate-400">{t("common.loading")}...</div>;
  if (error) return <div className="rounded-card bg-rose-50 p-8 text-center text-sm font-semibold text-rose-600">{error}</div>;
  if (!lecturer) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => navigate("/admin/lecturers")} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <ArrowLeft size={16} /> {t("common.back")}
        </button>
        {canDelete && Number(lecturer.total_classes || 0) === 0 ? (
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-surface px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} /> {t("admin.dialogs.deleteLecturer")}
          </button>
        ) : null}
      </div>

      <LecturerHeader lecturer={lecturer} />

      <div className="flex gap-2 overflow-x-auto rounded-card border border-border bg-surface p-2">
        {tabs.map((tab) => {
          const to = tab.path ? `/admin/lecturers/${id}/${tab.path}` : `/admin/lecturers/${id}`;
          return (
            <NavLink
              key={tab.key}
              to={to}
              end={tab.key === "overview"}
              className={({ isActive }) => `whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                isActive ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {getTabLabel(tab.key)}
            </NavLink>
          );
        })}
      </div>

      {tabLoading ? (
        <div className="rounded-card bg-surface p-8 text-center text-sm text-slate-400">{t("common.loading")}...</div>
      ) : null}

      {!tabLoading && activeTab === "overview" ? (
        <div className="space-y-5">
          <LecturerOverviewCards stats={tabData?.stats || {}} />
          <div className="grid gap-5 xl:grid-cols-2">
            <SmallTable title={t("profile.managedClassesSub")} columns={recentClassColumns} rows={tabData?.recent_classes} emptyText={t("admin.empty.classesAssigned")} />
            <SmallTable title={t("lecturer.grading")} columns={[
              { key: "target_type", label: t("filterLabels.type"), render: (row) => <StatusBadge value={row.target_type} /> },
              { key: "target_title", label: t("admin.fields.title") },
              { key: "class_code", label: t("filterLabels.class") },
              { key: "group_name", label: t("status.group_name") },
              { key: "score", label: t("admin.fields.score") },
              { key: "graded_at", label: t("admin.fields.gradedAt"), render: (row) => formatDate(row.graded_at) },
            ]} rows={tabData?.recent_grading} emptyText={t("common.noData")} />
          </div>
          <SmallTable title={t("nav.auditLogs")} columns={[
            { key: "action", label: t("admin.fields.action") },
            { key: "table_name", label: t("admin.fields.tableName") },
            { key: "record_id", label: "Record" },
            { key: "created_at", label: t("common.created"), render: (row) => formatDate(row.created_at) },
          ]} rows={tabData?.recent_activity} emptyText={t("admin.empty.auditLogs")} />
        </div>
      ) : null}

      {!tabLoading && activeTab === "profile" ? (
        <form onSubmit={saveProfile} className="rounded-card border border-border bg-surface p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("admin.fields.fullName")}><input className={inputClass} value={profileForm.full_name || ""} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} required /></Field>
            <Field label={t("admin.fields.email")}><input type="email" className={inputClass} value={profileForm.email || ""} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required /></Field>
            <Field label={t("admin.fields.phone")}><input className={inputClass} value={profileForm.phone || ""} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} /></Field>
            <Field label={t("admin.fields.status")}>
              <Dropdown
                label={t("admin.fields.status")}
                value={profileForm.status || "active"}
                onChange={(value) => setProfileForm({ ...profileForm, status: value })}
                options={[
                  { value: "active", label: t("status.active") },
                  { value: "inactive", label: t("status.inactive") },
                  { value: "locked", label: t("status.locked") },
                ]}
              />
            </Field>
            <Field label={t("admin.fields.department")}><input className={inputClass} value={profileForm.department || ""} onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })} /></Field>
            <Field label={t("admin.fields.academicTitle")}><input className={inputClass} value={profileForm.academic_title || ""} onChange={(e) => setProfileForm({ ...profileForm, academic_title: e.target.value })} /></Field>
            <Field label={t("admin.fields.specialization")}><input className={inputClass} value={profileForm.specialization || ""} onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })} /></Field>
            <Field label={t("admin.fields.officeLocation")}><input className={inputClass} value={profileForm.office_location || ""} onChange={(e) => setProfileForm({ ...profileForm, office_location: e.target.value })} /></Field>
          </div>
          <div className="mt-4 grid gap-4">
            <Field label={t("admin.fields.bio")}><textarea className={inputClass} rows={3} value={profileForm.bio || ""} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} /></Field>
            <Field label={t("admin.fields.contactNote")}><textarea className={inputClass} rows={3} value={profileForm.contact_note || ""} onChange={(e) => setProfileForm({ ...profileForm, contact_note: e.target.value })} /></Field>
          </div>
          {canUpdate ? (
            <div className="mt-5 flex justify-end">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                <Save size={16} /> {saving ? `${t("common.loading")}...` : t("admin.actions.save")}
              </button>
            </div>
          ) : null}
        </form>
      ) : null}

      {!tabLoading && activeTab === "classes" ? (
        <AdminTable
          columns={[
            { key: "class_code", label: t("filterLabels.class"), render: (row) => <button type="button" onClick={() => navigate(`/admin/academic/classes/${row.id}`)} className="font-bold text-blue-700 hover:underline">{row.class_code}</button> },
            { key: "subject_code", label: t("admin.fields.subjectCode") },
            { key: "semester_code", label: t("admin.fields.semester") },
            { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
            { key: "enrolled_count", label: t("admin.fields.enrolledCount") },
            { key: "group_count", label: t("admin.fields.groupCount") },
            { key: "checkpoint_count", label: t("nav.checkpoints") },
            { key: "assignment_count", label: t("nav.assignments") },
            { key: "pending_grading_count", label: t("admin.fields.pendingGradingCount") },
            { key: "created_at", label: t("common.created"), render: (row) => formatDate(row.created_at) },
          ]}
          rows={tabData || []}
          meta={classesMeta}
          emptyText={t("admin.empty.classesAssigned")}
          onPageChange={(page, limit) => setClassQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))}
        />
      ) : null}

      {!tabLoading && activeTab === "grading" ? (
        <div className="space-y-5">
          <SmallTable title={t("nav.gradingProgress")} columns={gradingColumns} rows={tabData?.progress} emptyText={t("common.noData")} />
          <SmallTable title={t("nav.evaluationSessions")} columns={[
            { key: "group_name", label: t("status.group_name") },
            { key: "rubric_name", label: t("nav.rubrics") },
            { key: "total_score", label: t("admin.fields.score") },
            { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
            { key: "evaluated_at", label: t("admin.fields.gradedAt"), render: (row) => formatDate(row.evaluated_at) },
            { key: "updated_at", label: t("common.updated"), render: (row) => formatDate(row.updated_at) },
          ]} rows={tabData?.sessions} emptyText={t("common.noData")} />
        </div>
      ) : null}

      {!tabLoading && activeTab === "created-content" ? (
        <div className="space-y-5">
          <SmallTable title={t("nav.checkpoints")} columns={[
            { key: "title", label: t("admin.fields.title") },
            { key: "class_code", label: t("filterLabels.class") },
            { key: "deadline", label: t("filterLabels.deadline"), render: (row) => formatDate(row.deadline) },
            { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
            { key: "max_score", label: t("admin.fields.score") },
            { key: "created_at", label: t("common.created"), render: (row) => formatDate(row.created_at) },
            { key: "actions", label: "", render: (row) => <button type="button" onClick={() => navigate(`/admin/checkpoints/${row.id}`)} className="text-blue-700"><ExternalLink size={15} /></button> },
          ]} rows={tabData?.checkpoints} emptyText={t("common.noData")} />
          <SmallTable title={t("nav.assignments")} columns={[
            { key: "title", label: t("admin.fields.title") },
            { key: "class_code", label: t("filterLabels.class") },
            { key: "deadline", label: t("filterLabels.deadline"), render: (row) => formatDate(row.deadline) },
            { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
            { key: "max_score", label: t("admin.fields.score") },
            { key: "created_at", label: t("common.created"), render: (row) => formatDate(row.created_at) },
            { key: "actions", label: "", render: (row) => <button type="button" onClick={() => navigate(`/admin/assignments/${row.id}`)} className="text-blue-700"><ExternalLink size={15} /></button> },
          ]} rows={tabData?.assignments} emptyText={t("common.noData")} />
          <SmallTable title={t("nav.rubrics")} columns={[
            { key: "name", label: t("nav.rubrics") },
            { key: "subject_code", label: t("admin.fields.subjectCode") },
            { key: "version", label: "Version" },
            { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
            { key: "total_score", label: t("admin.fields.score") },
            { key: "created_at", label: t("common.created"), render: (row) => formatDate(row.created_at) },
            { key: "actions", label: "", render: (row) => <button type="button" onClick={() => navigate(`/admin/evaluation/rubrics/${row.id}`)} className="text-blue-700"><ExternalLink size={15} /></button> },
          ]} rows={tabData?.rubrics} emptyText={t("common.noData")} />
        </div>
      ) : null}

      {!tabLoading && activeTab === "activity" ? (
        <div className="space-y-5">
          <AdminTable
            columns={[
              { key: "action", label: t("admin.fields.action") },
              { key: "table_name", label: t("admin.fields.tableName") },
              { key: "record_id", label: "Record" },
              { key: "ip_address", label: "IP" },
              { key: "created_at", label: t("common.created"), render: (row) => formatDate(row.created_at) },
            ]}
            rows={tabData?.audit_logs || []}
            meta={activityMeta}
            emptyText={t("admin.empty.auditLogs")}
            onPageChange={(page, limit) => setActivityQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))}
          />
          <SmallTable title={t("nav.apiAccessLogs")} columns={[
            { key: "method", label: t("filterLabels.method") },
            { key: "path", label: t("admin.fields.path") },
            { key: "status_code", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status_code} /> },
            { key: "response_time", label: t("admin.fields.responseTime"), render: (row) => `${row.response_time || 0}ms` },
            { key: "timestamp", label: t("admin.fields.timestamp"), render: (row) => formatDate(row.timestamp) },
          ]} rows={tabData?.api_access_logs} emptyText={t("admin.empty.apiAccessLogs")} />
        </div>
      ) : null}

      {!tabLoading && activeTab === "permissions" ? (
        <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <div className="rounded-card border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-black text-slate-900">{t("admin.fields.roles")}</h3>
            <div className="space-y-2">
              {(tabData?.roles || []).map((role) => (
                <div key={role.id} className="rounded-xl border border-border p-3">
                  <RoleBadge role={role.role_code} />
                  <p className="mt-2 text-sm font-bold text-slate-900">{role.role_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{role.description || "—"}</p>
                </div>
              ))}
            </div>
          </div>
          <AdminTable
            columns={[
              { key: "module", label: t("filterLabels.module") },
              { key: "permission_code", label: t("admin.fields.roleCode"), render: (row) => <span className="font-mono text-xs font-bold text-slate-800">{row.permission_code}</span> },
              { key: "permission_name", label: t("admin.fields.roleName") },
              { key: "description", label: t("admin.fields.description"), render: (row) => row.description || "—" },
            ]}
            rows={tabData?.permissions || []}
            emptyText={t("common.noData")}
          />
        </div>
      ) : null}

      {!tabLoading && activeTab === "password" ? (
        <form onSubmit={savePassword} className="rounded-card border border-border bg-surface p-5">
          <div className="mb-5 flex items-start gap-3 rounded-card border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface text-amber-700">
              <KeyRound size={17} />
            </span>
            <div>
              <p className="font-bold">
                {t("common.confirm") === "Xác nhận" ? "Đặt mật khẩu mới cho giảng viên" : "Set a new lecturer password"}
              </p>
              <p className="mt-1 leading-relaxed">
                {t("common.confirm") === "Xác nhận"
                  ? "Mật khẩu hiện tại sẽ không hiển thị. Sau khi đổi, hệ thống sẽ chuyển tài khoản sang đăng nhập local và có thể đăng xuất các phiên đang hoạt động."
                  : "The current password is never shown. After updating, the account will use local login and active sessions can be revoked."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("common.confirm") === "Xác nhận" ? "Mật khẩu mới" : "New password"}>
              <input
                type="password"
                autoComplete="new-password"
                className={inputClass}
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                required
                minLength={8}
              />
            </Field>
            <Field label={t("common.confirm") === "Xác nhận" ? "Xác nhận mật khẩu" : "Confirm password"}>
              <input
                type="password"
                autoComplete="new-password"
                className={inputClass}
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                required
                minLength={8}
              />
            </Field>
          </div>

          <label className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-slate-50 p-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={passwordForm.force_logout}
              onChange={(e) => setPasswordForm({ ...passwordForm, force_logout: e.target.checked })}
            />
            <span>
              {t("common.confirm") === "Xác nhận"
                ? "Đăng xuất các phiên hiện tại của giảng viên sau khi đổi mật khẩu"
                : "Sign out current lecturer sessions after password update"}
            </span>
          </label>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={!canUpdate || saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={16} /> {saving ? `${t("common.loading")}...` : t("profile.changePassword")}
            </button>
          </div>
        </form>
      ) : null}

      <ConfirmDialog
        isOpen={deleteOpen}
        title={t("admin.dialogs.deleteLecturer")}
        subtitle={t("admin.dialogs.deleteLecturerSubtitle", { email: lecturer?.email || "" })}
        variant="delete"
        color="red"
        yesLabel={t("admin.actions.confirm")}
        onYes={deleteLecturer}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
