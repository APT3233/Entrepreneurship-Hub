import { useEffect, useMemo, useState } from "react";
import { Eye, Plus, Send, UserMinus, UsersRound } from "lucide-react";
import { useSelector } from "react-redux";
import { enrollmentService, studentGroupLookupService } from "@/api/adminStudentGroup";
import { useToast } from "@/components/ui/Toast";
import { selectAuthUser } from "@/store/slices/authSlice";
import { checkPermission } from "@/utils/permissions";
import { useEnrollments } from "@/hooks/admin/useEnrollments";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import WarningNote from "@/pages/admin/student-group/components/WarningNote";
import { useTranslation } from "@/context/TranslationContext";
import Dropdown from "@/components/ui/filter/DropDown";
import {
  buildClassLabel,
  buildStudentLabel,
  formatDate,
  getEnrollmentStatusOptions,
  pageLimit,
  toSelectOptions,
} from "@/pages/admin/student-group/shared";

const emptyForm = { class_id: "", student_id: "", status: "enrolled" };

export default function AdminEnrollments() {
  const { t, language } = useTranslation();
  const toast = useToast();
  const authUser = useSelector(selectAuthUser);
  const canWrite = checkPermission(authUser, "admin.enrollments.update");
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", class_id: "", semester_id: "", subject_id: "", status: "" });
  const { rows, meta, loading, error, refetch } = useEnrollments(query);
  const [lookups, setLookups] = useState({ classes: [], subjects: [], semesters: [], students: [] });
  const [modal, setModal] = useState({ type: null });
  const [form, setForm] = useState(emptyForm);
  const [bulkForm, setBulkForm] = useState({ class_id: "", student_ids: [] });
  const [withoutGroup, setWithoutGroup] = useState({ class_id: "", rows: [], loading: false });
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    studentGroupLookupService.getAll()
      .then((res) => setLookups(res?.data || { classes: [], subjects: [], semesters: [], students: [] }))
      .catch(() => setLookups({ classes: [], subjects: [], semesters: [], students: [] }));
  }, []);

  const enrollmentStatusOptions = useMemo(() => getEnrollmentStatusOptions(t), [t]);
  const classOptions = useMemo(() => toSelectOptions(lookups.classes, (item) => item.id, buildClassLabel, t("lookupAll.classes")), [lookups.classes, t]);
  const subjectOptions = useMemo(() => toSelectOptions(lookups.subjects, (item) => item.id, (item) => `${item.subject_code} - ${item.subject_name}`, t("lookupAll.subjects")), [lookups.subjects, t]);
  const semesterOptions = useMemo(() => toSelectOptions(lookups.semesters, (item) => item.id, (item) => `${item.semester_code} - ${item.semester_name}`, t("lookupAll.semesters")), [lookups.semesters, t]);

  const formClassOptions = useMemo(() => 
    (lookups.classes || []).map((item) => ({ value: String(item.id), label: buildClassLabel(item) })),
    [lookups.classes]
  );

  const formStudentOptions = useMemo(() => 
    (lookups.students || []).map((item) => ({ value: String(item.id), label: buildStudentLabel(item) })),
    [lookups.students]
  );

  const openAdd = () => {
    setForm({ ...emptyForm, class_id: query.class_id || "" });
    setModal({ type: "add" });
  };

  const openBulk = () => {
    setBulkForm({ class_id: query.class_id || "", student_ids: [] });
    setModal({ type: "bulk" });
  };

  const saveEnrollment = async (event) => {
    event.preventDefault();
    if (!form.class_id || !form.student_id) {
      toast.error(t("common.confirm") === "Xác nhận" ? "Vui lòng chọn lớp và sinh viên." : "Please select class and student.");
      return;
    }
    setSaving(true);
    try {
      const res = await enrollmentService.create({
        class_id: Number(form.class_id),
        student_id: Number(form.student_id),
        status: form.status,
      });
      const warnings = res?.data?.warnings || [];
      toast.success(warnings.length ? `${t("admin.toasts.createSuccess")}. ${warnings.join(" ")}` : t("admin.toasts.createSuccess"));
      setModal({ type: null });
      await refetch();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const saveBulk = async (event) => {
    event.preventDefault();
    if (!bulkForm.class_id || !bulkForm.student_ids.length) {
      toast.error(t("common.confirm") === "Xác nhận" ? "Vui lòng chọn lớp và ít nhất một sinh viên." : "Please select class and at least one student.");
      return;
    }
    setSaving(true);
    try {
      const res = await enrollmentService.bulkCreate({
        class_id: Number(bulkForm.class_id),
        student_ids: bulkForm.student_ids.map(Number),
      });
      const results = res?.data?.results || [];
      const successCount = results.filter((item) => item.success).length;
      toast.success(t("common.confirm") === "Xác nhận" ? `Thêm hàng loạt hoàn tất: ${successCount}/${results.length} thành công` : `Bulk add completed: ${successCount}/${results.length} successfully`);
      setModal({ type: null });
      await refetch();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (force = false) => {
    if (!confirmAction) return;
    try {
      await enrollmentService.updateStatus(confirmAction.enrollment.id, confirmAction.status, force);
      toast.success(t("admin.toasts.statusSuccess"));
      setConfirmAction(null);
      await refetch();
    } catch (err) {
      if (!force && confirmAction.status === "dropped" && String(err.message || "").includes("force=true")) {
        setConfirmAction((prev) => ({ ...prev, forceRequired: true, message: err.message }));
      } else {
        toast.error(err.message || t("admin.toasts.actionFailed"));
      }
    }
  };

  const loadWithoutGroup = async (classId) => {
    if (!classId) {
      toast.error(t("common.confirm") === "Xác nhận" ? "Vui lòng chọn lớp." : "Please select class.");
      return;
    }
    setWithoutGroup({ class_id: classId, rows: [], loading: true });
    setModal({ type: "without-group" });
    try {
      const res = await enrollmentService.listStudentsWithoutGroup(classId);
      setWithoutGroup({ class_id: classId, rows: res?.data || [], loading: false });
    } catch (err) {
      setWithoutGroup({ class_id: classId, rows: [], loading: false });
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const toggleBulkStudent = (studentId) => {
    setBulkForm((prev) => ({
      ...prev,
      student_ids: prev.student_ids.includes(studentId)
        ? prev.student_ids.filter((id) => id !== studentId)
        : [...prev.student_ids, studentId],
    }));
  };

  const [sendingInviteId, setSendingInviteId] = useState(null);

  const sendInvite = async (row) => {
    if (!row?.id) return;
    setSendingInviteId(row.id);
    try {
      const res = await enrollmentService.sendInvite(row.id);
      toast.success(
        t("common.confirm") === "Xác nhận"
          ? `Đã xếp hàng gửi invite tới ${res?.data?.email || row.email}.`
          : `Invite queued for ${res?.data?.email || row.email}.`,
      );
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSendingInviteId(null);
    }
  };

  const columns = useMemo(() => [
    { key: "class_code", label: t("admin.fields.classCode", { defaultValue: "Class" }) === "Mã lớp" ? "Lớp" : "Class", render: (row) => <span className="font-mono text-xs font-bold text-indigo-700">{row.class_code}</span> },
    { key: "semester", label: t("admin.fields.semester"), render: (row) => `${row.semester_code} (${row.year})` },
    { key: "subject", label: t("nav.subjects"), render: (row) => `${row.subject_code} - ${row.subject_name}` },
    { key: "student_code", label: t("admin.fields.studentCode"), render: (row) => <span className="font-mono text-xs font-bold text-gray-700">{row.student_code}</span> },
    { key: "student_name", label: t("admin.fields.fullName", { defaultValue: "Student" }) === "Họ và tên" ? "Sinh viên" : "Student", render: (row) => <span className="font-semibold text-gray-900">{row.student_name}</span> },
    { key: "email", label: t("admin.fields.email") },
    { key: "status", label: t("admin.fields.enrolledCount", { defaultValue: "Enrollment" }) === "Đăng ký" ? "Đăng ký" : "Enrollment", render: (row) => <StatusBadge value={row.status} /> },
    { key: "enrolled_at", label: t("common.confirm") === "Xác nhận" ? "Ngày đăng ký" : "Enrolled", render: (row) => formatDate(row.enrolled_at) },
    { key: "group", label: t("admin.fields.group"), render: (row) => row.group_name || <span className="text-gray-400">{t("common.confirm") === "Xác nhận" ? "Chưa có nhóm" : "No group"}</span> },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => loadWithoutGroup(row.class_id)} title={t("common.confirm") === "Xác nhận" ? "Sinh viên chưa có nhóm" : "Students without group"}><Eye size={16} /></ActionButton>
          {canWrite && !row.user_id && row.status !== "dropped" ? (
            <ActionButton
              onClick={() => sendInvite(row)}
              title={t("common.confirm") === "Xác nhận" ? "Gửi invite kích hoạt" : "Send activation invite"}
              disabled={sendingInviteId === row.id}
            >
              <Send size={16} />
            </ActionButton>
          ) : null}
          {canWrite && row.status !== "dropped" ? (
            <ActionButton onClick={() => setConfirmAction({ enrollment: row, status: "dropped" })} title="Drop student" tone="red"><UserMinus size={16} /></ActionButton>
          ) : null}
        </div>
      ),
    },
  ], [t, canWrite, sendingInviteId]);

  return (
    <>
      <FilterBar
        right={canWrite ? (
          <>
            <button type="button" onClick={() => loadWithoutGroup(query.class_id)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer">
              <UsersRound size={16} /> {t("common.confirm") === "Xác nhận" ? "Chưa có nhóm" : "Without group"}
            </button>
            <button type="button" onClick={openBulk} className="inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer">
              <UsersRound size={16} /> {t("common.confirm") === "Xác nhận" ? "Thêm hàng loạt" : "Bulk add"}
            </button>
            <button type="button" onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer">
              <Plus size={16} /> {t("admin.actions.create")}
            </button>
          </>
        ) : null}
      >
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("common.confirm") === "Xác nhận" ? "MSSV, tên, email, lớp..." : "Code, name, email, class..."} />
        <FilterSelect label={t("admin.fields.classCode", { defaultValue: "Class" }) === "Mã lớp" ? "Lớp" : "Class"} value={query.class_id} onChange={(class_id) => setQuery((prev) => ({ ...prev, page: 1, class_id }))} options={classOptions} />
        <FilterSelect label={t("admin.fields.semester")} value={query.semester_id} onChange={(semester_id) => setQuery((prev) => ({ ...prev, page: 1, semester_id }))} options={semesterOptions} />
        <FilterSelect label={t("nav.subjects")} value={query.subject_id} onChange={(subject_id) => setQuery((prev) => ({ ...prev, page: 1, subject_id }))} options={subjectOptions} />
        <FilterSelect label={t("admin.fields.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={enrollmentStatusOptions} />
      </FilterBar>

      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText={t("common.noData")} />

      <FormModal open={modal.type === "add"} title={t("common.confirm") === "Xác nhận" ? "Thêm sinh viên vào lớp" : "Add student to class"} onClose={() => setModal({ type: null })} onSubmit={saveEnrollment} saving={saving}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("admin.fields.classCode", { defaultValue: "Class" }) === "Mã lớp" ? "Lớp" : "Class"}>
            <Dropdown
              label={t("common.confirm") === "Xác nhận" ? "Chọn lớp" : "Select class"}
              value={form.class_id}
              onChange={(value) => setForm({ ...form, class_id: value })}
              options={formClassOptions}
            />
          </Field>
          <Field label={t("admin.fields.fullName", { defaultValue: "Sinh viên" }) === "Họ và tên" ? "Sinh viên" : "Student"}>
            <Dropdown
              label={t("common.confirm") === "Xác nhận" ? "Chọn sinh viên" : "Select student"}
              value={form.student_id}
              onChange={(value) => setForm({ ...form, student_id: value })}
              options={formStudentOptions}
            />
          </Field>
          <Field label={t("admin.fields.status")}>
            <Dropdown
              label="Status"
              value={form.status}
              onChange={(value) => setForm({ ...form, status: value })}
              options={[
                { value: "enrolled", label: "Enrolled" },
                { value: "completed", label: "Completed" },
              ]}
            />
          </Field>
          <div className="sm:col-span-2">
            <WarningNote>
              {t("common.confirm") === "Xác nhận"
                ? "Hệ thống tự động chặn trùng lớp và cảnh báo nếu sinh viên đã học cùng subject trong học kỳ."
                : "System prevents duplicate entries and warns if the student has taken the same subject in the semester."}
            </WarningNote>
          </div>
        </div>
      </FormModal>

      <FormModal open={modal.type === "bulk"} title={t("common.confirm") === "Xác nhận" ? "Thêm hàng loạt sinh viên" : "Bulk add students"} onClose={() => setModal({ type: null })} onSubmit={saveBulk} saving={saving}>
        <div className="space-y-4">
          <Field label={t("admin.fields.classCode", { defaultValue: "Class" }) === "Mã lớp" ? "Lớp" : "Class"}>
            <Dropdown
              label={t("common.confirm") === "Xác nhận" ? "Chọn lớp" : "Select class"}
              value={bulkForm.class_id}
              onChange={(value) => setBulkForm({ ...bulkForm, class_id: value })}
              options={formClassOptions}
            />
          </Field>
          <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-100 p-2">
            {(lookups.students || []).map((student) => (
              <label key={student.id} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={bulkForm.student_ids.includes(student.id)} onChange={() => toggleBulkStudent(student.id)} />
                <span className="font-semibold text-gray-800">{buildStudentLabel(student)}</span>
              </label>
            ))}
          </div>
        </div>
      </FormModal>

      <FormModal
        open={modal.type === "without-group"}
        title={t("common.confirm") === "Xác nhận" ? "Sinh viên chưa có nhóm" : "Students without group"}
        onClose={() => setModal({ type: null })}
        onSubmit={(event) => { event.preventDefault(); setModal({ type: null }); }}
        submitLabel={t("admin.actions.close")}
      >
        {withoutGroup.loading ? (
          <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-400">{t("common.loading")}</div>
        ) : (
          <div className="space-y-2">
            {withoutGroup.rows.length ? withoutGroup.rows.map((student) => (
              <div key={student.id} className="rounded-xl border border-gray-100 p-3 text-sm">
                <div className="font-bold text-gray-900">{student.student_code} - {student.full_name}</div>
                <div className="mt-1 text-gray-500">{student.email} · {student.major || "—"} · {formatDate(student.enrolled_at)}</div>
              </div>
            )) : <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-400">{t("common.confirm") === "Xác nhận" ? "Lớp học không có sinh viên chưa có nhóm." : "No students in this class are without group."}</div>}
          </div>
        )}
      </FormModal>

      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmAction?.forceRequired ? (t("common.confirm") === "Xác nhận" ? "Drop sinh viên khỏi lớp và nhóm?" : "Drop student from class and group?") : (t("common.confirm") === "Xác nhận" ? "Drop sinh viên khỏi lớp" : "Drop student from class")}
        subtitle={confirmAction?.forceRequired ? confirmAction.message : (t("common.confirm") === "Xác nhận" ? "Nếu sinh viên đang thuộc nhóm, hệ thống yêu cầu force drop để gỡ khỏi nhóm trước." : "If the student belongs to a group, backend requires force drop validation.")}
        variant="remove"
        color="red"
        yesLabel={confirmAction?.forceRequired ? "Force drop" : "Drop"}
        onYes={() => updateStatus(!!confirmAction?.forceRequired)}
        onClose={() => setConfirmAction(null)}
      />
    </>
  );
}
