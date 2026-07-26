import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Eye, GraduationCap, Lock, Plus, RotateCcw, SquarePen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import AdminLecturerApi from "@/api/adminLecturer";
import { useToast } from "@/components/ui/Toast";
import { selectAuthUser } from "@/store/slices/authSlice";
import { checkPermission } from "@/utils/permissions";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal, { Field } from "@/pages/admin/components/FormModal";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import Dropdown from "@/components/ui/filter/DropDown";
import { CountBadge, LecturerAvatar, LecturerForm } from "./components";
import { formatDate } from "@/utils/dateTimeDisplay";
import { useTranslation } from "@/context/TranslationContext";

const emptyForm = {
  full_name: "",
  email: "",
  username: "",
  phone: "",
  avatar_url: "",
  password: "",
  status: "active",
  profile: {},
};

const toOptions = (t, items, getLabel) => [
  { value: "", label: t("filters.all") },
  ...(items || []).map((item) => ({ value: String(item.id), label: getLabel(item) })),
];

export default function AdminLecturers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const authUser = useSelector(selectAuthUser);
  const canCreate = checkPermission(authUser, "core.lecturer.create");
  const canUpdate = checkPermission(authUser, "core.lecturer.update");
  const canAssign = checkPermission(authUser, "core.lecturer.assign_class");
  const canExport = checkPermission(authUser, "core.lecturer.export");

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [lookups, setLookups] = useState({ subjects: [], semesters: [], classes: [] });
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: "",
    status: "",
    semester_id: "",
    subject_id: "",
    has_active_class: "",
    has_pending_grading: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({ type: null, lecturer: null });
  const [form, setForm] = useState(emptyForm);
  const [assignForm, setAssignForm] = useState({ class_id: "", force: false });
  const [saving, setSaving] = useState(false);
  const [confirmLecturer, setConfirmLecturer] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [lecturersRes, lookupsRes] = await Promise.all([
        AdminLecturerApi.getLecturers(query),
        AdminLecturerApi.getLookups(),
      ]);
      setRows(lecturersRes?.data || []);
      setMeta(lecturersRes?.meta || null);
      setLookups(lookupsRes?.data || { subjects: [], semesters: [], classes: [] });
    } catch (err) {
      setError(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => {
    load();
  }, [load]);

  const subjectOptions = useMemo(
    () => toOptions(t, lookups.subjects, (item) => `${item.subject_code} - ${item.subject_name}`),
    [lookups.subjects, t],
  );
  const semesterOptions = useMemo(
    () => toOptions(t, lookups.semesters, (item) => `${item.semester_code} - ${item.semester_name}`),
    [lookups.semesters, t],
  );
  const classOptions = useMemo(
    () => (lookups.classes || []).map((item) => ({
      value: String(item.id),
      label: `${item.class_code} · ${item.subject_code} · ${item.semester_code}${item.lecturer_id ? " · đã có GV" : ""}`,
    })),
    [lookups.classes],
  );

  const openEdit = (lecturer) => {
    setForm({
      full_name: lecturer.full_name || "",
      email: lecturer.email || "",
      username: lecturer.username || "",
      phone: lecturer.phone || "",
      avatar_url: lecturer.avatar_url || "",
      status: lecturer.status || "active",
      profile: {
        display_name: lecturer.display_name || "",
        department: lecturer.department || "",
        academic_title: lecturer.academic_title || "",
        specialization: lecturer.specialization || "",
      },
    });
    setModal({ type: "edit", lecturer });
  };

  const openAssign = (lecturer) => {
    setAssignForm({ class_id: "", force: false });
    setModal({ type: "assign", lecturer });
  };

  const saveLecturer = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.type === "edit") {
        const { password: _password, profile: _profile, ...payload } = form;
        await AdminLecturerApi.updateLecturer(modal.lecturer.id, payload);
        toast.success(t("admin.toasts.updateLecturerSuccess"));
      }
      setModal({ type: null, lecturer: null });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const saveAssign = async (e) => {
    e.preventDefault();
    if (!assignForm.class_id) {
      toast.error(t("admin.fields.selectClass"));
      return;
    }
    setSaving(true);
    try {
      await AdminLecturerApi.assignClass(modal.lecturer.id, {
        class_id: Number(assignForm.class_id),
        force: assignForm.force,
      });
      toast.success(t("admin.toasts.assignClassSuccess"));
      setModal({ type: null, lecturer: null });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const toggleLock = async () => {
    if (!confirmLecturer) return;
    try {
      const nextStatus = confirmLecturer.status === "locked" ? "active" : "locked";
      await AdminLecturerApi.updateLecturerStatus(confirmLecturer.id, nextStatus);
      toast.success(t("admin.toasts.updateLecturerStatusSuccess"));
      setConfirmLecturer(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const exportCsv = () => {
    const headers = ["full_name", "email", "phone", "username", "status", "total_classes", "active_classes", "pending_grading_count"];
    const csv = [
      headers.join(","),
      ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? "").replaceAll("\"", "\"\"")}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lecturers.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo(() => [
    { key: "avatar", label: t("admin.fields.avatar"), render: (row) => <LecturerAvatar lecturer={row} /> },
    {
      key: "full_name",
      label: t("admin.fields.fullName"),
      render: (row) => (
        <button type="button" onClick={() => navigate(`/admin/lecturers/${row.id}`)} className="text-left font-bold text-slate-900 hover:text-blue-700">
          {row.full_name}
        </button>
      ),
    },
    { key: "email", label: t("admin.fields.email") },
    { key: "phone", label: t("admin.fields.phone"), render: (row) => row.phone || "—" },
    { key: "username", label: t("admin.fields.username") },
    { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "total_classes", label: t("admin.fields.classesCount"), render: (row) => <CountBadge value={row.total_classes} tone="blue" /> },
    { key: "active_classes", label: t("admin.fields.activeClassesCount"), render: (row) => <CountBadge value={row.active_classes} tone="emerald" /> },
    { key: "total_groups_managed", label: t("admin.fields.groupsCount"), render: (row) => <CountBadge value={row.total_groups_managed} /> },
    { key: "pending_grading_count", label: t("admin.fields.pendingGradingCount"), render: (row) => <CountBadge value={row.pending_grading_count} tone={Number(row.pending_grading_count) ? "amber" : "slate"} /> },
    { key: "last_login_at", label: t("admin.fields.lastLogin"), render: (row) => formatDate(row.last_login_at) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/admin/lecturers/${row.id}`); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50" title={t("admin.actions.detail")}><Eye size={16} /></button>
          {canUpdate ? <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50" title={t("admin.actions.edit")}><SquarePen size={16} /></button> : null}
          {canAssign ? <button type="button" onClick={(e) => { e.stopPropagation(); openAssign(row); }} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" title={t("admin.dialogs.assignClass")}><GraduationCap size={16} /></button> : null}
          {canUpdate ? <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmLecturer(row); }} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title={row.status === "locked" ? t("admin.dialogs.unlockLecturer") : t("admin.dialogs.lockLecturer")}>{row.status === "locked" ? <RotateCcw size={16} /> : <Lock size={16} />}</button> : null}
        </div>
      ),
    },
  ], [canAssign, canUpdate, navigate, t]);

  return (
    <>
      <FilterBar
        right={(
          <div className="flex flex-wrap gap-2">
            {canExport ? (
              <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Download size={16} /> {t("common.export")}
              </button>
            ) : null}
            {canCreate ? (
              <button type="button" onClick={() => navigate("/admin/lecturers/create")} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                <Plus size={16} /> {t("nav.createLecturer")}
              </button>
            ) : null}
          </div>
        )}
      >
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={`${t("admin.fields.fullName")}, email, ${t("admin.fields.username")}, phone...`} />
        <FilterSelect label={t("admin.fields.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={[
          { value: "", label: t("filters.all") },
          { value: "active", label: t("status.active") },
          { value: "inactive", label: t("status.inactive") },
          { value: "locked", label: t("status.locked") },
        ]} />
        <FilterSelect label={t("admin.fields.semester")} value={query.semester_id} onChange={(semester_id) => setQuery((prev) => ({ ...prev, page: 1, semester_id }))} options={semesterOptions} />
        <FilterSelect label={t("admin.fields.subjectCode")} value={query.subject_id} onChange={(subject_id) => setQuery((prev) => ({ ...prev, page: 1, subject_id }))} options={subjectOptions} />
        <FilterSelect label={t("admin.fields.activeClass")} value={query.has_active_class} onChange={(has_active_class) => setQuery((prev) => ({ ...prev, page: 1, has_active_class }))} options={[
          { value: "", label: t("filters.all") },
          { value: "yes", label: t("filters.yes") },
          { value: "no", label: t("filters.no") },
        ]} />
        <FilterSelect label={t("admin.fields.pendingGrading")} value={query.has_pending_grading} onChange={(has_pending_grading) => setQuery((prev) => ({ ...prev, page: 1, has_pending_grading }))} options={[
          { value: "", label: t("filters.all") },
          { value: "yes", label: t("filters.yes") },
          { value: "no", label: t("filters.no") },
        ]} />
      </FilterBar>

      <AdminTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        emptyText={t("admin.empty.lecturers")}
        meta={meta}
        onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))}
        onRowClick={(row) => navigate(`/admin/lecturers/${row.id}`)}
      />

      <FormModal
        open={modal.type === "edit"}
        title={t("admin.dialogs.editLecturer")}
        onClose={() => setModal({ type: null, lecturer: null })}
        onSubmit={saveLecturer}
        saving={saving}
      >
        <LecturerForm form={form} setForm={setForm} mode="edit" />
      </FormModal>

      <FormModal
        open={modal.type === "assign"}
        title={`${t("admin.dialogs.assignClass")} · ${modal.lecturer?.full_name || ""}`}
        onClose={() => setModal({ type: null, lecturer: null })}
        onSubmit={saveAssign}
        saving={saving}
      >
        <div className="space-y-4">
          <Field label={t("filterLabels.class")}>
            <Dropdown
              label={t("admin.fields.selectClass")}
              value={assignForm.class_id}
              onChange={(value) => setAssignForm({ ...assignForm, class_id: value })}
              options={classOptions}
            />
          </Field>
          <label className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
            <input type="checkbox" className="mt-1" checked={assignForm.force} onChange={(e) => setAssignForm({ ...assignForm, force: e.target.checked })} />
            <span>{t("admin.dialogs.forceAssignConfirm")}</span>
          </label>
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!confirmLecturer}
        title={confirmLecturer?.status === "locked" ? t("admin.dialogs.unlockLecturer") : t("admin.dialogs.lockLecturer")}
        subtitle={confirmLecturer?.status === "locked"
          ? t("admin.dialogs.unlockLecturerSubtitle", { email: confirmLecturer?.email || "" })
          : t("admin.dialogs.lockLecturerSubtitle", { email: confirmLecturer?.email || "" })}
        variant={confirmLecturer?.status === "locked" ? "unlock" : "lock"}
        color={confirmLecturer?.status === "locked" ? "green" : "red"}
        yesLabel={t("common.confirm")}
        onYes={toggleLock}
        onClose={() => setConfirmLecturer(null)}
      />
    </>
  );
}
