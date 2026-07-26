import { useEffect, useMemo, useState } from "react";
import { Archive, Eye, Lock, Plus, SquarePen, Trash2, Unlock, Info, FileSpreadsheet, Settings, FileDown } from "lucide-react";
import Dropdown from "@/components/ui/filter/DropDown";
import { useNavigate } from "react-router-dom";
import { assignmentService, projectSubmissionLookupService } from "@/api/adminProjectSubmission";
import { useToast } from "@/components/ui/Toast";
import { useAdminAssignments } from "@/hooks/admin/useAdminAssignments";
import { useAdminListSemesterFilters } from "@/hooks/admin/useAdminListSemesterFilters";
import { useAdminUrlQuerySync } from "@/hooks/admin/useAdminUrlQuerySync";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { AdminSemesterFilterGroup, FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import DeadlineBadge from "@/pages/admin/project-submission/components/DeadlineBadge";
import { useTranslation } from "@/context/TranslationContext";
import { countActiveAdminFilters } from "@/pages/admin/shared/filterUtils";
import {
  buildClassLabel,
  fetchAllAdminRows,
  getAssignmentStatusOptions,
  getDeadlineOptions,
  pageLimit,
  toDateTimeInputValue,
} from "@/pages/admin/project-submission/shared";
import { downloadCsv } from "@/utils/exportCsv";

const emptyForm = {
  class_id: "",
  title: "",
  description: "",
  deadline: "",
  max_score: 10,
  status: "open",
  required_file_types: "pdf,docx",
  max_file_size_mb: 20,
  max_files: 5,
  attachment_url: "",
  force: false,
};

export default function AdminAssignments() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const assignmentStatusOptions = useMemo(() => getAssignmentStatusOptions(t), [t]);
  const deadlineOptions = useMemo(() => getDeadlineOptions(t), [t]);
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", class_id: "", semester_id: "", status: "", deadline: "" });
  useAdminUrlQuerySync({
    query,
    setQuery,
    keys: ["page", "search", "semester_id", "class_id", "status", "deadline"],
  });
  const [lookups, setLookups] = useState({ classes: [], semesters: [] });
  const { semesterFilter, classOptions, listEnabled } = useAdminListSemesterFilters({
    semesters: lookups.semesters,
    classes: lookups.classes,
    buildClassLabel,
    setQuery,
    querySemesterId: query.semester_id,
  });
  const { rows, meta, loading, error, refetch } = useAdminAssignments(query, { enabled: listEnabled });
  const [modal, setModal] = useState({ type: null, assignment: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    projectSubmissionLookupService.getAll()
      .then((res) => setLookups(res?.data || { classes: [], semesters: [] }))
      .catch(() => setLookups({ classes: [], semesters: [] }));
  }, []);

  const formClassOptions = useMemo(() => (lookups.classes || []).map((item) => ({
    value: String(item.id),
    label: buildClassLabel(item),
  })), [lookups.classes]);

  const formStatusOptions = useMemo(() => ["open", "closed", "archived"].map((val) => ({
    value: val,
    label: t(`status.${val}`),
  })), [t]);

  const openCreate = () => {
    setForm({ ...emptyForm, class_id: query.class_id || "" });
    setModal({ type: "create", assignment: null });
  };

  const exportAll = async () => {
    try {
      const all = await fetchAllAdminRows(assignmentService.list, query);
      if (!all.length) {
        toast.error("Không có dữ liệu để export.");
        return;
      }
      downloadCsv({
        filename: `admin-assignments-${new Date().toISOString().slice(0, 10)}.csv`,
        headers: ["id", "title", "class_code", "semester_code", "status", "deadline", "max_score", "created_by_name"],
        rows: all.map((r) => ({
          id: r.id,
          title: r.title,
          class_code: r.class_code,
          semester_code: r.semester_code,
          status: r.status,
          deadline: r.deadline || "",
          max_score: r.max_score,
          created_by_name: r.created_by_name || "",
        })),
      });
    } catch (err) {
      toast.error(err.message || "Không export được dữ liệu.");
    }
  };

  const openEdit = (assignment) => {
    setForm({
      class_id: String(assignment.class_id || ""),
      title: assignment.title || "",
      description: assignment.description || "",
      deadline: toDateTimeInputValue(assignment.deadline),
      max_score: Number(assignment.max_score || 10),
      status: assignment.status || "open",
      required_file_types: assignment.required_file_types || "pdf,docx",
      max_file_size_mb: Number(assignment.max_file_size_mb || 20),
      max_files: Number(assignment.max_files || 5),
      attachment_url: assignment.attachment_url || "",
      force: false,
    });
    setModal({ type: "edit", assignment });
  };

  const validateForm = () => {
    if (!form.class_id || !form.title.trim() || !form.deadline) return "Vui lòng chọn lớp, nhập title và deadline.";
    if (Number(form.max_score) <= 0) return "max_score phải lớn hơn 0.";
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
        class_id: Number(form.class_id),
        max_score: Number(form.max_score),
        max_file_size_mb: Number(form.max_file_size_mb),
        max_files: Number(form.max_files),
      };
      if (modal.type === "create") {
        await assignmentService.create(payload);
        toast.success("Tạo assignment thành công");
      } else {
        await assignmentService.update(modal.assignment.id, payload);
        toast.success("Cập nhật assignment thành công");
      }
      setModal({ type: null, assignment: null });
      await refetch();
    } catch (err) {
      toast.error(err.message || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  };

  const runAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === "delete") await assignmentService.remove(confirmAction.assignment.id);
      else await assignmentService.updateStatus(confirmAction.assignment.id, confirmAction.status);
      toast.success(confirmAction.type === "delete" ? "Đã xóa assignment" : "Đã cập nhật assignment");
      setConfirmAction(null);
      await refetch();
    } catch (err) {
      toast.error(err.message || "Không thực hiện được thao tác assignment.");
    }
  };

  const columns = [
    { key: "title", label: "Title", render: (row) => <span className="font-semibold text-gray-900">{row.title}</span> },
    { key: "class", label: "Class", render: (row) => row.class_code },
    { key: "subject", label: "Subject", render: (row) => `${row.subject_code} - ${row.subject_name}` },
    { key: "semester", label: "Semester", render: (row) => row.semester_code },
    { key: "deadline", label: "Deadline", render: (row) => <DeadlineBadge deadline={row.deadline} status={row.status} /> },
    { key: "max_score", label: "Max", render: (row) => Number(row.max_score || 0) },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "created_by", label: "Created by", render: (row) => row.created_by_name || row.created_by || "—" },
    { key: "submitted_groups", label: "Submitted", render: (row) => Number(row.submitted_groups || 0) },
    { key: "pending_grading", label: "Need grade", render: (row) => Number(row.pending_grading || 0) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => navigate(`/admin/assignments/${row.id}`)} title="Chi tiết"><Eye size={16} /></ActionButton>
          <ActionButton onClick={() => openEdit(row)} title="Sửa"><SquarePen size={16} /></ActionButton>
          {row.status !== "open" ? <ActionButton onClick={() => setConfirmAction({ assignment: row, status: "open" })} title="Open" tone="green"><Unlock size={16} /></ActionButton> : null}
          {row.status === "open" ? <ActionButton onClick={() => setConfirmAction({ assignment: row, status: "closed" })} title="Close" tone="red"><Lock size={16} /></ActionButton> : null}
          {row.status !== "archived" ? <ActionButton onClick={() => setConfirmAction({ assignment: row, status: "archived" })} title="Archive" tone="red"><Archive size={16} /></ActionButton> : null}
          {row.status === "archived" ? <ActionButton onClick={() => setConfirmAction({ type: "delete", assignment: row })} title="Xóa" tone="red"><Trash2 size={16} /></ActionButton> : null}
        </div>
      ),
    },
  ];

  const activeFilterCount = countActiveAdminFilters(query);

  const clearFilters = () => {
    semesterFilter.reset();
    setQuery((prev) => ({
      ...prev,
      page: 1,
      search: "",
      class_id: "",
      status: "",
      deadline: "",
    }));
  };

  return (
    <>
      <FilterBar
        search={(
          <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder="Title, class..." />
        )}
        activeFilterCount={activeFilterCount}
        onClear={clearFilters}
        right={(
          <div className="flex items-center gap-2">
            <button type="button" onClick={exportAll} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <FileDown size={16} /> Export CSV
            </button>
            <button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover">
              <Plus size={16} /> Create assignment
            </button>
          </div>
        )}
      >
        <AdminSemesterFilterGroup
          filterYear={semesterFilter.filterYear}
          semesterId={semesterFilter.semesterId}
          yearOptions={semesterFilter.yearOptions}
          semesterOptions={semesterFilter.semesterOptions}
          onYearChange={semesterFilter.onYearChange}
          onSemesterChange={semesterFilter.onSemesterIdChange}
        />
        <FilterSelect label={t("filterLabels.class")} value={query.class_id} onChange={(class_id) => setQuery((prev) => ({ ...prev, page: 1, class_id }))} options={classOptions} />
        <FilterSelect label={t("filterLabels.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={assignmentStatusOptions} />
        <FilterSelect label={t("filterLabels.deadline")} value={query.deadline} onChange={(deadline) => setQuery((prev) => ({ ...prev, page: 1, deadline }))} options={deadlineOptions} />
      </FilterBar>

      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText="Chưa có assignment." />

      <FormModal open={["create", "edit"].includes(modal.type)} title={modal.type === "create" ? (t("common.confirm") === "Xác nhận" ? "Tạo bài tập mới" : "Create assignment") : (t("common.confirm") === "Xác nhận" ? "Chỉnh sửa bài tập" : "Edit assignment")} onClose={() => setModal({ type: null, assignment: null })} onSubmit={save} saving={saving}>
        <div className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-bg text-accent">
                <Info size={16} />
              </span>
              <h4 className="text-sm font-bold text-gray-800">
                {t("common.confirm") === "Xác nhận" ? "Thông tin cơ bản" : "Basic Information"}
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("common.confirm") === "Xác nhận" ? "Lớp học" : "Class"}>
                <Dropdown
                  label={t("common.confirm") === "Xác nhận" ? "Chọn lớp" : "Select class"}
                  value={form.class_id}
                  onChange={(value) => setForm({ ...form, class_id: value })}
                  options={formClassOptions}
                />
              </Field>
              <Field label={t("common.confirm") === "Xác nhận" ? "Tiêu đề" : "Title"}>
                <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </Field>
              <Field label="Deadline">
                <input type="datetime-local" className={inputClass} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
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
              <Field label={t("common.confirm") === "Xác nhận" ? "Điểm tối đa" : "Max score"}>
                <input type="number" min="0.01" step="0.01" className={inputClass} value={form.max_score} onChange={(e) => setForm({ ...form, max_score: e.target.value })} />
              </Field>
              <Field label={t("common.confirm") === "Xác nhận" ? "Đường dẫn đính kèm" : "Attachment URL"}>
                <input className={inputClass} value={form.attachment_url} onChange={(e) => setForm({ ...form, attachment_url: e.target.value })} />
              </Field>
            </div>
          </div>

          {/* Section 2: Submission Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Settings size={16} />
              </span>
              <h4 className="text-sm font-bold text-gray-800">
                {t("common.confirm") === "Xác nhận" ? "Cài đặt bài nộp" : "Submission Settings"}
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t("common.confirm") === "Xác nhận" ? "Loại tệp bắt buộc" : "Required file types"}>
                <input className={inputClass} value={form.required_file_types} onChange={(e) => setForm({ ...form, required_file_types: e.target.value })} placeholder="pdf,docx" />
              </Field>
              <Field label={t("common.confirm") === "Xác nhận" ? "Kích thước tệp tối đa (MB)" : "Max file size MB"}>
                <input type="number" min="1" className={inputClass} value={form.max_file_size_mb} onChange={(e) => setForm({ ...form, max_file_size_mb: e.target.value })} />
              </Field>
              <Field label={t("common.confirm") === "Xác nhận" ? "Số lượng tệp tối đa" : "Max files"}>
                <input type="number" min="1" className={inputClass} value={form.max_files} onChange={(e) => setForm({ ...form, max_files: e.target.value })} />
              </Field>
            </div>
          </div>

          {/* Section 3: Description */}
          <div className="space-y-4">
            <Field label={t("admin.fields.topicDesc", { defaultValue: "Mô tả" }) === "Mô tả đề tài" ? "Mô tả chi tiết" : "Description"}>
              <textarea className={inputClass} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>

          {modal.type === "edit" ? (
            <label className="flex items-center gap-2 text-sm font-semibold text-amber-700 sm:col-span-2">
              <input type="checkbox" checked={form.force} onChange={(e) => setForm({ ...form, force: e.target.checked })} />
              {t("common.confirm") === "Xác nhận" ? "Bắt buộc cập nhật điểm tối đa ngay cả khi đã có bài được chấm" : "Force update max_score even if submissions are already graded"}
            </label>
          ) : null}
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!confirmAction}
        title={
          confirmAction?.type === "delete"
            ? t("lecturer.assignmentsPage.deleteAssignmentTitle")
            : "Cập nhật trạng thái assignment"
        }
        subtitle={
          confirmAction?.type === "delete"
            ? `${confirmAction?.assignment?.title || ""} — ${t("lecturer.assignmentsPage.deleteSubtitle")}`
            : confirmAction?.assignment ? confirmAction.assignment.title : ""
        }
        variant={confirmAction?.type === "delete" ? "delete" : confirmAction?.status === "closed" || confirmAction?.status === "archived" ? "warning" : "confirm"}
        color={confirmAction?.type === "delete" || confirmAction?.status === "closed" || confirmAction?.status === "archived" ? "red" : "blue"}
        yesLabel={confirmAction?.type === "delete" ? (t("common.confirm") === "Xác nhận" ? "Xóa" : "Delete") : "Xác nhận"}
        onYes={runAction}
        onClose={() => setConfirmAction(null)}
      />
    </>
  );
}
