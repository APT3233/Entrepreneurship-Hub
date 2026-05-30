import { useMemo, useState } from "react";
import { Eye, Plus, RotateCcw, SquarePen, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import { subjectService } from "@/api/adminAcademic";
import { useToast } from "@/components/ui/Toast";
import { selectAuthUser } from "@/store/slices/authSlice";
import { checkPermission } from "@/utils/permissions";
import { useSubjects } from "@/hooks/admin/useSubjects";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import DetailGrid from "@/pages/admin/academic/components/DetailGrid";
import { useTranslation } from "@/context/TranslationContext";
import {
  formatDate,
  pageLimit,
  getSubjectStatusOptions,
} from "@/pages/admin/academic/shared";

const emptyForm = {
  subject_code: "",
  subject_name: "",
  subject_name_en: "",
  description: "",
  credits: 0,
  status: "active",
};

export default function AdminSubjects() {
  const { t } = useTranslation();
  const toast = useToast();
  const authUser = useSelector(selectAuthUser);
  const canCreate = checkPermission(authUser, "core.subject.create");
  const canUpdate = checkPermission(authUser, "core.subject.update");
  const canDelete = checkPermission(authUser, "core.subject.delete");
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", status: "", deleted: "" });
  const { rows, meta, loading, error, refetch } = useSubjects(query);
  const [modal, setModal] = useState({ type: null, subject: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const subjectStatusOptions = useMemo(() => getSubjectStatusOptions(t), [t]);
  const deletedOptions = useMemo(() => [
    { value: "", label: t("filters.activeOnly") },
    { value: "all", label: t("filters.includeDeleted") },
    { value: "only", label: t("filters.deletedOnly") },
  ], [t]);

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ type: "create", subject: null });
  };

  const openEdit = (subject) => {
    setForm({
      subject_code: subject.subject_code || "",
      subject_name: subject.subject_name || "",
      subject_name_en: subject.subject_name_en || "",
      description: subject.description || "",
      credits: Number(subject.credits || 0),
      status: subject.status || "active",
    });
    setModal({ type: "edit", subject });
  };

  const openDetail = async (subject) => {
    try {
      const res = await subjectService.get(subject.id, { include_deleted: "true" });
      setModal({ type: "detail", subject: res?.data || subject });
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        subject_code: form.subject_code.toUpperCase(),
        credits: Number(form.credits || 0),
      };
      if (modal.type === "create") {
        await subjectService.create(payload);
        toast.success(t("admin.toasts.createSuccess"));
      } else {
        await subjectService.update(modal.subject.id, payload);
        toast.success(t("admin.toasts.updateSuccess"));
      }
      setModal({ type: null, subject: null });
      await refetch();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.type === "delete") {
        await subjectService.remove(confirm.subject.id);
        toast.success(t("admin.toasts.deleteSuccess"));
      } else if (confirm.type === "restore") {
        await subjectService.restore(confirm.subject.id);
        toast.success(t("admin.toasts.restoreSuccess"));
      } else if (confirm.type === "status") {
        const nextStatus = confirm.subject.status === "active" ? "inactive" : "active";
        await subjectService.updateStatus(confirm.subject.id, nextStatus);
        toast.success(t("admin.toasts.statusSuccess"));
      }
      setConfirm(null);
      await refetch();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const columns = useMemo(() => [
    { key: "subject_code", label: t("admin.fields.subjectCode"), render: (row) => <span className="font-mono text-xs font-bold text-indigo-700">{row.subject_code}</span> },
    { key: "subject_name", label: t("admin.fields.subjectName"), render: (row) => <span className="font-semibold text-gray-900">{row.subject_name}</span> },
    { key: "subject_name_en", label: t("admin.fields.englishName"), render: (row) => row.subject_name_en || "—" },
    { key: "credits", label: t("admin.fields.credits"), render: (row) => Number(row.credits || 0) },
    { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.deleted_at ? "deleted" : row.status} /> },
    { key: "created_by", label: t("common.actions", { defaultValue: "Người tạo" }) === "Thao tác" ? "Người tạo" : "Created by", render: (row) => row.created_by_name || row.created_by || "—" },
    { key: "created_at", label: t("common.created"), render: (row) => formatDate(row.created_at) },
    { key: "updated_at", label: t("common.updated"), render: (row) => formatDate(row.updated_at) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => openDetail(row)} title={t("admin.actions.detail")}><Eye size={16} /></ActionButton>
          {canUpdate && !row.deleted_at ? <ActionButton onClick={() => openEdit(row)} title={t("admin.actions.edit")}><SquarePen size={16} /></ActionButton> : null}
          {canUpdate && !row.deleted_at ? (
            <ActionButton onClick={() => setConfirm({ type: "status", subject: row })} title={t("admin.actions.activeInactive")} tone="blue">
              {row.status === "active" ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            </ActionButton>
          ) : null}
          {canDelete && !row.deleted_at ? <ActionButton onClick={() => setConfirm({ type: "delete", subject: row })} title={t("admin.actions.delete")} tone="red"><Trash2 size={16} /></ActionButton> : null}
          {canUpdate && row.deleted_at ? <ActionButton onClick={() => setConfirm({ type: "restore", subject: row })} title={t("admin.actions.restore")} tone="green"><RotateCcw size={16} /></ActionButton> : null}
        </div>
      ),
    },
  ], [t, canUpdate, canDelete]);

  return (
    <>
      <FilterBar
        right={canCreate ? (
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer">
            <Plus size={16} /> {t("admin.actions.create")}
          </button>
        ) : null}
      >
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={`${t("admin.fields.subjectCode")}/${t("admin.fields.subjectName")}...`} />
        <FilterSelect label={t("admin.fields.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={subjectStatusOptions} />
        <FilterSelect label={t("status.deleted")} value={query.deleted} onChange={(deleted) => setQuery((prev) => ({ ...prev, page: 1, deleted }))} options={deletedOptions} />
      </FilterBar>

      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText={t("common.noData")} />

      <FormModal open={["create", "edit"].includes(modal.type)} title={modal.type === "create" ? t("admin.dialogs.createSubject") : t("admin.dialogs.editSubject")} onClose={() => setModal({ type: null, subject: null })} onSubmit={save} saving={saving}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("admin.fields.subjectCode")}>
            <input className={inputClass} value={form.subject_code} onChange={(e) => setForm({ ...form, subject_code: e.target.value.toUpperCase() })} required />
          </Field>
          <Field label={t("admin.fields.credits")}>
            <input type="number" min="0" max="10" className={inputClass} value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} required />
          </Field>
          <Field label={t("admin.fields.subjectName")}>
            <input className={inputClass} value={form.subject_name} onChange={(e) => setForm({ ...form, subject_name: e.target.value })} required />
          </Field>
          <Field label={t("admin.fields.englishName")}>
            <input className={inputClass} value={form.subject_name_en} onChange={(e) => setForm({ ...form, subject_name_en: e.target.value })} />
          </Field>
          <Field label={t("admin.fields.status")}>
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">{t("status.active")}</option>
              <option value="inactive">{t("status.inactive")}</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("admin.fields.description")}>
              <textarea className={`${inputClass} min-h-24`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
        </div>
      </FormModal>

      <FormModal open={modal.type === "detail"} title={t("admin.dialogs.subjectDetail")} onClose={() => setModal({ type: null, subject: null })} onSubmit={(e) => { e.preventDefault(); setModal({ type: null, subject: null }); }} submitLabel={t("common.close")}>
        {modal.subject ? (
          <div className="space-y-4">
            <DetailGrid items={[
              [t("admin.fields.subjectCode"), modal.subject.subject_code],
              [t("admin.fields.subjectName"), modal.subject.subject_name],
              [t("admin.fields.englishName"), modal.subject.subject_name_en || "—"],
              [t("admin.fields.credits"), Number(modal.subject.credits || 0)],
              [t("admin.fields.status"), modal.subject.deleted_at ? t("status.deleted") : t(`status.${modal.subject.status}`)],
              [t("common.actions", { defaultValue: "Người tạo" }) === "Thao tác" ? "Người tạo" : "Created by", modal.subject.created_by_name || modal.subject.created_by || "—"],
            ]} />
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{t("nav.classes")}</p>
              <div className="max-h-64 overflow-auto rounded-xl border border-gray-100">
                {(modal.subject.classes || []).length ? (modal.subject.classes || []).map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0">
                    <span className="font-semibold text-gray-800">{cls.class_code}</span>
                    <span className="text-gray-500">{cls.semester_code}</span>
                    <span className="text-gray-500">{cls.lecturer_name || "—"}</span>
                  </div>
                )) : <div className="px-3 py-6 text-center text-sm text-gray-400">{t("common.noData")}</div>}
              </div>
            </div>
          </div>
        ) : null}
      </FormModal>

      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm?.type === "delete" ? t("admin.dialogs.deleteConfirmTitle") : confirm?.type === "restore" ? t("admin.dialogs.restoreConfirmTitle") : t("admin.dialogs.statusConfirmTitle")}
        subtitle={confirm?.subject ? `${confirm.subject.subject_code} - ${confirm.subject.subject_name}` : ""}
        variant={confirm?.type === "delete" ? "delete" : confirm?.type === "restore" ? "restore" : "confirm"}
        color={confirm?.type === "delete" ? "red" : confirm?.type === "restore" ? "green" : "blue"}
        yesLabel={t("common.confirm")}
        onYes={runConfirm}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}
