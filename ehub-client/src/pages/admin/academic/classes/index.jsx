import { useEffect, useMemo, useState } from "react";
import { Archive, Eye, Plus, SquarePen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { academicLookupService, classService } from "@/api/adminAcademic";
import { useToast } from "@/components/ui/Toast";
import { selectAuthUser } from "@/store/slices/authSlice";
import { checkPermission } from "@/utils/permissions";
import { useClasses } from "@/hooks/admin/useClasses";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import { useTranslation } from "@/context/TranslationContext";
import {
  formatDate,
  getClassStatusOptions,
  pageLimit,
} from "@/pages/admin/academic/shared";

const emptyForm = {
  subject_id: "",
  semester_id: "",
  class_code: "",
  class_name: "",
  lecturer_id: "",
  max_students: 40,
  min_group_members: 4,
  max_group_members: 6,
  status: "draft",
};

export default function AdminClasses() {
  const { t, language } = useTranslation();
  const classStatusOptions = useMemo(() => getClassStatusOptions(t), [t]);
  const toast = useToast();
  const navigate = useNavigate();
  const authUser = useSelector(selectAuthUser);
  const canCreate = checkPermission(authUser, "core.class.create");
  const canUpdate = checkPermission(authUser, "core.class.update");
  const canDelete = checkPermission(authUser, "core.class.delete");
  const [query, setQuery] = useState({
    page: 1,
    limit: pageLimit,
    search: "",
    subject_id: "",
    semester_id: "",
    lecturer_id: "",
    status: "",
  });
  const { rows, meta, loading, error, refetch } = useClasses(query);
  const [lookups, setLookups] = useState({ subjects: [], semesters: [], lecturers: [] });
  const [modal, setModal] = useState({ type: null, cls: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmClass, setConfirmClass] = useState(null);

  const loadLookups = async () => {
    try {
      const res = await academicLookupService.getAll();
      setLookups(res?.data || { subjects: [], semesters: [], lecturers: [] });
    } catch {
      setLookups({ subjects: [], semesters: [], lecturers: [] });
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  const subjectOptions = useMemo(() => [
    { value: "", label: t("common.confirm") === "Xác nhận" ? "Tất cả học phần" : "All subjects" },
    ...(lookups.subjects || []).map((subject) => ({
      value: String(subject.id),
      label: `${subject.subject_code} - ${subject.subject_name}`,
    })),
  ], [lookups.subjects, t]);

  const semesterOptions = useMemo(() => [
    { value: "", label: t("common.confirm") === "Xác nhận" ? "Tất cả học kỳ" : "All semesters" },
    ...(lookups.semesters || []).map((semester) => ({
      value: String(semester.id),
      label: `${semester.semester_code} - ${semester.semester_name}`,
    })),
  ], [lookups.semesters, t]);

  const lecturerOptions = useMemo(() => [
    { value: "", label: t("common.confirm") === "Xác nhận" ? "Tất cả giảng viên" : "All lecturers" },
    ...(lookups.lecturers || []).map((lecturer) => ({
      value: String(lecturer.id),
      label: lecturer.full_name || lecturer.email,
    })),
  ], [lookups.lecturers, t]);

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ type: "create", cls: null });
  };

  const openEdit = (cls) => {
    setForm({
      subject_id: String(cls.subject_id || ""),
      semester_id: String(cls.semester_id || ""),
      class_code: cls.class_code || "",
      class_name: cls.class_name || "",
      lecturer_id: cls.lecturer_id ? String(cls.lecturer_id) : "",
      max_students: Number(cls.max_students || 40),
      min_group_members: Number(cls.min_group_members || 4),
      max_group_members: Number(cls.max_group_members || 6),
      status: cls.status || "draft",
    });
    setModal({ type: "edit", cls });
  };

  const validateForm = () => {
    const isVi = t("common.confirm") === "Xác nhận";
    if (!form.subject_id || !form.semester_id || !form.class_code.trim()) {
      return isVi ? "Vui lòng nhập đủ mã lớp, học phần và học kỳ." : "Please enter class code, subject and semester.";
    }
    if (Number(form.max_students) <= 0) {
      return isVi ? "max_students phải lớn hơn 0." : "max_students must be greater than 0.";
    }
    if (Number(form.min_group_members) > Number(form.max_group_members)) {
      return isVi ? "min_group_members phải nhỏ hơn hoặc bằng max_group_members." : "min_group_members must be less than or equal to max_group_members.";
    }
    return "";
  };

  const save = async (e) => {
    e.preventDefault();
    const validation = validateForm();
    if (validation) {
      toast.error(validation);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        subject_id: Number(form.subject_id),
        semester_id: Number(form.semester_id),
        class_code: form.class_code.toUpperCase(),
        lecturer_id: form.lecturer_id ? Number(form.lecturer_id) : null,
        max_students: Number(form.max_students),
        min_group_members: Number(form.min_group_members),
        max_group_members: Number(form.max_group_members),
      };
      if (modal.type === "create") {
        await classService.create(payload);
        toast.success(t("admin.toasts.createSuccess"));
      } else {
        await classService.update(modal.cls.id, payload);
        toast.success(t("admin.toasts.updateSuccess"));
      }
      setModal({ type: null, cls: null });
      await refetch();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const archiveClass = async () => {
    if (!confirmClass) return;
    try {
      await classService.updateStatus(confirmClass.id, "archived");
      toast.success(t("common.confirm") === "Xác nhận" ? "Đã archive lớp" : "Archived class successfully");
      setConfirmClass(null);
      await refetch();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const columns = useMemo(() => [
    { key: "class_code", label: t("admin.fields.classCode"), render: (row) => <span className="font-mono text-xs font-bold text-indigo-700">{row.class_code}</span> },
    { key: "subject", label: t("nav.subjects"), render: (row) => <span className="font-semibold text-gray-900">{row.subject_code} - {row.subject_name}</span> },
    { key: "semester", label: t("admin.fields.semester"), render: (row) => `${row.semester_code} (${row.year})` },
    { key: "lecturer", label: t("admin.fields.lecturer"), render: (row) => row.lecturer_name || "—" },
    { key: "max_students", label: t("admin.fields.maxStudents"), render: (row) => Number(row.max_students || 0) },
    { key: "group_rule", label: t("common.confirm") === "Xác nhận" ? "Rule số thành viên" : "Group size limits", render: (row) => `${row.min_group_members}-${row.max_group_members}` },
    { key: "enrolled_count", label: t("admin.fields.enrolledCount"), render: (row) => Number(row.enrolled_count || 0) },
    { key: "group_count", label: t("admin.fields.groupCount"), render: (row) => Number(row.group_count || 0) },
    { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "created_at", label: t("common.created"), render: (row) => formatDate(row.created_at) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => navigate(`/admin/academic/classes/${row.id}`)} title={t("admin.actions.detail")}><Eye size={16} /></ActionButton>
          {canUpdate ? <ActionButton onClick={() => openEdit(row)} title={t("admin.actions.edit")}><SquarePen size={16} /></ActionButton> : null}
          {canDelete && row.status !== "archived" ? <ActionButton onClick={() => setConfirmClass(row)} title="Archive" tone="red"><Archive size={16} /></ActionButton> : null}
        </div>
      ),
    },
  ], [t, canUpdate, canDelete, navigate]);

  return (
    <>
      <FilterBar
        right={canCreate ? (
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer">
            <Plus size={16} /> {t("admin.actions.create")}
          </button>
        ) : null}
      >
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("common.confirm") === "Xác nhận" ? "Mã lớp, giảng viên..." : "Class code, lecturer..."} />
        <FilterSelect label={t("nav.subjects")} value={query.subject_id} onChange={(subject_id) => setQuery((prev) => ({ ...prev, page: 1, subject_id }))} options={subjectOptions} />
        <FilterSelect label={t("admin.fields.semester")} value={query.semester_id} onChange={(semester_id) => setQuery((prev) => ({ ...prev, page: 1, semester_id }))} options={semesterOptions} />
        <FilterSelect label={t("admin.fields.lecturer")} value={query.lecturer_id} onChange={(lecturer_id) => setQuery((prev) => ({ ...prev, page: 1, lecturer_id }))} options={lecturerOptions} />
        <FilterSelect label={t("admin.fields.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={classStatusOptions} />
      </FilterBar>

      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText={t("common.noData")} />

      <FormModal open={["create", "edit"].includes(modal.type)} title={modal.type === "create" ? t("admin.actions.create") + " Class" : t("admin.actions.edit") + " Class"} onClose={() => setModal({ type: null, cls: null })} onSubmit={save} saving={saving}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("admin.fields.classCode")}>
            <input className={inputClass} value={form.class_code} onChange={(e) => setForm({ ...form, class_code: e.target.value.toUpperCase() })} required />
          </Field>
          <Field label={t("admin.fields.fullName", { defaultValue: "Tên lớp" }) === "Họ và tên" ? "Tên lớp" : "Class name"}>
            <input className={inputClass} value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} />
          </Field>
          <Field label={t("nav.subjects")}>
            <select className={inputClass} value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} required>
              <option value="">{t("common.confirm") === "Xác nhận" ? "Chọn học phần" : "Select subject"}</option>
              {(lookups.subjects || []).map((subject) => <option key={subject.id} value={subject.id}>{subject.subject_code} - {subject.subject_name}</option>)}
            </select>
          </Field>
          <Field label={t("admin.fields.semester")}>
            <select className={inputClass} value={form.semester_id} onChange={(e) => setForm({ ...form, semester_id: e.target.value })} required>
              <option value="">{t("common.confirm") === "Xác nhận" ? "Chọn học kỳ" : "Select semester"}</option>
              {(lookups.semesters || []).map((semester) => <option key={semester.id} value={semester.id}>{semester.semester_code} - {semester.semester_name}</option>)}
            </select>
          </Field>
          <Field label={t("admin.fields.lecturer")}>
            <select className={inputClass} value={form.lecturer_id} onChange={(e) => setForm({ ...form, lecturer_id: e.target.value })}>
              <option value="">{t("common.confirm") === "Xác nhận" ? "Chưa gán" : "Not assigned"}</option>
              {(lookups.lecturers || []).map((lecturer) => <option key={lecturer.id} value={lecturer.id}>{lecturer.full_name || lecturer.email}</option>)}
            </select>
          </Field>
          <Field label={t("admin.fields.status")}>
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <Field label={t("admin.fields.maxStudents")}>
            <input type="number" min="1" max="200" className={inputClass} value={form.max_students} onChange={(e) => setForm({ ...form, max_students: e.target.value })} required />
          </Field>
          <Field label="Min group members">
            <input type="number" min="1" max="20" className={inputClass} value={form.min_group_members} onChange={(e) => setForm({ ...form, min_group_members: e.target.value })} required />
          </Field>
          <Field label="Max group members">
            <input type="number" min="1" max="20" className={inputClass} value={form.max_group_members} onChange={(e) => setForm({ ...form, max_group_members: e.target.value })} required />
          </Field>
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!confirmClass}
        title={t("common.confirm") === "Xác nhận" ? "Archive lớp" : "Archive class"}
        subtitle={confirmClass ? `${confirmClass.class_code} - ${confirmClass.class_name || ""}` : ""}
        variant="archive"
        color="red"
        yesLabel="Archive"
        onYes={archiveClass}
        onClose={() => setConfirmClass(null)}
      />
    </>
  );
}
