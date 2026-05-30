import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, Plus, Send, UserMinus, UsersRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { classService } from "@/api/adminAcademic";
import {
  enrollmentService,
  groupService,
  studentGroupLookupService,
} from "@/api/adminStudentGroup";
import {
  assignmentService,
  assignmentSubmissionService,
  checkpointService,
  checkpointSubmissionService,
} from "@/api/adminProjectSubmission";
import { useToast } from "@/components/ui/Toast";
import { selectAuthUser } from "@/store/slices/authSlice";
import { checkPermission } from "@/utils/permissions";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import DetailGrid from "@/pages/admin/academic/components/DetailGrid";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import { useTranslation } from "@/context/TranslationContext";
import { formatDate, formatDateOnly } from "@/pages/admin/academic/shared";
import WarningNote from "@/pages/admin/student-group/components/WarningNote";
import {
  buildStudentLabel,
  getEnrollmentStatusOptions,
  getGroupStatusOptions,
  pageLimit,
} from "@/pages/admin/student-group/shared";
import DeadlineBadge from "@/pages/admin/project-submission/components/DeadlineBadge";
import ClassActivityTab from "@/pages/admin/components/ClassActivityTab";
import useDocumentTitle from "@/hooks/useDocumentTitle";

const emptyEnrollmentForm = { student_id: "", status: "enrolled" };
const emptyGroupForm = {
  group_code: "",
  group_name: "",
  category: "",
  topic: "",
  topic_desc: "",
  max_members: 6,
  status: "forming",
};

function ClassStudentsTab({ classId, lookups, canWrite }) {
  const { t, language } = useTranslation();
  const enrollmentStatusOptions = useMemo(() => getEnrollmentStatusOptions(t), [t]);
  const toast = useToast();
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", status: "" });
  const [withoutGroup, setWithoutGroup] = useState(false);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({ type: null });
  const [form, setForm] = useState(emptyEnrollmentForm);
  const [saving, setSaving] = useState(false);
  const [confirmDrop, setConfirmDrop] = useState(null);
  const [bulkForm, setBulkForm] = useState({ student_ids: [] });
  const [sendingInviteId, setSendingInviteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (withoutGroup) {
        const res = await enrollmentService.listStudentsWithoutGroup(classId);
        setRows(res?.data || []);
        setMeta(null);
      } else {
        const res = await enrollmentService.list({ ...query, class_id: classId });
        setRows(res?.data || []);
        setMeta(res?.meta || null);
      }
    } catch (err) {
      setError(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setLoading(false);
    }
  }, [classId, query, withoutGroup, t]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setForm(emptyEnrollmentForm);
    setModal({ type: "add" });
  };

  const saveEnrollment = async (event) => {
    event.preventDefault();
    if (!form.student_id) {
      toast.error(t("common.confirm") === "Xác nhận" ? "Vui lòng chọn sinh viên." : "Please select student.");
      return;
    }
    setSaving(true);
    try {
      await enrollmentService.create({
        class_id: Number(classId),
        student_id: Number(form.student_id),
        status: form.status,
      });
      toast.success(t("admin.toasts.createSuccess"));
      setModal({ type: null });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const dropStudent = async (force = false) => {
    if (!confirmDrop) return;
    try {
      await enrollmentService.updateStatus(confirmDrop.id, "dropped", force);
      toast.success(t("admin.toasts.statusSuccess"));
      setConfirmDrop(null);
      await load();
    } catch (err) {
      if (!force && String(err.message || "").includes("force=true")) {
        setConfirmDrop((prev) => ({ ...prev, forceRequired: true, message: err.message }));
      } else {
        toast.error(err.message || t("admin.toasts.actionFailed"));
      }
    }
  };

  const openBulk = () => {
    setBulkForm({ student_ids: [] });
    setModal({ type: "bulk" });
  };

  const toggleBulkStudent = (studentId) => {
    setBulkForm((prev) => ({
      ...prev,
      student_ids: prev.student_ids.includes(studentId)
        ? prev.student_ids.filter((sid) => sid !== studentId)
        : [...prev.student_ids, studentId],
    }));
  };

  const saveBulk = async (event) => {
    event.preventDefault();
    if (!bulkForm.student_ids.length) {
      toast.error(t("common.confirm") === "Xác nhận" ? "Chọn ít nhất một sinh viên." : "Select at least one student.");
      return;
    }
    setSaving(true);
    try {
      const res = await enrollmentService.bulkCreate({ class_id: Number(classId), student_ids: bulkForm.student_ids });
      const results = res?.data?.results || [];
      const ok = results.filter((item) => item.success).length;
      const fail = results.length - ok;
      toast.success(
        t("common.confirm") === "Xác nhận"
          ? `Đã thêm ${ok} sinh viên${fail ? `, ${fail} lỗi` : ""}.`
          : `Added ${ok} student(s)${fail ? `, ${fail} failed` : ""}.`,
      );
      setModal({ type: null });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

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

  const enrolledStudentIds = useMemo(
    () => new Set((rows || []).map((row) => Number(row.student_id)).filter(Boolean)),
    [rows],
  );

  const bulkCandidates = useMemo(
    () => (lookups.students || []).filter((student) => !enrolledStudentIds.has(Number(student.id))),
    [lookups.students, enrolledStudentIds],
  );

  const normalColumns = useMemo(() => [
    { key: "student_code", label: t("admin.fields.studentCode"), render: (row) => <span className="font-mono text-xs font-bold text-gray-700">{row.student_code}</span> },
    { key: "student_name", label: t("admin.fields.fullName"), render: (row) => <span className="font-semibold text-gray-900">{row.student_name}</span> },
    { key: "email", label: t("admin.fields.email") },
    { key: "major", label: t("admin.fields.major"), render: (row) => row.major || "—" },
    { key: "status", label: t("admin.fields.enrolledCount", { defaultValue: "Enrollment" }) === "Đăng ký" ? "Đăng ký" : "Enrollment", render: (row) => <StatusBadge value={row.status} /> },
    { key: "group_name", label: t("admin.fields.group"), render: (row) => row.group_name || <span className="text-gray-400">{t("common.confirm") === "Xác nhận" ? "Chưa có nhóm" : "No group"}</span> },
    { key: "enrolled_at", label: t("common.confirm") === "Xác nhận" ? "Ngày tham gia" : "Joined", render: (row) => formatDate(row.enrolled_at) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          {canWrite && !row.user_id && row.status !== "dropped" ? (
            <ActionButton
              onClick={() => sendInvite(row)}
              title={t("common.confirm") === "Xác nhận" ? "Gửi invite kích hoạt" : "Send activation invite"}
              disabled={sendingInviteId === row.id}
            >
              <Send size={16} />
            </ActionButton>
          ) : null}
          {canWrite && row.status !== "dropped" ? <ActionButton onClick={() => setConfirmDrop(row)} title="Drop" tone="red"><UserMinus size={16} /></ActionButton> : null}
        </div>
      ),
    },
  ], [t, canWrite, sendingInviteId]);

  const withoutGroupColumns = useMemo(() => [
    { key: "student_code", label: t("admin.fields.studentCode"), render: (row) => <span className="font-mono text-xs font-bold text-gray-700">{row.student_code}</span> },
    { key: "full_name", label: t("admin.fields.fullName"), render: (row) => <span className="font-semibold text-gray-900">{row.full_name}</span> },
    { key: "email", label: t("admin.fields.email") },
    { key: "major", label: t("admin.fields.major"), render: (row) => row.major || "—" },
    { key: "enrollment_status", label: t("admin.fields.enrolledCount", { defaultValue: "Enrollment" }) === "Đăng ký" ? "Đăng ký" : "Enrollment", render: (row) => <StatusBadge value={row.enrollment_status} /> },
    { key: "enrolled_at", label: t("common.confirm") === "Xác nhận" ? "Ngày tham gia" : "Joined", render: (row) => formatDate(row.enrolled_at) },
  ], [t]);

  return (
    <>
      <FilterBar
        right={canWrite ? (
          <>
            <button type="button" onClick={() => setWithoutGroup((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer">
              <UsersRound size={16} /> {withoutGroup ? (t("common.confirm") === "Xác nhận" ? "Tất cả sinh viên" : "All students") : (t("common.confirm") === "Xác nhận" ? "Chưa có nhóm" : "Without group")}
            </button>
            <button type="button" onClick={openBulk} className="inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer">
              {t("common.confirm") === "Xác nhận" ? "Thêm hàng loạt" : "Bulk add"}
            </button>
            <button type="button" onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer">
              <Plus size={16} /> {t("admin.actions.create")}
            </button>
          </>
        ) : null}
      >
        {!withoutGroup ? (
          <>
            <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("common.confirm") === "Xác nhận" ? "MSSV, tên, email..." : "Code, name, email..."} />
            <FilterSelect label={t("admin.fields.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={enrollmentStatusOptions} />
          </>
        ) : null}
      </FilterBar>

      <AdminTable
        columns={withoutGroup ? withoutGroupColumns : normalColumns}
        rows={rows}
        loading={loading}
        error={error}
        meta={meta}
        onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))}
        emptyText={t("common.noData")}
      />

      <FormModal open={modal.type === "add"} title={t("common.confirm") === "Xác nhận" ? "Thêm sinh viên vào lớp" : "Add student to class"} onClose={() => setModal({ type: null })} onSubmit={saveEnrollment} saving={saving}>
        <div className="space-y-4">
          <Field label={t("admin.fields.fullName", { defaultValue: "Sinh viên" }) === "Họ và tên" ? "Sinh viên" : "Student"}>
            <select className={inputClass} value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} required>
              <option value="">{t("common.confirm") === "Xác nhận" ? "Chọn sinh viên" : "Select student"}</option>
              {(lookups.students || []).map((student) => <option key={student.id} value={student.id}>{buildStudentLabel(student)}</option>)}
            </select>
          </Field>
          <Field label={t("admin.fields.status")}>
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="enrolled">{t("status.enrolled")}</option>
              <option value="completed">{t("status.completed")}</option>
            </select>
          </Field>
          <WarningNote>
            {t("common.confirm") === "Xác nhận"
              ? "Hệ thống tự động chặn trùng và không cho phép thêm vào lớp đã hoàn thành/lưu trữ."
              : "System prevents duplicates and additions to completed/archived classes."}
          </WarningNote>
        </div>
      </FormModal>

      <FormModal
        open={modal.type === "bulk"}
        title={t("common.confirm") === "Xác nhận" ? "Thêm hàng loạt sinh viên" : "Bulk add students"}
        onClose={() => setModal({ type: null })}
        onSubmit={saveBulk}
        saving={saving}
      >
        <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-100 p-2">
          {bulkCandidates.length ? bulkCandidates.map((student) => (
            <label key={student.id} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={bulkForm.student_ids.includes(student.id)} onChange={() => toggleBulkStudent(student.id)} />
              <span className="font-semibold text-gray-800">{buildStudentLabel(student)}</span>
            </label>
          )) : (
            <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-400">
              {t("common.confirm") === "Xác nhận" ? "Không còn sinh viên khả dụng để thêm." : "No students available to add."}
            </div>
          )}
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!confirmDrop}
        title={confirmDrop?.forceRequired ? (t("common.confirm") === "Xác nhận" ? "Drop sinh viên khỏi lớp và nhóm?" : "Drop student from class and group?") : (t("common.confirm") === "Xác nhận" ? "Drop sinh viên khỏi lớp" : "Drop student from class")}
        subtitle={confirmDrop?.forceRequired ? confirmDrop.message : (t("common.confirm") === "Xác nhận" ? "Nếu sinh viên đang thuộc nhóm, hệ thống yêu cầu force drop để gỡ khỏi nhóm trước." : "If the student belongs to a group, backend requires force drop validation.")}
        variant="remove"
        color="red"
        yesLabel={confirmDrop?.forceRequired ? "Force drop" : "Drop"}
        onYes={() => dropStudent(!!confirmDrop?.forceRequired)}
        onClose={() => setConfirmDrop(null)}
      />
    </>
  );
}

function ClassGroupsTab({ classId, cls, canWrite }) {
  const { t } = useTranslation();
  const groupStatusOptions = useMemo(() => getGroupStatusOptions(t), [t]);
  const navigate = useNavigate();
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", status: "" });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({ type: null });
  const [form, setForm] = useState({ ...emptyGroupForm, max_members: Number(cls.max_group_members || 6) });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await groupService.list({ ...query, class_id: classId });
      setRows(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setLoading(false);
    }
  }, [classId, query, t]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm({ ...emptyGroupForm, max_members: Number(cls.max_group_members || 6) });
    setModal({ type: "create" });
  };

  const saveGroup = async (event) => {
    event.preventDefault();
    if (!form.group_code.trim() || !form.group_name.trim()) {
      toast.error(t("common.confirm") === "Xác nhận" ? "Vui lòng nhập mã nhóm và tên nhóm." : "Please enter group code and name.");
      return;
    }
    if (form.status === "active" && !form.topic.trim()) {
      toast.error(t("common.confirm") === "Xác nhận" ? "Đề tài bắt buộc nhập khi nhóm hoạt động." : "Topic is required when active.");
      return;
    }
    setSaving(true);
    try {
      await groupService.create({
        ...form,
        class_id: Number(classId),
        group_code: form.group_code.toUpperCase(),
        max_members: Number(form.max_members),
      });
      toast.success(t("admin.toasts.createSuccess"));
      setModal({ type: null });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => [
    { key: "group_code", label: t("admin.fields.groupCode"), render: (row) => <span className="font-mono text-xs font-bold text-indigo-700">{row.group_code}</span> },
    { key: "group_name", label: t("admin.fields.groupName"), render: (row) => <span className="font-semibold text-gray-900">{row.group_name}</span> },
    { key: "topic", label: t("admin.fields.topic"), render: (row) => row.topic || "—" },
    { key: "category", label: t("admin.fields.category"), render: (row) => row.category || "—" },
    { key: "mentor_name", label: t("admin.fields.lecturer", { defaultValue: "Mentor" }) === "Giảng viên" ? "Mentor" : "Mentor", render: (row) => row.mentor_name || "—" },
    { key: "member_count", label: t("admin.fields.membersCount"), render: (row) => `${Number(row.member_count || 0)}/${Number(row.max_members || 0)}` },
    { key: "leader_name", label: t("common.confirm") === "Xác nhận" ? "Trưởng nhóm" : "Leader", render: (row) => row.leader_name || "—" },
    { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
    {
      key: "actions",
      label: "",
      render: (row) => <ActionButton onClick={() => navigate(`/admin/groups/${row.id}`)} title={t("admin.actions.detail")}><Eye size={16} /></ActionButton>,
    },
  ], [t, navigate]);

  return (
    <>
      <FilterBar
        right={canWrite ? (
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer">
            <Plus size={16} /> {t("admin.actions.create")}
          </button>
        ) : null}
      >
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("common.confirm") === "Xác nhận" ? "Mã nhóm, tên nhóm, đề tài..." : "Code, name, topic..."} />
        <FilterSelect label={t("admin.fields.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={groupStatusOptions} />
      </FilterBar>

      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText={t("common.noData")} />

      <FormModal open={modal.type === "create"} title={t("admin.actions.create") + " Group"} onClose={() => setModal({ type: null })} onSubmit={saveGroup} saving={saving}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("admin.fields.groupCode")}><input className={inputClass} value={form.group_code} onChange={(e) => setForm({ ...form, group_code: e.target.value.toUpperCase() })} required /></Field>
          <Field label={t("admin.fields.groupName")}><input className={inputClass} value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} required /></Field>
          <Field label={t("admin.fields.category")}><input className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          <Field label={t("admin.fields.topic")}><input className={inputClass} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></Field>
          <Field label="Max members"><input type="number" min={cls.min_group_members || 1} max={cls.max_group_members || 20} className={inputClass} value={form.max_members} onChange={(e) => setForm({ ...form, max_members: e.target.value })} required /></Field>
          <Field label={t("admin.fields.status")}>
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="forming">Forming</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("admin.fields.topicDesc")}><textarea className={inputClass} rows={3} value={form.topic_desc} onChange={(e) => setForm({ ...form, topic_desc: e.target.value })} /></Field>
          </div>
          <div className="sm:col-span-2">
            <WarningNote>
              {t("common.confirm") === "Xác nhận"
                ? `Nhóm được tạo từ trang lớp học này sẽ tự động gán mã lớp: ${cls.class_code}. Giới hạn thành viên: ${cls.min_group_members}-${cls.max_group_members}.`
                : `Group created under this class automatically inherits class: ${cls.class_code}. Group size bounds: ${cls.min_group_members}-${cls.max_group_members}.`}
            </WarningNote>
          </div>
        </div>
      </FormModal>
    </>
  );
}

function ClassCheckpointsTab({ classId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    checkpointService.list({ class_id: classId, limit: 100 })
      .then((res) => {
        if (mounted) setRows(res?.data || []);
      })
      .catch((err) => {
        if (mounted) setError(err.message || t("admin.toasts.actionFailed"));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [classId, t]);

  const columns = useMemo(() => [
    { key: "title", label: t("admin.fields.topicDesc", { defaultValue: "Tiêu đề" }) === "Mô tả đề tài" ? "Tiêu đề" : "Title", render: (row) => <span className="font-semibold text-gray-900">{row.title}</span> },
    { key: "order_index", label: t("common.confirm") === "Xác nhận" ? "Thứ tự" : "Order", render: (row) => Number(row.order_index || 0) },
    { key: "deadline", label: "Deadline", render: (row) => <DeadlineBadge deadline={row.deadline} status={row.status} /> },
    { key: "max_score", label: t("common.confirm") === "Xác nhận" ? "Điểm tối đa" : "Max score", render: (row) => Number(row.max_score || 0) },
    { key: "weight", label: t("common.confirm") === "Xác nhận" ? "Trọng số" : "Weight", render: (row) => Number(row.weight || 0) },
    { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "submitted_groups", label: t("common.confirm") === "Xác nhận" ? "Đã nộp" : "Submitted", render: (row) => Number(row.submitted_groups || 0) },
    { key: "pending_grading", label: t("common.confirm") === "Xác nhận" ? "Cần chấm" : "Need grade", render: (row) => Number(row.pending_grading || 0) },
    { key: "actions", label: "", render: (row) => <ActionButton onClick={() => navigate(`/admin/checkpoints/${row.id}`)} title={t("admin.actions.detail")}><Eye size={16} /></ActionButton> },
  ], [t, navigate]);
  return <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("common.noData")} />;
}

function ClassAssignmentsTab({ classId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    assignmentService.list({ class_id: classId, limit: 100 })
      .then((res) => {
        if (mounted) setRows(res?.data || []);
      })
      .catch((err) => {
        if (mounted) setError(err.message || t("admin.toasts.actionFailed"));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [classId, t]);

  const columns = useMemo(() => [
    { key: "title", label: t("admin.fields.topicDesc", { defaultValue: "Tiêu đề" }) === "Mô tả đề tài" ? "Tiêu đề" : "Title", render: (row) => <span className="font-semibold text-gray-900">{row.title}</span> },
    { key: "deadline", label: "Deadline", render: (row) => <DeadlineBadge deadline={row.deadline} status={row.status} /> },
    { key: "max_score", label: t("common.confirm") === "Xác nhận" ? "Điểm tối đa" : "Max score", render: (row) => Number(row.max_score || 0) },
    { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "submitted_groups", label: t("common.confirm") === "Xác nhận" ? "Đã nộp" : "Submitted", render: (row) => Number(row.submitted_groups || 0) },
    { key: "pending_grading", label: t("common.confirm") === "Xác nhận" ? "Cần chấm" : "Need grade", render: (row) => Number(row.pending_grading || 0) },
    { key: "actions", label: "", render: (row) => <ActionButton onClick={() => navigate(`/admin/assignments/${row.id}`)} title={t("admin.actions.detail")}><Eye size={16} /></ActionButton> },
  ], [t, navigate]);
  return <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("common.noData")} />;
}

function ClassSubmissionsTab({ classId }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      checkpointSubmissionService.list({ class_id: classId, limit: 100 }),
      assignmentSubmissionService.list({ class_id: classId, limit: 100 }),
    ])
      .then(([checkpointRes, assignmentRes]) => {
        if (!mounted) return;
        const checkpointRows = (checkpointRes?.data || []).map((row) => ({
          ...row,
          source: "checkpoint",
          title: row.checkpoint_title,
        }));
        const assignmentRows = (assignmentRes?.data || []).map((row) => ({
          ...row,
          source: "assignment",
          title: row.assignment_title,
          display_status: row.status,
        }));
        setRows([...checkpointRows, ...assignmentRows]);
      })
      .catch((err) => {
        if (mounted) setError(err.message || t("admin.toasts.actionFailed"));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [classId, t]);

  const columns = useMemo(() => [
    { key: "source", label: t("common.confirm") === "Xác nhận" ? "Loại" : "Type", render: (row) => <StatusBadge value={row.source} /> },
    { key: "title", label: t("admin.fields.topicDesc", { defaultValue: "Tiêu đề" }) === "Mô tả đề tài" ? "Tiêu đề" : "Title", render: (row) => <span className="font-semibold text-gray-900">{row.title}</span> },
    { key: "group", label: t("admin.fields.group"), render: (row) => `${row.group_code} - ${row.group_name}` },
    { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.display_status || row.status} /> },
    { key: "submitted_at", label: t("common.confirm") === "Xác nhận" ? "Ngày nộp" : "Submitted", render: (row) => formatDate(row.submitted_at) },
    { key: "is_late", label: t("common.confirm") === "Xác nhận" ? "Trễ hạn" : "Late", render: (row) => Number(row.is_late || 0) ? <StatusBadge value="late" /> : "—" },
    { key: "score", label: t("common.confirm") === "Xác nhận" ? "Điểm" : "Score", render: (row) => row.score ?? "—" },
    { key: "graded_at", label: t("common.confirm") === "Xác nhận" ? "Ngày chấm" : "Graded", render: (row) => formatDate(row.graded_at) },
  ], [t]);
  return <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("common.noData")} />;
}

export default function AdminClassDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const authUser = useSelector(selectAuthUser);
  const canWrite = checkPermission(authUser, "admin.classes.update");
  const [cls, setCls] = useState(null);
  const [lookups, setLookups] = useState({ students: [] });
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.all([
      classService.get(id),
      studentGroupLookupService.getAll().catch(() => ({ data: { students: [] } })),
    ])
      .then(([classRes, lookupRes]) => {
        if (!mounted) return;
        setCls(classRes?.data || null);
        setLookups(lookupRes?.data || { students: [] });
      })
      .catch((err) => {
        if (mounted) setError(err.message || t("admin.toasts.actionFailed"));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [id, t]);

  const tabs = useMemo(() => [
    { key: "overview", label: t("common.confirm") === "Xác nhận" ? "Tổng quan" : "Overview" },
    { key: "students", label: t("nav.students") },
    { key: "groups", label: t("nav.studentGroups") },
    { key: "checkpoints", label: "Checkpoints" },
    { key: "assignments", label: t("nav.assignments") },
    { key: "submissions", label: t("common.confirm") === "Xác nhận" ? "Bài nộp" : "Submissions" },
    { key: "activity", label: t("common.confirm") === "Xác nhận" ? "Hoạt động" : "Activity" },
  ], [t]);

  const title = useMemo(() => {
    if (!cls) return t("common.confirm") === "Xác nhận" ? "Chi tiết lớp học" : "Class details";
    return cls.class_name ? `${cls.class_code} - ${cls.class_name}` : cls.class_code;
  }, [cls, t]);
  useDocumentTitle(cls ? title : null, 1);

  if (loading) {
    return <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400 shadow-sm">{t("common.loading")}</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-sm font-medium text-red-600">{error}</div>;
  }

  if (!cls) {
    return <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400 shadow-sm">{t("common.noData")}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <button type="button" onClick={() => navigate("/admin/academic/classes")} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 cursor-pointer">
            <ArrowLeft size={16} /> {t("common.confirm") === "Xác nhận" ? "Lớp học" : "Classes"}
          </button>
          <h2 className="truncate text-xl font-black text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{cls.subject_code} - {cls.subject_name}</p>
        </div>
        <StatusBadge value={cls.status} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`h-10 rounded-xl px-4 text-sm font-bold transition-colors cursor-pointer ${
                activeTab === tab.key ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-base font-black text-gray-900">{t("common.confirm") === "Xác nhận" ? "Thông tin Tổng quan" : "Class Overview"}</h3>
            <DetailGrid items={[
              [t("admin.fields.classCode"), cls.class_code],
              [t("admin.fields.fullName", { defaultValue: "Tên lớp" }) === "Họ và tên" ? "Tên lớp" : "Class name", cls.class_name || "—"],
              [t("admin.fields.status"), cls.status],
              [t("admin.fields.maxStudents"), Number(cls.max_students || 0)],
              [t("common.confirm") === "Xác nhận" ? "Giới hạn số thành viên nhóm" : "Group size rule", `${cls.min_group_members}-${cls.max_group_members}`],
              [t("common.confirm") === "Xác nhận" ? "Người tạo" : "Created by", cls.created_by_name || cls.created_by || "—"],
              [t("common.created"), formatDate(cls.created_at)],
              [t("common.updated"), formatDate(cls.updated_at)],
            ]} />
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-black text-gray-900">{t("common.confirm") === "Xác nhận" ? "Thông tin Học kỳ & Giảng viên" : "Academic Info"}</h3>
              <DetailGrid items={[
                [t("nav.subjects"), `${cls.subject_code} - ${cls.subject_name}`],
                [t("common.confirm") === "Xác nhận" ? "Số tín chỉ" : "Credits", Number(cls.credits || 0)],
                [t("admin.fields.semester"), `${cls.semester_code} - ${cls.semester_name}`],
                [t("common.confirm") === "Xác nhận" ? "Trạng thái học kỳ" : "Semester status", cls.semester_status],
                [t("common.confirm") === "Xác nhận" ? "Thời gian" : "Date range", `${formatDateOnly(cls.start_date)} - ${formatDateOnly(cls.end_date)}`],
                [t("admin.fields.lecturer"), cls.lecturer_name || "—"],
              ]} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{t("nav.students")}</p>
                <p className="mt-2 text-3xl font-black text-gray-900">{Number(cls.enrolled_count || 0)}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{t("nav.studentGroups")}</p>
                <p className="mt-2 text-3xl font-black text-gray-900">{Number(cls.group_count || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "students" ? <ClassStudentsTab classId={id} lookups={lookups} canWrite={canWrite} /> : null}
      {activeTab === "groups" ? <ClassGroupsTab classId={id} cls={cls} canWrite={canWrite} /> : null}
      {activeTab === "checkpoints" ? <ClassCheckpointsTab classId={id} /> : null}
      {activeTab === "assignments" ? <ClassAssignmentsTab classId={id} /> : null}
      {activeTab === "submissions" ? <ClassSubmissionsTab classId={id} /> : null}
      {activeTab === "activity" ? <ClassActivityTab classCode={cls.class_code} /> : null}
    </div>
  );
}
