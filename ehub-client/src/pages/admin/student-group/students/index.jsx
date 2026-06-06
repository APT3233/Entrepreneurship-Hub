import { useEffect, useMemo, useState } from "react";
import { Eye, Plus, SquarePen, Trash2, User, GraduationCap, KeyRound } from "lucide-react";
import { useSelector } from "react-redux";
import { studentGroupLookupService, studentService } from "@/api/adminStudentGroup";
import { useToast } from "@/components/ui/Toast";
import { selectAuthUser } from "@/store/slices/authSlice";
import { checkPermission } from "@/utils/permissions";
import { useStudents } from "@/hooks/admin/useStudents";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import DetailGrid from "@/pages/admin/academic/components/DetailGrid";
import { useTranslation } from "@/context/TranslationContext";
import Dropdown from "@/components/ui/filter/DropDown";
import {
  buildStudentLabel,
  formatDate,
  pageLimit,
  getStudentStatusOptions,
  getShortClassCode,
  CAMPUS_OPTIONS,
  MAJOR_OPTIONS,
} from "@/pages/admin/student-group/shared";

const emptyForm = {
  user_id: "",
  student_code: "",
  full_name: "",
  email: "",
  phone: "",
  major: "",
  campus: "",
  status: "active",
};

export default function AdminStudents() {
  const { t } = useTranslation();
  const studentStatusOptions = useMemo(() => getStudentStatusOptions(t), [t]);
  const toast = useToast();
  const authUser = useSelector(selectAuthUser);
  const canWrite = checkPermission(authUser, "admin.students.update");
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", major: "", campus: "", status: "" });
  const { rows, meta, loading, error, refetch } = useStudents(query);
  const [lookups, setLookups] = useState({ majors: [], campuses: [] });
  const [modal, setModal] = useState({ type: null, student: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmStudent, setConfirmStudent] = useState(null);

  useEffect(() => {
    studentGroupLookupService.getAll()
      .then((res) => setLookups(res?.data || { majors: [], campuses: [] }))
      .catch(() => setLookups({ majors: [], campuses: [] }));
  }, []);

  const majorOptions = useMemo(() => [
    { value: "", label: t("common.confirm") === "Xác nhận" ? "Tất cả ngành" : "All majors" },
    ...(lookups.majors || []).map((major) => ({ value: major, label: major })),
  ], [lookups.majors, t]);

  const campusOptions = useMemo(() => [
    { value: "", label: t("common.confirm") === "Xác nhận" ? "Tất cả campus" : "All campuses" },
    ...(lookups.campuses || []).map((campus) => ({ value: campus, label: campus })),
  ], [lookups.campuses, t]);

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ type: "create", student: null });
  };

  const openEdit = (student) => {
    setForm({
      user_id: student.user_id ? String(student.user_id) : "",
      student_code: student.student_code || "",
      full_name: student.full_name || "",
      email: student.email || "",
      phone: student.phone || "",
      major: student.major || "",
      campus: student.campus || "",
      status: student.status || "active",
    });
    setModal({ type: "edit", student });
  };

  const openDetail = async (student) => {
    try {
      const res = await studentService.get(student.id);
      setModal({ type: "detail", student: res?.data || student });
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const validateForm = () => {
    const isVi = t("common.confirm") === "Xác nhận";
    if (!form.student_code.trim() || !form.full_name.trim() || !form.email.trim()) {
      return isVi ? "Vui lòng nhập MSSV, họ tên và email." : "Please enter student code, full name and email.";
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      return isVi ? "Email không đúng định dạng." : "Invalid email format.";
    }
    if (form.major === "other" || (form.major && typeof form.major === "string" && !form.major.trim())) {
      return isVi ? "Vui lòng nhập tên ngành học khác." : "Please enter the custom major name.";
    }
    return "";
  };

  const save = async (event) => {
    event.preventDefault();
    const validation = validateForm();
    if (validation) {
      toast.error(validation);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        user_id: form.user_id ? Number(form.user_id) : null,
        student_code: form.student_code.toUpperCase(),
        email: form.email.toLowerCase(),
      };
      if (modal.type === "create") {
        await studentService.create(payload);
        toast.success(t("admin.toasts.createSuccess"));
      } else {
        await studentService.update(modal.student.id, payload);
        toast.success(t("admin.toasts.updateSuccess"));
      }
      setModal({ type: null, student: null });
      await refetch();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const deleteStudent = async () => {
    if (!confirmStudent) return;
    try {
      await studentService.remove(confirmStudent.id);
      toast.success(t("common.confirm") === "Xác nhận" ? "Đã xoá mềm sinh viên" : "Soft deleted student successfully");
      setConfirmStudent(null);
      await refetch();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const columns = useMemo(() => [
    { key: "student_code", label: t("admin.fields.studentCode"), render: (row) => <span className="font-mono text-xs font-bold text-indigo-700">{row.student_code}</span> },
    { key: "full_name", label: t("admin.fields.fullName"), render: (row) => <span className="font-semibold text-gray-900">{row.full_name}</span> },
    { key: "email", label: t("admin.fields.email") },
    { key: "phone", label: t("admin.fields.phone"), render: (row) => row.phone || "—" },
    { key: "major", label: t("admin.fields.major"), render: (row) => row.major || "—" },
    { key: "campus", label: t("admin.fields.campus"), render: (row) => row.campus || "—" },
    { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "linked", label: t("common.confirm") === "Xác nhận" ? "Liên kết User" : "User linked", render: (row) => row.user_id ? <StatusBadge value="linked" /> : <span className="text-gray-400">No</span> },
    { key: "created_at", label: t("common.created"), render: (row) => formatDate(row.created_at) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => openDetail(row)} title={t("admin.actions.detail")}><Eye size={16} /></ActionButton>
          {canWrite ? <ActionButton onClick={() => openEdit(row)} title={t("admin.actions.edit")}><SquarePen size={16} /></ActionButton> : null}
          {canWrite ? <ActionButton onClick={() => setConfirmStudent(row)} title={t("admin.actions.delete")} tone="red"><Trash2 size={16} /></ActionButton> : null}
        </div>
      ),
    },
  ], [t, canWrite]);

  return (
    <>
      <FilterBar
        right={canWrite ? (
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer">
            <Plus size={16} /> {t("admin.actions.create")}
          </button>
        ) : null}
      >
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("common.confirm") === "Xác nhận" ? "MSSV, tên, email..." : "Code, name, email..."} />
        <FilterSelect label={t("admin.fields.major")} value={query.major} onChange={(major) => setQuery((prev) => ({ ...prev, page: 1, major }))} options={majorOptions} />
        <FilterSelect label={t("admin.fields.campus")} value={query.campus} onChange={(campus) => setQuery((prev) => ({ ...prev, page: 1, campus }))} options={campusOptions} />
        <FilterSelect label={t("admin.fields.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={studentStatusOptions} />
      </FilterBar>

      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText={t("common.noData")} />

      <FormModal open={["create", "edit"].includes(modal.type)} title={modal.type === "create" ? t("admin.actions.create") + " Student" : t("admin.actions.edit") + " Student"} onClose={() => setModal({ type: null, student: null })} onSubmit={save} saving={saving}>
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {/* Section 1: Personal Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <User size={16} />
              </span>
              <h4 className="text-sm font-bold text-gray-800">
                {t("common.confirm") === "Xác nhận" ? "Thông tin cá nhân" : "Personal Information"}
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("admin.fields.fullName")}>
                <input className={inputClass} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required placeholder="Nguyen Van A" />
              </Field>
              <Field label={t("admin.fields.studentCode")}>
                <input className={inputClass} value={form.student_code} onChange={(e) => setForm({ ...form, student_code: e.target.value.toUpperCase() })} required placeholder="SE123456" />
              </Field>
              <Field label={t("admin.fields.email")}>
                <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="anv@fpt.edu.vn" />
              </Field>
              <Field label={t("admin.fields.phone")}>
                <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0987654321" />
              </Field>
            </div>
          </div>

          {/* Section 2: Academic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <GraduationCap size={16} />
              </span>
              <h4 className="text-sm font-bold text-gray-800">
                {t("common.confirm") === "Xác nhận" ? "Thông tin học vụ" : "Academic Information"}
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("admin.fields.major")}>
                <div className="space-y-2">
                  <Dropdown
                    label={t("common.confirm") === "Xác nhận" ? "Chọn ngành học..." : "Select major..."}
                    value={
                      form.major
                        ? (["Kỹ thuật phần mềm", "Thiết kế mỹ thuật số", "An toàn thông tin", "Quản trị kinh doanh", "Truyền thông đa phương tiện"].includes(form.major)
                          ? form.major
                          : "other")
                        : ""
                    }
                    onChange={(value) => {
                      if (value === "other") {
                        setForm({ ...form, major: "other" });
                      } else {
                        setForm({ ...form, major: value });
                      }
                    }}
                    options={[
                      ...MAJOR_OPTIONS,
                      { value: "other", label: t("common.confirm") === "Xác nhận" ? "Khác (Tự nhập)..." : "Other (Custom input)..." }
                    ]}
                  />
                  {(form.major === "other" || (form.major && !["Kỹ thuật phần mềm", "Thiết kế mỹ thuật số", "An toàn thông tin", "Quản trị kinh doanh", "Truyền thông đa phương tiện"].includes(form.major))) && (
                    <input
                      type="text"
                      className={`${inputClass} mt-2`}
                      value={form.major === "other" ? "" : form.major}
                      onChange={(e) => setForm({ ...form, major: e.target.value })}
                      placeholder={t("common.confirm") === "Xác nhận" ? "Nhập tên ngành học khác..." : "Enter custom major name..."}
                      required
                    />
                  )}
                </div>
              </Field>
              <Field label={t("admin.fields.campus")}>
                <Dropdown
                  label={t("common.confirm") === "Xác nhận" ? "Chọn cơ sở..." : "Select campus..."}
                  value={form.campus}
                  onChange={(value) => setForm({ ...form, campus: value })}
                  options={CAMPUS_OPTIONS}
                />
              </Field>
            </div>
          </div>

          {/* Section 3: System Status & Links */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <KeyRound size={16} />
              </span>
              <h4 className="text-sm font-bold text-gray-800">
                {t("common.confirm") === "Xác nhận" ? "Trạng thái & Liên kết" : "Status & Account"}
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("admin.fields.status")}>
                <Dropdown
                  label="Status"
                  value={form.status}
                  onChange={(value) => setForm({ ...form, status: value })}
                  direction="up"
                  options={[
                    { value: "active", label: t("status.active") },
                    { value: "inactive", label: t("status.inactive") },
                    { value: "graduated", label: t("status.graduated") },
                    { value: "suspended", label: t("status.suspended") },
                    { value: "pending", label: t("status.pending") },
                  ]}
                />
              </Field>
              {modal.type === "edit" ? (
                <Field label={t("common.confirm") === "Xác nhận" ? "User ID liên kết" : "Linked user ID"}>
                  <input
                    type="number"
                    min="1"
                    className={inputClass}
                    value={form.user_id}
                    onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                    placeholder={t("common.confirm") === "Xác nhận" ? "Nếu đã có user_id" : "If user_id exists"}
                  />
                </Field>
              ) : null}
            </div>
          </div>
        </div>
      </FormModal>

      <FormModal
        open={modal.type === "detail"}
        title={t("common.confirm") === "Xác nhận" ? "Chi tiết sinh viên" : "Student details"}
        onClose={() => setModal({ type: null, student: null })}
        onSubmit={(event) => { event.preventDefault(); setModal({ type: null, student: null }); }}
        submitLabel={t("admin.actions.close")}
      >
        {modal.student ? (
          <div className="space-y-4">
            <DetailGrid items={[
              [t("admin.fields.fullName", { defaultValue: "Sinh viên" }) === "Họ và tên" ? "Sinh viên" : "Student", buildStudentLabel(modal.student)],
              [t("admin.fields.phone"), modal.student.phone || "—"],
              [t("admin.fields.major"), modal.student.major || "—"],
              [t("admin.fields.campus"), modal.student.campus || "—"],
              [t("admin.fields.status"), modal.student.status],
              [t("common.confirm") === "Xác nhận" ? "User liên kết" : "Linked user", modal.student.linked_username || modal.student.user_id || "—"],
              [t("common.created"), formatDate(modal.student.created_at)],
              [t("common.updated"), formatDate(modal.student.updated_at)],
            ]} />
            <div>
              <h3 className="mb-2 text-sm font-black text-gray-900">{t("common.confirm") === "Xác nhận" ? "Lớp học tham gia" : "Classes"}</h3>
              <div className="space-y-2">
                {(modal.student.classes || []).length ? modal.student.classes.map((item) => (
                  <div key={item.enrollment_id} className="rounded-xl border border-gray-100 p-3 text-sm">
                    <div className="font-bold text-gray-900">{getShortClassCode(item.class_code, item.semester_code)} · {item.subject_code}</div>
                    <div className="mt-1 text-gray-500">{item.semester_code} · {item.enrollment_status} · {item.group_name || (t("common.confirm") === "Xác nhận" ? "Chưa có nhóm" : "No group")}</div>
                  </div>
                )) : <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-400">{t("common.confirm") === "Xác nhận" ? "Sinh viên chưa tham gia lớp nào." : "Student has not joined any class."}</div>}
              </div>
            </div>
          </div>
        ) : null}
      </FormModal>

      <ConfirmDialog
        isOpen={!!confirmStudent}
        title={t("common.confirm") === "Xác nhận" ? "Xoá mềm sinh viên" : "Soft delete student"}
        subtitle={confirmStudent ? (t("common.confirm") === "Xác nhận" ? `${confirmStudent.student_code} - ${confirmStudent.full_name}. Không xoá cứng dữ liệu học thuật liên quan.` : `${confirmStudent.student_code} - ${confirmStudent.full_name}. Does not hard delete related academic data.`) : ""}
        variant="delete"
        color="red"
        yesLabel={t("common.confirm") === "Xác nhận" ? "Xoá mềm" : "Soft delete"}
        onYes={deleteStudent}
        onClose={() => setConfirmStudent(null)}
      />
    </>
  );
}
