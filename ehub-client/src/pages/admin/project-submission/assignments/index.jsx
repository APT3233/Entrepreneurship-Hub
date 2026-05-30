import { useEffect, useMemo, useState } from "react";
import { Archive, Eye, Lock, Plus, SquarePen, Unlock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { assignmentService, projectSubmissionLookupService } from "@/api/adminProjectSubmission";
import { useToast } from "@/components/ui/Toast";
import { useAdminAssignments } from "@/hooks/admin/useAdminAssignments";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import DeadlineBadge from "@/pages/admin/project-submission/components/DeadlineBadge";
import { useTranslation } from "@/context/TranslationContext";
import {
  buildClassLabel,
  formatDate,
  getAssignmentStatusOptions,
  getDeadlineOptions,
  pageLimit,
  toDateTimeInputValue,
  toSelectOptions,
} from "@/pages/admin/project-submission/shared";

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
  const { rows, meta, loading, error, refetch } = useAdminAssignments(query);
  const [lookups, setLookups] = useState({ classes: [], semesters: [] });
  const [modal, setModal] = useState({ type: null, assignment: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    projectSubmissionLookupService.getAll()
      .then((res) => setLookups(res?.data || { classes: [], semesters: [] }))
      .catch(() => setLookups({ classes: [], semesters: [] }));
  }, []);

  const classOptions = useMemo(() => toSelectOptions(lookups.classes, (item) => item.id, buildClassLabel, t("lookupAll.classes")), [lookups.classes, t]);
  const semesterOptions = useMemo(() => toSelectOptions(lookups.semesters, (item) => item.id, (item) => `${item.semester_code} - ${item.semester_name}`, t("lookupAll.semesters")), [lookups.semesters, t]);

  const openCreate = () => {
    setForm({ ...emptyForm, class_id: query.class_id || "" });
    setModal({ type: "create", assignment: null });
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
      await assignmentService.updateStatus(confirmAction.assignment.id, confirmAction.status);
      toast.success("Đã cập nhật assignment");
      setConfirmAction(null);
      await refetch();
    } catch (err) {
      toast.error(err.message || "Không cập nhật được assignment.");
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
        </div>
      ),
    },
  ];

  return (
    <>
      <FilterBar
        right={(
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus size={16} /> Create assignment
          </button>
        )}
      >
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder="Title, class..." />
        <FilterSelect label={t("filterLabels.class")} value={query.class_id} onChange={(class_id) => setQuery((prev) => ({ ...prev, page: 1, class_id }))} options={classOptions} />
        <FilterSelect label={t("filterLabels.semester")} value={query.semester_id} onChange={(semester_id) => setQuery((prev) => ({ ...prev, page: 1, semester_id }))} options={semesterOptions} />
        <FilterSelect label={t("filterLabels.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={assignmentStatusOptions} />
        <FilterSelect label={t("filterLabels.deadline")} value={query.deadline} onChange={(deadline) => setQuery((prev) => ({ ...prev, page: 1, deadline }))} options={deadlineOptions} />
      </FilterBar>

      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText="Chưa có assignment." />

      <FormModal open={["create", "edit"].includes(modal.type)} title={modal.type === "create" ? "Create assignment" : "Edit assignment"} onClose={() => setModal({ type: null, assignment: null })} onSubmit={save} saving={saving}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Class">
            <select className={inputClass} value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} required>
              <option value="">Chọn lớp</option>
              {(lookups.classes || []).map((item) => <option key={item.id} value={item.id}>{buildClassLabel(item)}</option>)}
            </select>
          </Field>
          <Field label="Title"><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
          <Field label="Deadline"><input type="datetime-local" className={inputClass} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required /></Field>
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <Field label="Max score"><input type="number" min="0.01" step="0.01" className={inputClass} value={form.max_score} onChange={(e) => setForm({ ...form, max_score: e.target.value })} /></Field>
          <Field label="Required file types"><input className={inputClass} value={form.required_file_types} onChange={(e) => setForm({ ...form, required_file_types: e.target.value })} placeholder="pdf,docx" /></Field>
          <Field label="Max file size MB"><input type="number" min="1" className={inputClass} value={form.max_file_size_mb} onChange={(e) => setForm({ ...form, max_file_size_mb: e.target.value })} /></Field>
          <Field label="Max files"><input type="number" min="1" className={inputClass} value={form.max_files} onChange={(e) => setForm({ ...form, max_files: e.target.value })} /></Field>
          <div className="sm:col-span-2">
            <Field label="Attachment URL"><input className={inputClass} value={form.attachment_url} onChange={(e) => setForm({ ...form, attachment_url: e.target.value })} /></Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description"><textarea className={inputClass} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          </div>
          {modal.type === "edit" ? (
            <label className="flex items-center gap-2 text-sm font-semibold text-amber-700 sm:col-span-2">
              <input type="checkbox" checked={form.force} onChange={(e) => setForm({ ...form, force: e.target.checked })} />
              Force update max_score nếu đã có bài graded
            </label>
          ) : null}
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!confirmAction}
        title="Cập nhật trạng thái assignment"
        subtitle={confirmAction?.assignment ? confirmAction.assignment.title : ""}
        variant={confirmAction?.status === "closed" || confirmAction?.status === "archived" ? "warning" : "confirm"}
        color={confirmAction?.status === "closed" || confirmAction?.status === "archived" ? "red" : "blue"}
        yesLabel="Xác nhận"
        onYes={runAction}
        onClose={() => setConfirmAction(null)}
      />
    </>
  );
}
