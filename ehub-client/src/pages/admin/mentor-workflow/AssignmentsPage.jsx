import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, Plus, SquarePen, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminMentorApi from "@/api/adminMentors";
import groupService from "@/api/adminStudentGroup/groupService";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import FormModal from "@/pages/admin/components/FormModal";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import { MentorAssignmentForm, useAssignmentStatusOptions, useAssignmentTypeOptions } from "./components";

const emptyForm = { group_id: "", mentor_id: "", assignment_type: "primary", start_date: "", end_date: "", expected_sessions: null, note: "" };

export default function MentorAssignmentsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const assignmentTypeOptions = useAssignmentTypeOptions();
  const assignmentStatusOptions = useAssignmentStatusOptions();
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "", assignment_type: "", status: "" });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [assignmentsRes, mentorsRes, groupsRes] = await Promise.all([
        MentorWorkflowApi.adminAssignments(query),
        AdminMentorApi.getMentors({ limit: 100, status: "active" }),
        groupService.list({ limit: 100, status: "active" }),
      ]);
      setRows(assignmentsRes?.data || []);
      setMeta(assignmentsRes?.meta || null);
      setMentors(mentorsRes?.data || []);
      setGroups(groupsRes?.data || []);
    } catch (err) {
      setError(err.message || t("admin.mentorWorkflow.assignments.loadError"));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  const createAssignment = async (e) => {
    e.preventDefault();
    if (!form.group_id || !form.mentor_id) return toast.error(t("admin.mentorWorkflow.assignments.chooseGroupMentor"));
    setSaving(true);
    try {
      const res = await MentorWorkflowApi.adminCreateAssignment(form);
      const warnings = res?.data?.warnings || [];
      toast.success(warnings.length ? t("admin.mentorWorkflow.assignments.createdWithWarnings", { count: warnings.length }) : t("admin.mentorWorkflow.assignments.created"));
      setModalOpen(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.mentorWorkflow.assignments.createError"));
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async () => {
    if (!confirm) return;
    try {
      await MentorWorkflowApi.adminUpdateAssignmentStatus(confirm.row.id, { status: confirm.status, rejection_reason: confirm.reason || t("admin.mentorWorkflow.common.cancelledByAdmin") });
      toast.success(t("admin.mentorWorkflow.assignments.statusUpdated"));
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.mentorWorkflow.assignments.actionFailed"));
    }
  };

  const columns = useMemo(() => [
    { key: "mentor_name", label: t("admin.mentorWorkflow.assignments.columns.mentor"), width: 190, render: (row) => <span className="font-black text-slate-900">{row.mentor_name}</span> },
    { key: "mentor_type", label: t("admin.mentorWorkflow.assignments.columns.mentorType"), width: 140, render: (row) => <StatusBadge value={row.mentor_type} /> },
    { key: "group_name", label: t("admin.mentorWorkflow.assignments.columns.group"), width: 180 },
    { key: "topic", label: t("admin.mentorWorkflow.assignments.columns.topic"), width: 240, render: (row) => row.topic || "-" },
    { key: "class_code", label: t("admin.mentorWorkflow.assignments.columns.class"), width: 120 },
    { key: "semester_name", label: t("admin.mentorWorkflow.assignments.columns.semester"), width: 150, render: (row) => row.semester_name || row.semester_code },
    { key: "assignment_type", label: t("admin.mentorWorkflow.assignments.columns.type"), width: 120, render: (row) => <StatusBadge value={row.assignment_type} /> },
    { key: "status", label: t("admin.mentorWorkflow.assignments.columns.status"), width: 140, render: (row) => <StatusBadge value={row.status} /> },
    { key: "start_date", label: t("admin.mentorWorkflow.assignments.columns.start"), width: 120, render: (row) => formatDate(row.start_date) },
    { key: "end_date", label: t("admin.mentorWorkflow.assignments.columns.end"), width: 120, render: (row) => formatDate(row.end_date) },
    { key: "expected_sessions", label: t("admin.mentorWorkflow.assignments.columns.expected"), width: 90, render: (row) => row.expected_sessions ?? "-" },
    { key: "assigned_by_name", label: t("admin.mentorWorkflow.assignments.columns.assignedBy"), width: 150, render: (row) => row.assigned_by_name || "-" },
    { key: "approved_by_name", label: t("admin.mentorWorkflow.assignments.columns.approvedBy"), width: 150, render: (row) => row.approved_by_name || "-" },
    { key: "actions", label: "", width: 180, render: (row) => <div className="flex justify-end gap-1"><button className="rounded-lg p-2 text-slate-500 hover:bg-slate-50" onClick={(e) => { e.stopPropagation(); navigate(`/admin/mentor-assignments/${row.id}`); }}><Eye size={16} /></button>{row.status !== "active" && !["cancelled", "completed", "rejected"].includes(row.status) ? <button className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" onClick={(e) => { e.stopPropagation(); setConfirm({ row, status: "active", title: t("admin.mentorWorkflow.assignments.approveTitle"), color: "green" }); }}><CheckCircle2 size={16} /></button> : null}{row.status === "active" ? <button className="rounded-lg p-2 text-accent hover:bg-accent-bg" onClick={(e) => { e.stopPropagation(); setConfirm({ row, status: "completed", title: t("admin.mentorWorkflow.assignments.completeTitle"), color: "indigo" }); }}><SquarePen size={16} /></button> : null}{!["cancelled", "completed"].includes(row.status) ? <button className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" onClick={(e) => { e.stopPropagation(); setConfirm({ row, status: "cancelled", title: t("admin.mentorWorkflow.assignments.cancelTitle"), color: "red" }); }}><XCircle size={16} /></button> : null}</div> },
  ], [navigate, t]);

  return (
    <>
      <FilterBar right={<button type="button" onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-hover"><Plus size={16} /> {t("admin.mentorWorkflow.assignments.assignMentor")}</button>}>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("admin.mentorWorkflow.assignments.searchPlaceholder")} />
        <FilterSelect label={t("admin.mentorWorkflow.assignments.columns.type")} value={query.assignment_type} onChange={(assignment_type) => setQuery((prev) => ({ ...prev, page: 1, assignment_type }))} options={[{ value: "", label: t("common.all") }, ...assignmentTypeOptions]} />
        <FilterSelect label={t("admin.mentorWorkflow.assignments.columns.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={[{ value: "", label: t("common.all") }, ...assignmentStatusOptions]} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText={t("admin.mentorWorkflow.assignments.emptyText")} meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} onRowClick={(row) => navigate(`/admin/mentor-assignments/${row.id}`)} />
      <FormModal open={modalOpen} title={t("admin.mentorWorkflow.assignments.modalTitle")} submitLabel={t("admin.mentorWorkflow.assignments.modalSubmit")} saving={saving} onClose={() => setModalOpen(false)} onSubmit={createAssignment}>
        <MentorAssignmentForm form={form} setForm={setForm} mentors={mentors} groups={groups} />
      </FormModal>
      <ConfirmDialog isOpen={!!confirm} title={confirm?.title} subtitle={confirm ? `${confirm.row.mentor_name} · ${confirm.row.group_name}` : ""} variant="confirm" color={confirm?.color} yesLabel={t("common.confirm")} noLabel={t("common.cancel")} onYes={updateStatus} onNo={() => setConfirm(null)} onClose={() => setConfirm(null)} />
    </>
  );
}
