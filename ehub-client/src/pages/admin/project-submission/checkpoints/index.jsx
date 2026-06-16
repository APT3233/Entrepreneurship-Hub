import { useEffect, useMemo, useState } from "react";
import { Archive, Copy, Eye, Lock, Plus, SquarePen, Trash2, Unlock, Info, Settings, FileDown } from "lucide-react";
import Dropdown from "@/components/ui/filter/DropDown";
import { useNavigate } from "react-router-dom";
import { checkpointService, projectSubmissionLookupService } from "@/api/adminProjectSubmission";
import { useToast } from "@/components/ui/Toast";
import { useAdminCheckpoints } from "@/hooks/admin/useAdminCheckpoints";
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
  formatDate,
  fetchAllAdminRows,
  getCheckpointStatusOptions,
  getDeadlineOptions,
  pageLimit,
  toDateTimeInputValue,
  toCheckpointOpenAtInput,
  resolveCheckpointOpenAt,
} from "@/pages/admin/project-submission/shared";
import { downloadCsv } from "@/utils/exportCsv";

const emptyForm = {
  class_id: "",
  title: "",
  description: "",
  order_index: 1,
  deadline: "",
  open_at: "",
  max_score: 10,
  weight: 1,
  required_file_types: "",
  max_file_size_mb: 20,
  max_files: 5,
  attachment_url: "",
  status: "draft",
  force: false,
};

export default function AdminCheckpoints() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const checkpointStatusOptions = useMemo(() => getCheckpointStatusOptions(t), [t]);
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
  const { rows, meta, loading, error, refetch } = useAdminCheckpoints(query, { enabled: listEnabled });
  const [modal, setModal] = useState({ type: null, checkpoint: null });
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

  const formStatusOptions = useMemo(() => ["draft", "open", "closed", "archived"].map((val) => ({
    value: val,
    label: t(`status.${val}`),
  })), [t]);

  const openCreate = () => {
    setForm({ ...emptyForm, class_id: query.class_id || "" });
    setModal({ type: "create", checkpoint: null });
  };

  const exportAll = async () => {
    try {
      const all = await fetchAllAdminRows(checkpointService.list, query);
      if (!all.length) {
        toast.error("Không có dữ liệu để export.");
        return;
      }
      downloadCsv({
        filename: `admin-checkpoints-${new Date().toISOString().slice(0, 10)}.csv`,
        headers: ["id", "title", "class_code", "semester_code", "order_index", "status", "open_at", "deadline", "max_score", "weight"],
        rows: all.map((r) => ({
          id: r.id,
          title: r.title,
          class_code: r.class_code,
          semester_code: r.semester_code,
          order_index: r.order_index,
          status: r.status,
          open_at: resolveCheckpointOpenAt(r) || r.open_at || "",
          deadline: r.deadline || "",
          max_score: r.max_score,
          weight: r.weight,
        })),
      });
    } catch (err) {
      toast.error(err.message || "Không export được dữ liệu.");
    }
  };

  const openEdit = (checkpoint) => {
    setForm({
      class_id: String(checkpoint.class_id || ""),
      title: checkpoint.title || "",
      description: checkpoint.description || "",
      order_index: Number(checkpoint.order_index || 1),
      deadline: toDateTimeInputValue(checkpoint.deadline),
      open_at: toCheckpointOpenAtInput(checkpoint),
      max_score: Number(checkpoint.max_score || 10),
      weight: Number(checkpoint.weight || 1),
      required_file_types: checkpoint.required_file_types || "",
      max_file_size_mb: Number(checkpoint.max_file_size_mb || 20),
      max_files: Number(checkpoint.max_files || 5),
      attachment_url: checkpoint.attachment_url || "",
      status: checkpoint.status || "draft",
      force: false,
    });
    setModal({ type: "edit", checkpoint });
  };

  const validateForm = () => {
    if (!form.class_id || !form.title.trim() || !form.deadline) return "Vui lòng chọn lớp, nhập title và deadline.";
    if (Number(form.max_score) <= 0) return "max_score phải lớn hơn 0.";
    if (Number(form.weight) < 0) return "weight phải >= 0.";
    if (Number(form.max_files) <= 0) return "max_files phải lớn hơn 0.";
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
        order_index: Number(form.order_index),
        max_score: Number(form.max_score),
        weight: Number(form.weight),
        max_file_size_mb: Number(form.max_file_size_mb),
        max_files: Number(form.max_files),
        deadline: new Date(form.deadline).toISOString(),
        open_at: form.open_at ? new Date(form.open_at).toISOString() : null,
      };
      if (modal.type === "create") {
        await checkpointService.create(payload);
        toast.success("Tạo checkpoint thành công");
      } else {
        await checkpointService.update(modal.checkpoint.id, payload);
        toast.success("Cập nhật checkpoint thành công");
      }
      setModal({ type: null, checkpoint: null });
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
      if (confirmAction.type === "duplicate") await checkpointService.duplicate(confirmAction.checkpoint.id);
      else if (confirmAction.type === "delete") await checkpointService.remove(confirmAction.checkpoint.id);
      else await checkpointService.updateStatus(confirmAction.checkpoint.id, confirmAction.status);
      toast.success(confirmAction.type === "delete" ? "Đã xóa checkpoint" : "Đã cập nhật checkpoint");
      setConfirmAction(null);
      await refetch();
    } catch (err) {
      toast.error(err.message || "Không thực hiện được thao tác checkpoint.");
    }
  };

  const columns = [
    { key: "title", label: "Title", render: (row) => <span className="font-semibold text-gray-900">{row.title}</span> },
    { key: "class", label: "Class", render: (row) => row.class_code },
    { key: "subject", label: "Subject", render: (row) => `${row.subject_code} - ${row.subject_name}` },
    { key: "semester", label: "Semester", render: (row) => row.semester_code },
    { key: "order_index", label: "Order", render: (row) => Number(row.order_index || 0) },
    { key: "deadline", label: "Deadline", render: (row) => <DeadlineBadge deadline={row.deadline} status={row.status} /> },
    { key: "open_at", label: "Open at", render: (row) => formatDate(resolveCheckpointOpenAt(row) || row.open_at) },
    { key: "max_score", label: "Max", render: (row) => Number(row.max_score || 0) },
    { key: "weight", label: "Weight", render: (row) => Number(row.weight || 0) },
    { key: "files", label: "Files", render: (row) => `${row.required_file_types || "any"} · ${row.max_files} files · ${row.max_file_size_mb}MB` },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "submitted_groups", label: "Submitted", render: (row) => Number(row.submitted_groups || 0) },
    { key: "pending_grading", label: "Need grade", render: (row) => Number(row.pending_grading || 0) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => navigate(`/admin/checkpoints/${row.id}`)} title="Chi tiết"><Eye size={16} /></ActionButton>
          <ActionButton onClick={() => openEdit(row)} title="Sửa"><SquarePen size={16} /></ActionButton>
          <ActionButton onClick={() => setConfirmAction({ type: "duplicate", checkpoint: row })} title="Duplicate" tone="blue"><Copy size={16} /></ActionButton>
          {row.status !== "open" ? <ActionButton onClick={() => setConfirmAction({ checkpoint: row, status: "open" })} title="Open" tone="green"><Unlock size={16} /></ActionButton> : null}
          {row.status === "open" ? <ActionButton onClick={() => setConfirmAction({ checkpoint: row, status: "closed" })} title="Close" tone="red"><Lock size={16} /></ActionButton> : null}
          {row.status !== "archived" ? <ActionButton onClick={() => setConfirmAction({ checkpoint: row, status: "archived" })} title="Archive" tone="red"><Archive size={16} /></ActionButton> : null}
          {row.status === "archived" ? <ActionButton onClick={() => setConfirmAction({ type: "delete", checkpoint: row })} title="Xóa" tone="red"><Trash2 size={16} /></ActionButton> : null}
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
            <button type="button" onClick={exportAll} className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <FileDown size={16} /> Export CSV
            </button>
            <button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700">
              <Plus size={16} /> Create checkpoint
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
        <FilterSelect label={t("filterLabels.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={checkpointStatusOptions} />
        <FilterSelect label={t("filterLabels.deadline")} value={query.deadline} onChange={(deadline) => setQuery((prev) => ({ ...prev, page: 1, deadline }))} options={deadlineOptions} />
      </FilterBar>

      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText="Chưa có checkpoint." />

      <FormModal open={["create", "edit"].includes(modal.type)} title={modal.type === "create" ? (t("common.confirm") === "Xác nhận" ? "Tạo checkpoint mới" : "Create checkpoint") : (t("common.confirm") === "Xác nhận" ? "Chỉnh sửa checkpoint" : "Edit checkpoint")} onClose={() => setModal({ type: null, checkpoint: null })} onSubmit={save} saving={saving}>
        <div className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
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
              <Field label={t("common.confirm") === "Xác nhận" ? "Thứ tự" : "Order"}>
                <input type="number" min="1" className={inputClass} value={form.order_index} onChange={(e) => setForm({ ...form, order_index: e.target.value })} />
              </Field>
              <Field label="Deadline">
                <input type="datetime-local" className={inputClass} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
              </Field>
              <Field label={t("common.confirm") === "Xác nhận" ? "Thời gian mở" : "Open at"}>
                <input type="datetime-local" className={inputClass} value={form.open_at} onChange={(e) => setForm({ ...form, open_at: e.target.value })} />
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
              <Field label={t("common.confirm") === "Xác nhận" ? "Trọng số" : "Weight"}>
                <input type="number" min="0" step="0.01" className={inputClass} value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label={t("common.confirm") === "Xác nhận" ? "Đường dẫn đính kèm" : "Attachment URL"}>
                  <input className={inputClass} value={form.attachment_url} onChange={(e) => setForm({ ...form, attachment_url: e.target.value })} />
                </Field>
              </div>
            </div>
          </div>

          {/* Section 2: Submission Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Settings size={16} />
              </span>
              <h4 className="text-sm font-bold text-gray-800">
                {t("common.confirm") === "Xác nhận" ? "Cài đặt bài nộp" : "Submission Settings"}
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t("common.confirm") === "Xác nhận" ? "Loại tệp bắt buộc" : "Required file types"}>
                <input className={inputClass} value={form.required_file_types} onChange={(e) => setForm({ ...form, required_file_types: e.target.value })} placeholder="pdf,docx,pptx" />
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
              {t("common.confirm") === "Xác nhận" ? "Bắt buộc cập nhật điểm tối đa/trọng số ngay cả khi đã có bài được chấm" : "Force update max_score/weight even if submissions are already graded"}
            </label>
          ) : null}
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!confirmAction}
        title={
          confirmAction?.type === "delete"
            ? t("lecturer.assignmentsPage.deleteCheckpointTitle")
            : confirmAction?.type === "duplicate"
              ? "Duplicate checkpoint"
              : "Cập nhật trạng thái checkpoint"
        }
        subtitle={
          confirmAction?.type === "delete"
            ? `${confirmAction?.checkpoint?.title || ""} — ${t("lecturer.assignmentsPage.deleteSubtitle")}`
            : confirmAction?.checkpoint ? `${confirmAction.checkpoint.title}` : ""
        }
        variant={confirmAction?.type === "delete" ? "delete" : confirmAction?.type === "duplicate" ? "confirm" : confirmAction?.status === "closed" || confirmAction?.status === "archived" ? "warning" : "confirm"}
        color={confirmAction?.type === "delete" || confirmAction?.status === "closed" || confirmAction?.status === "archived" ? "red" : "blue"}
        yesLabel={confirmAction?.type === "delete" ? (t("common.confirm") === "Xác nhận" ? "Xóa" : "Delete") : confirmAction?.type === "duplicate" ? "Duplicate" : "Xác nhận"}
        onYes={runAction}
        onClose={() => setConfirmAction(null)}
      />
    </>
  );
}
