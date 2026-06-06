import StatusBadge from "@/pages/admin/components/StatusBadge";
import { Field, inputClass } from "@/pages/admin/components/FormModal";

export const assignmentTypeOptions = ["primary", "supporting", "business", "technical"].map((value) => ({ value, label: value }));
export const assignmentStatusOptions = ["proposed", "pending_mentor", "active", "rejected", "cancelled", "completed"].map((value) => ({ value, label: value }));
export const sessionTypeOptions = ["online", "offline", "hybrid"].map((value) => ({ value, label: value }));
export const sessionStatusOptions = ["scheduled", "completed", "cancelled", "no_show", "rescheduled"].map((value) => ({ value, label: value }));
export const requestRoleOptions = ["any", "business", "technical"].map((value) => ({ value, label: value }));
export const priorityOptions = ["low", "normal", "high", "urgent"].map((value) => ({ value, label: value }));

export function Select({ value, onChange, options = [], disabled = false }) {
  return <select disabled={disabled} className={inputClass} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
}

export function AssignmentStatus({ value }) { return <StatusBadge value={value} />; }

export function MentorAssignmentForm({ form, setForm, mentors = [], groups = [], lockedGroupId = null }) {
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const group = groups.find((item) => String(item.id) === String(lockedGroupId || form.group_id));
  const mentor = mentors.find((item) => String(item.id) === String(form.mentor_id));
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Group"><Select disabled={!!lockedGroupId} value={lockedGroupId || form.group_id || ""} onChange={(value) => set("group_id", value)} options={[{ value: "", label: "Select group" }, ...groups.map((item) => ({ value: String(item.id), label: `${item.group_name || item.group_code} · ${item.class_code || ""}` }))]} /></Field>
        <Field label="Mentor"><Select value={form.mentor_id || ""} onChange={(value) => set("mentor_id", value)} options={[{ value: "", label: "Select mentor" }, ...mentors.map((item) => ({ value: String(item.id), label: `${item.full_name} · ${item.mentor_type}` }))]} /></Field>
        <Field label="Type"><Select value={form.assignment_type || "primary"} onChange={(value) => set("assignment_type", value)} options={assignmentTypeOptions} /></Field>
        <Field label="Expected sessions"><input type="number" min="0" className={inputClass} value={form.expected_sessions ?? ""} onChange={(e) => set("expected_sessions", e.target.value === "" ? null : Number(e.target.value))} /></Field>
        <Field label="Start date"><input type="date" className={inputClass} value={form.start_date || ""} onChange={(e) => set("start_date", e.target.value)} /></Field>
        <Field label="End date"><input type="date" className={inputClass} value={form.end_date || ""} onChange={(e) => set("end_date", e.target.value)} /></Field>
      </div>
      <Field label="Note"><textarea className={inputClass} rows={3} value={form.note || ""} onChange={(e) => set("note", e.target.value)} /></Field>
      {group ? <InfoBox title="Selected group" lines={[group.topic || group.group_name, group.category, group.class_code || group.class_name, group.semester_name || group.semester_code].filter(Boolean)} /> : null}
      {mentor ? <InfoBox title="Selected mentor" lines={[mentor.email, mentor.organization, mentor.position_title, `${mentor.years_of_experience ?? "-"} years`].filter(Boolean)} /> : null}
    </div>
  );
}

export function SessionForm({ form, setForm, assignments = [] }) {
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Assignment"><Select value={form.assignment_id || ""} onChange={(value) => set("assignment_id", value)} options={[{ value: "", label: "Select assignment" }, ...assignments.map((item) => ({ value: String(item.id), label: `${item.group_name} · ${item.assignment_type}` }))]} /></Field>
        <Field label="Session type"><Select value={form.session_type || "online"} onChange={(value) => set("session_type", value)} options={sessionTypeOptions} /></Field>
        <Field label="Title"><input className={inputClass} value={form.title || ""} onChange={(e) => set("title", e.target.value)} required /></Field>
        <Field label="Meeting link"><input className={inputClass} value={form.meeting_link || ""} onChange={(e) => set("meeting_link", e.target.value)} /></Field>
        <Field label="Start"><input type="datetime-local" className={inputClass} value={form.scheduled_start_at || ""} onChange={(e) => set("scheduled_start_at", e.target.value)} required /></Field>
        <Field label="End"><input type="datetime-local" className={inputClass} value={form.scheduled_end_at || ""} onChange={(e) => set("scheduled_end_at", e.target.value)} required /></Field>
        <Field label="Location"><input className={inputClass} value={form.location || ""} onChange={(e) => set("location", e.target.value)} /></Field>
      </div>
      <Field label="Description"><textarea className={inputClass} rows={3} value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></Field>
    </div>
  );
}

export function InfoBox({ title, lines = [] }) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-xs font-black uppercase text-slate-400">{title}</p><div className="mt-1 space-y-0.5 text-sm font-medium text-slate-700">{lines.map((line) => <p key={line}>{line}</p>)}</div></div>;
}

export function MetricCard({ label, value }) {
  return <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-slate-900">{value ?? 0}</p></div>;
}
