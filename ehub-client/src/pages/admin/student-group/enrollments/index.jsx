import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Plus, Send, UserMinus, UsersRound, BookOpen, ShieldCheck, GraduationCap, Info, Search, Check } from "lucide-react";
import { useSelector } from "react-redux";
import { enrollmentService, studentGroupLookupService } from "@/api/adminStudentGroup";
import { useToast } from "@/components/ui/Toast";
import { selectAuthUser } from "@/store/slices/authSlice";
import { checkPermission } from "@/utils/permissions";
import { useEnrollments } from "@/hooks/admin/useEnrollments";
import { useAdminListSemesterFilters } from "@/hooks/admin/useAdminListSemesterFilters";
import { useAdminUrlQuerySync } from "@/hooks/admin/useAdminUrlQuerySync";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { AdminSemesterFilterGroup, FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal, { Field } from "@/pages/admin/components/FormModal";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import WarningNote from "@/pages/admin/student-group/components/WarningNote";
import { useTranslation } from "@/context/TranslationContext";
import { countActiveAdminFilters } from "@/pages/admin/shared/filterUtils";
import Dropdown from "@/components/ui/filter/DropDown";
import {
  buildClassLabel,
  buildStudentLabel,
  formatDate,
  getEnrollmentStatusOptions,
  getShortClassCode,
  pageLimit,
  toSelectOptions,
} from "@/pages/admin/student-group/shared";

const emptyForm = { class_id: "", student_id: "", status: "enrolled" };

export default function AdminEnrollments() {
  const { t } = useTranslation();
  const toast = useToast();
  const authUser = useSelector(selectAuthUser);
  const canWrite = checkPermission(authUser, "admin.enrollments.update");
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", class_id: "", semester_id: "", subject_id: "", status: "" });
  useAdminUrlQuerySync({
    query,
    setQuery,
    keys: ["page", "search", "semester_id", "class_id", "subject_id", "status"],
  });
  const [lookups, setLookups] = useState({ classes: [], subjects: [], semesters: [], students: [] });
  const { semesterFilter, classOptions, listEnabled } = useAdminListSemesterFilters({
    semesters: lookups.semesters,
    classes: lookups.classes,
    buildClassLabel,
    setQuery,
    querySemesterId: query.semester_id,
  });
  const { rows, meta, loading, error, refetch } = useEnrollments(query, { enabled: listEnabled });
  const [modal, setModal] = useState({ type: null });
  const [form, setForm] = useState(emptyForm);
  const [bulkForm, setBulkForm] = useState({ class_id: "", student_ids: [] });
  const [withoutGroup, setWithoutGroup] = useState({ class_id: "", rows: [], loading: false });
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [bulkSearch, setBulkSearch] = useState("");

  const refreshLookups = useCallback(async () => {
    const res = await studentGroupLookupService.getAll().catch(() => ({ data: { classes: [], subjects: [], semesters: [], students: [] } }));
    setLookups(res?.data || { classes: [], subjects: [], semesters: [], students: [] });
  }, []);

  useEffect(() => {
    refreshLookups();
  }, [refreshLookups]);

  const enrollmentStatusOptions = useMemo(() => getEnrollmentStatusOptions(t), [t]);
  const subjectOptions = useMemo(() => toSelectOptions(lookups.subjects, (item) => item.id, (item) => `${item.subject_code} - ${item.subject_name}`, t("lookupAll.subjects")), [lookups.subjects, t]);

  const filteredBulkStudents = useMemo(() => {
    if (!bulkSearch.trim()) return lookups.students || [];
    const searchLower = bulkSearch.toLowerCase();
    return (lookups.students || []).filter((s) =>
      (s.student_code || "").toLowerCase().includes(searchLower) ||
      (s.full_name || "").toLowerCase().includes(searchLower) ||
      (s.email || "").toLowerCase().includes(searchLower)
    );
  }, [lookups.students, bulkSearch]);

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
    setBulkSearch("");
    setModal({ type: "bulk" });
  };

  const saveEnrollment = async (event) => {
    event.preventDefault();
    if (!form.class_id || !form.student_id) {
      toast.error(t("admin.enrollment.selectClassAndStudent"));
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
      await refreshLookups();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const saveBulk = async (event) => {
    event.preventDefault();
    if (!bulkForm.class_id || !bulkForm.student_ids.length) {
      toast.error(t("admin.enrollment.selectClassAndStudents"));
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
      toast.success(t("admin.enrollment.bulkAddSuccess", { success: successCount, total: results.length }));
      setModal({ type: null });
      await refetch();
      await refreshLookups();
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
      toast.error(t("admin.enrollment.selectClass"));
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
      toast.success(t("admin.enrollment.inviteQueued", { email: res?.data?.email || row.email }));
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSendingInviteId(null);
    }
  };

  const columns = useMemo(() => [
    { key: "class_code", label: t("admin.columns.class"), render: (row) => <span className="font-mono text-xs font-bold text-indigo-700">{getShortClassCode(row.class_code, row.semester_code)}</span> },
    { key: "semester", label: t("admin.columns.semester"), render: (row) => `${row.semester_code} (${row.year})` },
    { key: "subject", label: t("admin.columns.subject"), render: (row) => `${row.subject_code} - ${row.subject_name}` },
    { key: "student_code", label: t("admin.fields.studentCode"), render: (row) => <span className="font-mono text-xs font-bold text-gray-700">{row.student_code}</span> },
    { key: "student_name", label: t("admin.columns.student"), render: (row) => <span className="font-semibold text-gray-900">{row.student_name}</span> },
    { key: "email", label: t("admin.fields.email") },
    { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "enrolled_at", label: t("admin.columns.enrolledAt"), render: (row) => formatDate(row.enrolled_at) },
    { key: "group", label: t("admin.fields.group"), render: (row) => row.group_name || <span className="text-gray-400">{t("admin.columns.noGroup")}</span> },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => loadWithoutGroup(row.class_id)} title={t("admin.enrollment.studentsWithoutGroup")}><Eye size={16} /></ActionButton>
          {canWrite && !row.user_id && row.status !== "dropped" ? (
            <ActionButton
              onClick={() => sendInvite(row)}
              title={t("admin.enrollment.sendActivationInvite")}
              disabled={sendingInviteId === row.id}
            >
              <Send size={16} />
            </ActionButton>
          ) : null}
          {canWrite && row.status !== "dropped" ? (
            <ActionButton onClick={() => setConfirmAction({ enrollment: row, status: "dropped" })} title={t("admin.enrollment.dropStudent")} tone="red"><UserMinus size={16} /></ActionButton>
          ) : null}
        </div>
      ),
    },
  ], [t, canWrite, sendingInviteId]);

  const activeFilterCount = countActiveAdminFilters(query);

  const clearFilters = () => {
    semesterFilter.reset();
    setQuery((prev) => ({
      ...prev,
      page: 1,
      search: "",
      class_id: "",
      subject_id: "",
      status: "",
    }));
  };

  return (
    <>
      <FilterBar
        search={(
          <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.enrollment.searchPlaceholder")} />
        )}
        activeFilterCount={activeFilterCount}
        onClear={clearFilters}
        right={canWrite ? (
          <>
            <button type="button" onClick={() => loadWithoutGroup(query.class_id)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer">
              <UsersRound size={16} /> {t("admin.enrollment.withoutGroupBtn")}
            </button>
            <button type="button" onClick={openBulk} className="inline-flex h-10 items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer">
              <UsersRound size={16} /> {t("admin.enrollment.bulkAdd")}
            </button>
            <button type="button" onClick={openAdd} className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer">
              <Plus size={16} /> {t("admin.actions.create")}
            </button>
          </>
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
        <FilterSelect label={t("admin.columns.class")} value={query.class_id} onChange={(class_id) => setQuery((prev) => ({ ...prev, page: 1, class_id }))} options={classOptions} />
        <FilterSelect label={t("admin.columns.subject")} value={query.subject_id} onChange={(subject_id) => setQuery((prev) => ({ ...prev, page: 1, subject_id }))} options={subjectOptions} />
        <FilterSelect label={t("admin.fields.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={enrollmentStatusOptions} />
      </FilterBar>

      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText={t("common.noData")} />

      <FormModal open={modal.type === "add"} title={t("admin.enrollment.addStudentTitle")} onClose={() => setModal({ type: null })} onSubmit={saveEnrollment} saving={saving}>
        <div className="space-y-6">
          {/* Section 1: Academic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <BookOpen size={16} />
              </span>
              <h4 className="text-sm font-bold text-gray-800">
                {t("admin.enrollment.academicInfo")}
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("admin.columns.class")}>
                <Dropdown
                  label={t("admin.enrollment.selectClassLabel")}
                  value={form.class_id}
                  onChange={(value) => setForm({ ...form, class_id: value })}
                  options={formClassOptions}
                />
              </Field>
              <Field label={t("admin.columns.student")}>
                <Dropdown
                  label={t("admin.enrollment.selectStudentLabel")}
                  value={form.student_id}
                  onChange={(value) => setForm({ ...form, student_id: value })}
                  options={formStudentOptions}
                />
              </Field>
            </div>
          </div>

          {/* Section 2: Status */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <ShieldCheck size={16} />
              </span>
              <h4 className="text-sm font-bold text-gray-800">
                {t("admin.enrollment.enrollmentStatus")}
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("admin.fields.status")}>
                <Dropdown
                  label={t("admin.fields.status")}
                  value={form.status}
                  onChange={(value) => setForm({ ...form, status: value })}
                  direction="up"
                  options={[
                    { value: "enrolled", label: t("status.enrolled") },
                    { value: "completed", label: t("status.completed") },
                  ]}
                />
              </Field>
            </div>
          </div>

          <div className="mt-2">
            <WarningNote>
              {t("admin.enrollment.duplicateWarning")}
            </WarningNote>
          </div>
        </div>
      </FormModal>

      <FormModal open={modal.type === "bulk"} title={t("admin.enrollment.bulkAddTitle")} onClose={() => setModal({ type: null })} onSubmit={saveBulk} saving={saving}>
        <div className="space-y-6">
          {/* Section 1: Target Class */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <BookOpen size={16} />
              </span>
              <h4 className="text-sm font-bold text-gray-800">
                {t("admin.enrollment.classAssignment")}
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("admin.columns.class")}>
                <Dropdown
                  label={t("admin.enrollment.selectClassLabel")}
                  value={bulkForm.class_id}
                  onChange={(value) => setBulkForm({ ...bulkForm, class_id: value })}
                  options={formClassOptions}
                />
              </Field>
            </div>
          </div>

          {/* Section 2: Student List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <UsersRound size={16} />
                </span>
                <h4 className="text-sm font-bold text-gray-800">
                  {t("admin.enrollment.studentList")}
                </h4>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                {t("admin.enrollment.selectedCount", { count: bulkForm.student_ids.length })}
              </span>
            </div>

            {/* Smart Search Bar */}
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-xs font-medium"
                placeholder={t("admin.enrollment.searchStudentPlaceholder")}
                value={bulkSearch}
                onChange={(e) => setBulkSearch(e.target.value)}
              />
            </div>

            {/* Premium scroll list */}
            <div className="max-h-64 overflow-y-auto rounded-2xl border border-gray-100 p-2 space-y-1 custom-scrollbar">
              {filteredBulkStudents.length ? (
                filteredBulkStudents.map((student) => {
                  const isChecked = bulkForm.student_ids.includes(student.id);
                  return (
                    <label
                      key={student.id}
                      className={`
                        flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-xs font-medium cursor-pointer transition-all duration-150
                        ${isChecked
                          ? "bg-indigo-50/40 border-indigo-200 text-indigo-950 font-bold"
                          : "border-transparent text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                          checked={isChecked}
                          onChange={() => toggleBulkStudent(student.id)}
                        />
                        <span>{buildStudentLabel(student)}</span>
                      </div>
                      {isChecked && <Check size={14} className="text-indigo-600 shrink-0" />}
                    </label>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-gray-400 bg-gray-50/50 rounded-xl">
                  {t("admin.enrollment.noStudentsFound")}
                </div>
              )}
            </div>
          </div>
        </div>
      </FormModal>

      <FormModal
        open={modal.type === "without-group"}
        title={t("admin.enrollment.withoutGroupModalTitle")}
        onClose={() => setModal({ type: null })}
        onSubmit={(event) => { event.preventDefault(); setModal({ type: null }); }}
        submitLabel={t("admin.actions.close")}
      >
        {withoutGroup.loading ? (
          <div className="rounded-xl bg-gray-50/50 py-10 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
            <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            {t("common.loading")}
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {withoutGroup.rows.length ? (
              withoutGroup.rows.map((student) => (
                <div key={student.id} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-50/20">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-extrabold text-indigo-700">
                    {(student.full_name || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-gray-900 text-sm truncate">{student.full_name}</div>
                      <span className="shrink-0 rounded-lg bg-slate-50 border border-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 tracking-wide font-mono">
                        {student.student_code}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                      <span>{student.email}</span>
                      <span className="text-gray-300">•</span>
                      <span className="font-medium text-indigo-600">{student.major || "—"}</span>
                      <span className="text-gray-300">•</span>
                      <span className="font-medium">{formatDate(student.enrolled_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-gray-50/60 p-10 text-center text-sm text-gray-400">
                <Info size={28} className="mx-auto text-gray-300 mb-2" />
                {t("admin.enrollment.noStudentsWithoutGroup")}
              </div>
            )}
          </div>
        )}
      </FormModal>

      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmAction?.forceRequired ? t("admin.enrollment.dropFromClassAndGroup") : t("admin.enrollment.dropFromClass")}
        subtitle={confirmAction?.forceRequired ? confirmAction.message : t("admin.enrollment.dropSubtitle")}
        variant="remove"
        color="red"
        yesLabel={confirmAction?.forceRequired ? t("admin.enrollment.forceDrop") : t("admin.enrollment.dropStudent")}
        onYes={() => updateStatus(!!confirmAction?.forceRequired)}
        onClose={() => setConfirmAction(null)}
      />
    </>
  );
}
