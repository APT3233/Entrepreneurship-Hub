import { useEffect, useMemo, useState } from "react";
import { Archive, Eye, Plus, SquarePen, Info, Briefcase, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { groupService, studentGroupLookupService } from "@/api/adminStudentGroup";
import { useToast } from "@/components/ui/Toast";
import { selectAuthUser } from "@/store/slices/authSlice";
import { checkPermission } from "@/utils/permissions";
import { useGroups } from "@/hooks/admin/useGroups";
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
  getGroupStatusOptions,
  getShortClassCode,
  pageLimit,
  toSelectOptions,
} from "@/pages/admin/student-group/shared";

const emptyForm = {
  class_id: "",
  group_code: "",
  group_name: "",
  description: "",
  category: "",
  topic: "",
  topic_desc: "",
  zalo_link: "",
  mentor_name: "",
  mentor_dept: "",
  max_members: 6,
  status: "forming",
};

export default function AdminGroups() {
  const { t } = useTranslation();
  const groupStatusOptions = useMemo(() => getGroupStatusOptions(t), [t]);
  const toast = useToast();
  const navigate = useNavigate();
  const authUser = useSelector(selectAuthUser);
  const canWrite = checkPermission(authUser, "admin.groups.update");
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", class_id: "", semester_id: "", category: "", status: "" });
  const { rows, meta, loading, error, refetch } = useGroups(query);
  const [lookups, setLookups] = useState({ classes: [], semesters: [], categories: [] });
  const [modal, setModal] = useState({ type: null, group: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmGroup, setConfirmGroup] = useState(null);

  useEffect(() => {
    studentGroupLookupService.getAll()
      .then((res) => setLookups(res?.data || { classes: [], semesters: [], categories: [] }))
      .catch(() => setLookups({ classes: [], semesters: [], categories: [] }));
  }, []);

  const classOptions = useMemo(() => toSelectOptions(lookups.classes, (item) => item.id, buildClassLabel, t("lookupAll.classes")), [lookups.classes, t]);
  const semesterOptions = useMemo(() => toSelectOptions(lookups.semesters, (item) => item.id, (item) => `${item.semester_code} - ${item.semester_name}`, t("lookupAll.semesters")), [lookups.semesters, t]);
  const categoryOptions = useMemo(() => [
    { value: "", label: t("lookupAll.categories") },
    ...(lookups.categories || []).map((category) => ({ value: category, label: category })),
  ], [lookups.categories, t]);

  const formClassOptions = useMemo(() => 
    (lookups.classes || []).map((item) => ({ value: String(item.id), label: buildClassLabel(item) })),
    [lookups.classes]
  );

  const openCreate = () => {
    setForm({ ...emptyForm, class_id: query.class_id || "" });
    setModal({ type: "create", group: null });
  };

  const openEdit = (group) => {
    setForm({
      class_id: group.class_id ? String(group.class_id) : "",
      group_code: group.group_code || "",
      group_name: group.group_name || "",
      description: group.description || "",
      category: group.category || "",
      topic: group.topic || "",
      topic_desc: group.topic_desc || "",
      zalo_link: group.zalo_link || "",
      mentor_name: group.mentor_name || "",
      mentor_dept: group.mentor_dept || "",
      max_members: Number(group.max_members || 6),
      status: group.status || "forming",
    });
    setModal({ type: "edit", group });
  };

  const validateForm = () => {
    const isVi = t("common.confirm", { defaultValue: "Xác nhận" }) === "Xác nhận";
    if (!form.class_id || !form.group_code.trim() || !form.group_name.trim()) {
      return isVi ? "Vui lòng nhập lớp, mã nhóm và tên nhóm." : "Please select class, enter group code and group name.";
    }
    if (form.status === "active" && !form.topic.trim()) {
      return isVi ? "Topic là bắt buộc khi group active." : "Topic is required when group is active.";
    }
    if (Number(form.max_members) <= 0) {
      return isVi ? "max_members phải lớn hơn 0." : "max_members must be greater than 0.";
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
        class_id: Number(form.class_id),
        group_code: form.group_code.toUpperCase(),
        max_members: Number(form.max_members),
      };
      if (modal.type === "create") {
        await groupService.create(payload);
        toast.success(t("admin.toasts.createSuccess"));
      } else {
        await groupService.update(modal.group.id, payload);
        toast.success(t("admin.toasts.updateSuccess"));
      }
      setModal({ type: null, group: null });
      await refetch();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const archiveGroup = async () => {
    if (!confirmGroup) return;
    try {
      await groupService.remove(confirmGroup.id);
      toast.success(t("common.confirm", { defaultValue: "Xác nhận" }) === "Xác nhận" ? "Đã dissolve nhóm" : "Dissolved group successfully");
      setConfirmGroup(null);
      await refetch();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const columns = useMemo(() => [
    { key: "group_name", label: t("admin.fields.groupName"), render: (row) => <span className="font-semibold text-gray-900">{row.group_name}</span> },
    { key: "class_code", label: t("admin.fields.classCode"), render: (row) => getShortClassCode(row.class_code, row.semester_code) },
    { key: "subject", label: t("nav.subjects"), render: (row) => `${row.subject_code} - ${row.subject_name}` },
    { key: "semester", label: t("admin.fields.semester"), render: (row) => row.semester_code },
    { key: "topic", label: "Topic", render: (row) => row.topic || "—" },
    { key: "category", label: "Category", render: (row) => row.category || "—" },
    { key: "mentor_name", label: "Mentor", render: (row) => row.mentor_name || "—" },
    { key: "member_count", label: t("admin.fields.members"), render: (row) => `${Number(row.member_count || 0)}/${Number(row.max_members || 0)}` },
    { key: "leader_name", label: t("admin.fields.leader"), render: (row) => row.leader_name || "—" },
    { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => navigate(`/admin/groups/${row.id}`)} title={t("admin.actions.detail")}><Eye size={16} /></ActionButton>
          {canWrite ? <ActionButton onClick={() => openEdit(row)} title={t("admin.actions.edit")}><SquarePen size={16} /></ActionButton> : null}
          {canWrite && row.status !== "dissolved" ? <ActionButton onClick={() => setConfirmGroup(row)} title="Dissolve" tone="red"><Archive size={16} /></ActionButton> : null}
        </div>
      ),
    },
  ], [t, canWrite, navigate]);

  return (
    <>
      <FilterBar
        right={canWrite ? (
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer">
            <Plus size={16} /> {t("admin.actions.create")}
          </button>
        ) : null}
      >
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("common.confirm", { defaultValue: "Xác nhận" }) === "Xác nhận" ? "Mã nhóm, tên nhóm, topic..." : "Group code, name, topic..."} />
        <FilterSelect label={t("admin.fields.classCode")} value={query.class_id} onChange={(class_id) => setQuery((prev) => ({ ...prev, page: 1, class_id }))} options={classOptions} />
        <FilterSelect label={t("admin.fields.semester")} value={query.semester_id} onChange={(semester_id) => setQuery((prev) => ({ ...prev, page: 1, semester_id }))} options={semesterOptions} />
        <FilterSelect label={t("filterLabels.category")} value={query.category} onChange={(category) => setQuery((prev) => ({ ...prev, page: 1, category }))} options={categoryOptions} />
        <FilterSelect label={t("admin.fields.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={groupStatusOptions} />
      </FilterBar>

      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText={t("common.noData")} />

      <FormModal open={["create", "edit"].includes(modal.type)} title={modal.type === "create" ? t("admin.actions.create") + " Group" : t("admin.actions.edit") + " Group"} onClose={() => setModal({ type: null, group: null })} onSubmit={save} saving={saving}>
        <div className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Info size={16} />
              </span>
              <h4 className="text-sm font-bold text-gray-800">
                {t("common.confirm", { defaultValue: "Xác nhận" }) === "Xác nhận" ? "Thông tin cơ bản" : "Basic Information"}
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("admin.fields.classCode")}>
                <Dropdown
                  label={t("common.confirm", { defaultValue: "Xác nhận" }) === "Xác nhận" ? "Chọn lớp" : "Select class"}
                  value={form.class_id}
                  onChange={(value) => setForm({ ...form, class_id: value })}
                  options={formClassOptions}
                />
              </Field>
              <Field label={t("admin.fields.studentCode", { defaultValue: "Mã nhóm" }) === "Mã sinh viên" ? "Mã nhóm" : "Group code"}><input className={inputClass} value={form.group_code} onChange={(e) => setForm({ ...form, group_code: e.target.value.toUpperCase() })} required /></Field>
              <Field label={t("admin.fields.groupName")}><input className={inputClass} value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} required /></Field>
              <Field label="Max members"><input type="number" min="1" max="20" className={inputClass} value={form.max_members} onChange={(e) => setForm({ ...form, max_members: e.target.value })} required /></Field>
              <Field label={t("admin.fields.status")}>
                <Dropdown
                  label="Status"
                  value={form.status}
                  onChange={(value) => setForm({ ...form, status: value })}
                  direction="up"
                  options={[
                    { value: "forming", label: t("status.forming") },
                    { value: "active", label: t("status.active") },
                    { value: "inactive", label: t("status.inactive") },
                    { value: "completed", label: t("status.completed") },
                    { value: "dissolved", label: t("status.dissolved") },
                  ]}
                />
              </Field>
            </div>
          </div>

          {/* Section 2: Project Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Briefcase size={16} />
              </span>
              <h4 className="text-sm font-bold text-gray-800">
                {t("common.confirm", { defaultValue: "Xác nhận" }) === "Xác nhận" ? "Thông tin dự án" : "Project Details"}
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Category"><input className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
              <Field label="Topic"><input className={inputClass} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></Field>
              <div className="sm:col-span-2">
                <Field label={t("admin.fields.description")}><textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Topic description"><textarea className={inputClass} rows={3} value={form.topic_desc} onChange={(e) => setForm({ ...form, topic_desc: e.target.value })} /></Field>
              </div>
            </div>
          </div>

          {/* Section 3: Mentor & Links */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <UserCog size={16} />
              </span>
              <h4 className="text-sm font-bold text-gray-800">
                {t("common.confirm", { defaultValue: "Xác nhận" }) === "Xác nhận" ? "Mentor & Liên kết" : "Mentor & Links"}
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("admin.fields.lecturer", { defaultValue: "Mentor" }) === "Giảng viên" ? "Mentor" : "Mentor"}><input className={inputClass} value={form.mentor_name} onChange={(e) => setForm({ ...form, mentor_name: e.target.value })} /></Field>
              <Field label="Mentor dept"><input className={inputClass} value={form.mentor_dept} onChange={(e) => setForm({ ...form, mentor_dept: e.target.value })} /></Field>
              <div className="sm:col-span-2">
                <Field label="Zalo link"><input className={inputClass} value={form.zalo_link} onChange={(e) => setForm({ ...form, zalo_link: e.target.value })} /></Field>
              </div>
            </div>
          </div>

          <div className="mt-2">
            <WarningNote>
              {t("common.confirm", { defaultValue: "Xác nhận" }) === "Xác nhận"
                ? "Backend sẽ kiểm tra duy nhất mã nhóm (unique group_code) theo lớp, ràng buộc số thành viên tối đa và yêu cầu đề tài khi chuyển sang hoạt động."
                : "Backend will check unique group_code per class, class member limits, and required topic when transitioning to active."}
            </WarningNote>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!confirmGroup}
        title="Dissolve nhóm"
        subtitle={confirmGroup ? `${confirmGroup.group_name}. ${t("admin.groups.deleteArchiveHint")}` : ""}
        variant="archive"
        color="red"
        yesLabel="Dissolve"
        onYes={archiveGroup}
        onClose={() => setConfirmGroup(null)}
      />
    </>
  );
}
