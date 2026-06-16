import { useEffect, useMemo, useState, useCallback } from "react";
import { Archive, Eye, Plus, SquarePen, Info, BookOpen, Users } from "lucide-react";
import Dropdown from "@/components/ui/filter/DropDown";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { academicLookupService, classService } from "@/api/adminAcademic";
import { useToast } from "@/components/ui/Toast";
import { selectAuthUser } from "@/store/slices/authSlice";
import { checkPermission } from "@/utils/permissions";
import { useClasses } from "@/hooks/admin/useClasses";
import { useAdminSemesterFilter } from "@/hooks/admin/useAdminSemesterFilter";
import { useAdminUrlQuerySync } from "@/hooks/admin/useAdminUrlQuerySync";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { AdminSemesterFilterGroup, FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import { useTranslation } from "@/context/TranslationContext";
import { countActiveAdminFilters } from "@/pages/admin/shared/filterUtils";
import {
  formatDate,
  getClassStatusOptions,
  pageLimit,
} from "@/pages/admin/academic/shared";

const isSemesterCompleted = (semester) => semester?.status === "completed";

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
  const { t } = useTranslation();
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
  useAdminUrlQuerySync({
    query,
    setQuery,
    keys: ["page", "search", "subject_id", "semester_id", "lecturer_id", "status"],
  });
  const [lookups, setLookups] = useState({ subjects: [], semesters: [], lecturers: [] });

  const onSemesterChange = useCallback(({ semesterId }) => {
    setQuery((prev) => ({ ...prev, page: 1, semester_id: semesterId }));
  }, []);

  const semesterFilter = useAdminSemesterFilter(lookups.semesters, {
    onSemesterChange,
    preferredSemesterId: query.semester_id,
  });
  const { rows, meta, loading, error, refetch } = useClasses(query, { enabled: semesterFilter.ready });
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
    { value: "", label: t("lookupAll.subjects") },
    ...(lookups.subjects || []).filter(s => {
      const code = (s.subject_code || "").toUpperCase();
      return code === "EXE101" || code === "EXE201";
    }).map((subject) => ({
      value: String(subject.id),
      label: `${subject.subject_code} - ${subject.subject_name}`,
    })),
  ], [lookups.subjects, t]);

  const lecturerOptions = useMemo(() => [
    { value: "", label: t("lookupAll.lecturers") },
    ...(lookups.lecturers || []).map((lecturer) => ({
      value: String(lecturer.id),
      label: lecturer.full_name || lecturer.email,
    })),
  ], [lookups.lecturers, t]);

  const formSubjectOptions = useMemo(() => (lookups.subjects || []).filter(s => {
    const code = (s.subject_code || "").toUpperCase();
    return code === "EXE101" || code === "EXE201";
  }).map((subject) => ({
    value: String(subject.id),
    label: `${subject.subject_code} - ${subject.subject_name}`,
  })), [lookups.subjects]);

  const formSemesterOptions = useMemo(() => {
    const semesters = lookups.semesters || [];
    const list = modal.type === "create"
      ? semesters.filter((semester) => !isSemesterCompleted(semester))
      : semesters;
    return list.map((semester) => ({
      value: String(semester.id),
      label: `${semester.semester_code} - ${semester.semester_name}`,
    }));
  }, [lookups.semesters, modal.type]);

  const formLecturerOptions = useMemo(() => [
    { value: "", label: t("admin.placeholders.notAssigned") },
    ...(lookups.lecturers || []).map((lecturer) => ({
      value: String(lecturer.id),
      label: lecturer.full_name || lecturer.email,
    })),
  ], [lookups.lecturers, t]);

  const formStatusOptions = useMemo(() => ["draft", "active", "completed", "archived"].map((val) => ({
    value: val,
    label: t(`status.${val}`),
  })), [t]);

  const openCreate = () => {
    const hasOpenSemester = (lookups.semesters || []).some((semester) => !isSemesterCompleted(semester));
    if (!hasOpenSemester) {
      toast.error(t("admin.errors.semesterCompletedNoClass"));
      return;
    }
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
    if (modal.type === "create") {
      const semester = (lookups.semesters || []).find((item) => String(item.id) === String(form.semester_id));
      if (isSemesterCompleted(semester)) {
        return t("admin.errors.semesterCompletedNoClass");
      }
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

  const activeFilterCount = countActiveAdminFilters(query);

  const clearFilters = () => {
    semesterFilter.reset();
    setQuery((prev) => ({
      ...prev,
      page: 1,
      search: "",
      subject_id: "",
      lecturer_id: "",
      status: "",
    }));
  };

  return (
    <>
      <FilterBar
        search={(
          <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.placeholders.classSearch")} />
        )}
        activeFilterCount={activeFilterCount}
        onClear={clearFilters}
        right={canCreate ? (
          <button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer">
            <Plus size={16} /> {t("admin.actions.create")}
          </button>
        ) : null}
      >
        <AdminSemesterFilterGroup
          filterYear={semesterFilter.filterYear}
          semesterId={semesterFilter.semesterId}
          yearOptions={semesterFilter.yearOptions}
          semesterOptions={semesterFilter.semesterOptions}
          onYearChange={semesterFilter.onYearChange}
          onSemesterChange={semesterFilter.onSemesterIdChange}
        />
        <FilterSelect label={t("nav.subjects")} value={query.subject_id} onChange={(subject_id) => setQuery((prev) => ({ ...prev, page: 1, subject_id }))} options={subjectOptions} />
        <FilterSelect label={t("admin.fields.lecturer")} value={query.lecturer_id} onChange={(lecturer_id) => setQuery((prev) => ({ ...prev, page: 1, lecturer_id }))} options={lecturerOptions} />
        <FilterSelect label={t("admin.fields.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={classStatusOptions} />
      </FilterBar>

      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText={t("common.noData")} />

      <FormModal open={["create", "edit"].includes(modal.type)} title={modal.type === "create" ? t("admin.actions.create") + " Class" : t("admin.actions.edit") + " Class"} onClose={() => setModal({ type: null, cls: null })} onSubmit={save} saving={saving}>
        <div className="space-y-6">
          {/* Section 1: Class Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Info size={16} />
              </span>
              <h4 className="text-sm font-bold text-gray-800">
                {t("common.confirm") === "Xác nhận" ? "Thông tin lớp học" : "Class Information"}
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("admin.fields.classCode")}>
                <input className={inputClass} value={form.class_code} onChange={(e) => setForm({ ...form, class_code: e.target.value.toUpperCase() })} required />
              </Field>
              <Field label={t("admin.fields.fullName", { defaultValue: "Tên lớp" }) === "Họ và tên" ? "Tên lớp" : "Class name"}>
                <input className={inputClass} value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} />
              </Field>
              <Field label={t("admin.fields.lecturer")}>
                <Dropdown
                  label={t("common.confirm") === "Xác nhận" ? "Chọn giảng viên" : "Select lecturer"}
                  value={form.lecturer_id}
                  onChange={(value) => setForm({ ...form, lecturer_id: value })}
                  options={formLecturerOptions}
                />
              </Field>
              <Field label={t("admin.fields.status")}>
                <Dropdown
                  label="Status"
                  value={form.status}
                  onChange={(value) => setForm({ ...form, status: value })}
                  direction="up"
                  options={formStatusOptions}
                />
              </Field>
            </div>
          </div>

          {/* Section 2: Academic Context */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <BookOpen size={16} />
              </span>
              <h4 className="text-sm font-bold text-gray-800">
                {t("common.confirm") === "Xác nhận" ? "Học phần & Học kỳ" : "Academic Context"}
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("nav.subjects")}>
                <Dropdown
                  label={t("common.confirm") === "Xác nhận" ? "Chọn học phần" : "Select subject"}
                  value={form.subject_id}
                  onChange={(value) => setForm({ ...form, subject_id: value })}
                  options={formSubjectOptions}
                />
              </Field>
              <Field label={t("admin.fields.semester")}>
                <Dropdown
                  label={t("common.confirm") === "Xác nhận" ? "Chọn học kỳ" : "Select semester"}
                  value={form.semester_id}
                  onChange={(value) => setForm({ ...form, semester_id: value })}
                  options={formSemesterOptions}
                />
              </Field>
            </div>
          </div>

          {/* Section 3: Class Rules */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Users size={16} />
              </span>
              <h4 className="text-sm font-bold text-gray-800">
                {t("common.confirm") === "Xác nhận" ? "Quy mô & Luật nhóm" : "Class Rules & Capacity"}
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t("admin.fields.maxStudents")}>
                <input type="number" min="1" max="200" className={inputClass} value={form.max_students} onChange={(e) => setForm({ ...form, max_students: e.target.value })} required />
              </Field>
              <Field label={t("common.confirm") === "Xác nhận" ? "Thành viên tối thiểu" : "Min group members"}>
                <input type="number" min="1" max="20" className={inputClass} value={form.min_group_members} onChange={(e) => setForm({ ...form, min_group_members: e.target.value })} required />
              </Field>
              <Field label={t("common.confirm") === "Xác nhận" ? "Thành viên tối đa" : "Max group members"}>
                <input type="number" min="1" max="20" className={inputClass} value={form.max_group_members} onChange={(e) => setForm({ ...form, max_group_members: e.target.value })} required />
              </Field>
            </div>
          </div>
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
