import { useEffect, useMemo, useState } from "react";
import { Eye, SquarePen } from "lucide-react";
import { projectService, projectSubmissionLookupService } from "@/api/adminProjectSubmission";
import { useToast } from "@/components/ui/Toast";
import { useProjects } from "@/hooks/admin/useProjects";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import DetailGrid from "@/pages/admin/academic/components/DetailGrid";
import { useTranslation } from "@/context/TranslationContext";
import {
  buildClassLabel,
  formatDate,
  pageLimit,
  toSelectOptions,
} from "@/pages/admin/project-submission/shared";
import { getGroupStatusOptions } from "@/pages/admin/student-group/shared";

const emptyForm = {
  topic: "",
  topic_desc: "",
  category: "",
  zalo_link: "",
  mentor_name: "",
  mentor_dept: "",
};

export default function AdminProjects() {
  const { t } = useTranslation();
  const groupStatusOptions = useMemo(() => getGroupStatusOptions(t), [t]);
  const toast = useToast();
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", semester_id: "", class_id: "", category: "", status: "" });
  const { rows, meta, loading, error, refetch } = useProjects(query);
  const [lookups, setLookups] = useState({ classes: [], semesters: [], categories: [] });
  const [modal, setModal] = useState({ type: null, project: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    projectSubmissionLookupService.getAll()
      .then((res) => setLookups(res?.data || { classes: [], semesters: [], categories: [] }))
      .catch(() => setLookups({ classes: [], semesters: [], categories: [] }));
  }, []);

  const classOptions = useMemo(() => toSelectOptions(lookups.classes, (item) => item.id, buildClassLabel, t("lookupAll.classes")), [lookups.classes, t]);
  const semesterOptions = useMemo(() => toSelectOptions(lookups.semesters, (item) => item.id, (item) => `${item.semester_code} - ${item.semester_name}`, t("lookupAll.semesters")), [lookups.semesters, t]);
  const categoryOptions = useMemo(() => [
    { value: "", label: t("lookupAll.categories") },
    ...(lookups.categories || []).map((category) => ({ value: category, label: category })),
  ], [lookups.categories, t]);

  const openDetail = async (project) => {
    try {
      const res = await projectService.get(project.id);
      setModal({ type: "detail", project: res?.data || project });
    } catch (err) {
      toast.error(err.message || "Không tải được project.");
    }
  };

  const openEdit = (project) => {
    setForm({
      topic: project.topic || "",
      topic_desc: project.topic_desc || "",
      category: project.category || "",
      zalo_link: project.zalo_link || "",
      mentor_name: project.mentor_name || "",
      mentor_dept: project.mentor_dept || "",
    });
    setModal({ type: "edit", project });
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await projectService.update(modal.project.id, form);
      toast.success("Cập nhật project metadata thành công");
      setModal({ type: null, project: null });
      await refetch();
    } catch (err) {
      toast.error(err.message || "Không cập nhật được project.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "topic", label: "Project/topic", render: (row) => <span className="font-semibold text-gray-900">{row.topic || "Chưa có topic"}</span> },
    { key: "group_name", label: "Group", render: (row) => `${row.group_code} - ${row.group_name}` },
    { key: "class_code", label: "Class" },
    { key: "subject", label: "Subject", render: (row) => `${row.subject_code} - ${row.subject_name}` },
    { key: "semester", label: "Semester", render: (row) => row.semester_code },
    { key: "category", label: "Category", render: (row) => row.category || "—" },
    { key: "topic_desc", label: "Description", render: (row) => <span className="line-clamp-2">{row.topic_desc || "—"}</span> },
    { key: "mentor_name", label: "Mentor", render: (row) => row.mentor_name || "—" },
    { key: "member_count", label: "Members", render: (row) => Number(row.member_count || 0) },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "updated_at", label: "Last updated", render: (row) => formatDate(row.updated_at) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => openDetail(row)} title="Chi tiết"><Eye size={16} /></ActionButton>
          <ActionButton onClick={() => openEdit(row)} title="Sửa metadata"><SquarePen size={16} /></ActionButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <FilterBar>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder="Topic, group, category..." />
        <FilterSelect label={t("filterLabels.semester")} value={query.semester_id} onChange={(semester_id) => setQuery((prev) => ({ ...prev, page: 1, semester_id }))} options={semesterOptions} />
        <FilterSelect label={t("filterLabels.class")} value={query.class_id} onChange={(class_id) => setQuery((prev) => ({ ...prev, page: 1, class_id }))} options={classOptions} />
        <FilterSelect label={t("filterLabels.category")} value={query.category} onChange={(category) => setQuery((prev) => ({ ...prev, page: 1, category }))} options={categoryOptions} />
        <FilterSelect label={t("filterLabels.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={groupStatusOptions} />
      </FilterBar>

      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText="Chưa có project." />

      <FormModal open={modal.type === "edit"} title="Edit project metadata" onClose={() => setModal({ type: null, project: null })} onSubmit={save} saving={saving}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Topic"><input className={inputClass} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></Field>
          <Field label="Category"><input className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          <Field label="Zalo link"><input className={inputClass} value={form.zalo_link} onChange={(e) => setForm({ ...form, zalo_link: e.target.value })} /></Field>
          <Field label="Mentor name"><input className={inputClass} value={form.mentor_name} onChange={(e) => setForm({ ...form, mentor_name: e.target.value })} /></Field>
          <Field label="Mentor dept"><input className={inputClass} value={form.mentor_dept} onChange={(e) => setForm({ ...form, mentor_dept: e.target.value })} /></Field>
          <div className="sm:col-span-2">
            <Field label="Topic description"><textarea className={inputClass} rows={4} value={form.topic_desc} onChange={(e) => setForm({ ...form, topic_desc: e.target.value })} /></Field>
          </div>
        </div>
      </FormModal>

      <FormModal
        open={modal.type === "detail"}
        title="Project detail"
        onClose={() => setModal({ type: null, project: null })}
        onSubmit={(event) => { event.preventDefault(); setModal({ type: null, project: null }); }}
        submitLabel="Đóng"
      >
        {modal.project ? (
          <div className="space-y-4">
            <DetailGrid items={[
              ["Project/topic", modal.project.topic || "—"],
              ["Group", `${modal.project.group_code} - ${modal.project.group_name}`],
              ["Class", modal.project.class_code],
              ["Subject", `${modal.project.subject_code} - ${modal.project.subject_name}`],
              ["Semester", modal.project.semester_code],
              ["Category", modal.project.category || "—"],
              ["Mentor", modal.project.mentor_name || "—"],
              ["Zalo", modal.project.zalo_link || "—"],
              ["Members", Number(modal.project.member_count || 0)],
              ["Status", modal.project.status],
            ]} />
            <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">{modal.project.topic_desc || "Chưa có mô tả project."}</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 p-3">
                <h3 className="text-sm font-black text-gray-900">Checkpoint submissions</h3>
                <p className="mt-1 text-2xl font-black text-gray-900">{(modal.project.checkpoint_submissions || []).length}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <h3 className="text-sm font-black text-gray-900">Assignment submissions</h3>
                <p className="mt-1 text-2xl font-black text-gray-900">{(modal.project.assignment_submissions || []).length}</p>
              </div>
            </div>
          </div>
        ) : null}
      </FormModal>
    </>
  );
}
