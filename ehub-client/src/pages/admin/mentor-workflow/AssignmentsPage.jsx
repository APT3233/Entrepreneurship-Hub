import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, Plus, SquarePen, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminMentorApi from "@/api/adminMentors";
import groupService from "@/api/adminStudentGroup/groupService";
import MentorWorkflowApi from "@/api/mentorWorkflow";
import { useToast } from "@/components/ui/Toast";
import AdminTable from "@/pages/admin/components/AdminTable";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import FormModal from "@/pages/admin/components/FormModal";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { formatDate } from "@/utils/dateTimeDisplay";
import { assignmentStatusOptions, assignmentTypeOptions, MentorAssignmentForm } from "./components";

const emptyForm = { group_id: "", mentor_id: "", assignment_type: "primary", start_date: "", end_date: "", expected_sessions: null, note: "" };

export default function MentorAssignmentsPage() {
  const toast = useToast();
  const navigate = useNavigate();
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
      setError(err.message || "Unable to load mentor assignments");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { load(); }, [load]);

  const createAssignment = async (e) => {
    e.preventDefault();
    if (!form.group_id || !form.mentor_id) return toast.error("Choose group and mentor");
    setSaving(true);
    try {
      const res = await MentorWorkflowApi.adminCreateAssignment(form);
      toast.success((res?.data?.warnings || []).length ? `Assignment created with ${res.data.warnings.length} warning(s)` : "Assignment created");
      setModalOpen(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      toast.error(err.message || "Unable to create assignment");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async () => {
    if (!confirm) return;
    try {
      await MentorWorkflowApi.adminUpdateAssignmentStatus(confirm.row.id, { status: confirm.status, rejection_reason: confirm.reason || "Cancelled by admin" });
      toast.success("Assignment status updated");
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err.message || "Action failed");
    }
  };

  const columns = useMemo(() => [
    { key: "mentor_name", label: "Mentor", width: 190, render: (row) => <span className="font-black text-slate-900">{row.mentor_name}</span> },
    { key: "mentor_type", label: "Mentor type", width: 140, render: (row) => <StatusBadge value={row.mentor_type} /> },
    { key: "group_name", label: "Group", width: 180 },
    { key: "topic", label: "Project topic", width: 240, render: (row) => row.topic || "-" },
    { key: "class_code", label: "Class", width: 120 },
    { key: "semester_name", label: "Semester", width: 150, render: (row) => row.semester_name || row.semester_code },
    { key: "assignment_type", label: "Type", width: 120, render: (row) => <StatusBadge value={row.assignment_type} /> },
    { key: "status", label: "Status", width: 140, render: (row) => <StatusBadge value={row.status} /> },
    { key: "start_date", label: "Start", width: 120, render: (row) => formatDate(row.start_date) },
    { key: "end_date", label: "End", width: 120, render: (row) => formatDate(row.end_date) },
    { key: "expected_sessions", label: "Expected", width: 90, render: (row) => row.expected_sessions ?? "-" },
    { key: "assigned_by_name", label: "Assigned by", width: 150, render: (row) => row.assigned_by_name || "-" },
    { key: "approved_by_name", label: "Approved by", width: 150, render: (row) => row.approved_by_name || "-" },
    { key: "actions", label: "", width: 180, render: (row) => <div className="flex justify-end gap-1"><button className="rounded-lg p-2 text-slate-500 hover:bg-slate-50" onClick={(e) => { e.stopPropagation(); navigate(`/admin/mentor-assignments/${row.id}`); }}><Eye size={16} /></button>{row.status !== "active" && !["cancelled", "completed", "rejected"].includes(row.status) ? <button className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" onClick={(e) => { e.stopPropagation(); setConfirm({ row, status: "active", title: "Approve assignment", color: "green" }); }}><CheckCircle2 size={16} /></button> : null}{row.status === "active" ? <button className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50" onClick={(e) => { e.stopPropagation(); setConfirm({ row, status: "completed", title: "Complete assignment", color: "indigo" }); }}><SquarePen size={16} /></button> : null}{!["cancelled", "completed"].includes(row.status) ? <button className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" onClick={(e) => { e.stopPropagation(); setConfirm({ row, status: "cancelled", title: "Cancel assignment", color: "red" }); }}><XCircle size={16} /></button> : null}</div> },
  ], [navigate]);

  return (
    <>
      <FilterBar right={<button type="button" onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700"><Plus size={16} /> Assign mentor</button>}>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder="Mentor, group, topic..." />
        <FilterSelect label="Type" value={query.assignment_type} onChange={(assignment_type) => setQuery((prev) => ({ ...prev, page: 1, assignment_type }))} options={[{ value: "", label: "All" }, ...assignmentTypeOptions]} />
        <FilterSelect label="Status" value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={[{ value: "", label: "All" }, ...assignmentStatusOptions]} />
      </FilterBar>
      <AdminTable columns={columns} rows={rows} loading={loading} error={error} emptyText="No mentor assignments" meta={meta} onPageChange={(page, limit) => setQuery((prev) => ({ ...prev, page, limit: limit || prev.limit }))} onRowClick={(row) => navigate(`/admin/mentor-assignments/${row.id}`)} />
      <FormModal open={modalOpen} title="Assign mentor to group" submitLabel="Assign" saving={saving} onClose={() => setModalOpen(false)} onSubmit={createAssignment}>
        <MentorAssignmentForm form={form} setForm={setForm} mentors={mentors} groups={groups} />
      </FormModal>
      <ConfirmDialog isOpen={!!confirm} title={confirm?.title} subtitle={confirm ? `${confirm.row.mentor_name} · ${confirm.row.group_name}` : ""} variant="confirm" color={confirm?.color} yesLabel="Confirm" noLabel="Cancel" onYes={updateStatus} onNo={() => setConfirm(null)} onClose={() => setConfirm(null)} />
    </>
  );
}
