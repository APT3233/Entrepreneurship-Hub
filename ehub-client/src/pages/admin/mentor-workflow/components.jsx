import { useMemo } from "react";
import { useTranslation } from "@/context/TranslationContext";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { Field, inputClass } from "@/pages/admin/components/FormModal";

const assignmentTypeValues = ["primary", "supporting", "business", "technical"];
const assignmentStatusValues = ["proposed", "pending_mentor", "active", "rejected", "cancelled", "completed"];
const sessionTypeValues = ["online", "offline", "hybrid"];
const sessionStatusValues = ["scheduled", "completed", "cancelled", "no_show", "rescheduled"];
const requestRoleValues = ["any", "business", "technical"];
const priorityValues = ["low", "normal", "high", "urgent"];

function localizeOptions(t, values) {
  return values.map((value) => ({ value, label: t(`status.${value}`) }));
}

export function useAssignmentTypeOptions() {
  const { t } = useTranslation();
  return useMemo(() => localizeOptions(t, assignmentTypeValues), [t]);
}

export function useAssignmentStatusOptions() {
  const { t } = useTranslation();
  return useMemo(() => localizeOptions(t, assignmentStatusValues), [t]);
}

export function useSessionTypeOptions() {
  const { t } = useTranslation();
  return useMemo(() => localizeOptions(t, sessionTypeValues), [t]);
}

export function useSessionStatusOptions() {
  const { t } = useTranslation();
  return useMemo(() => localizeOptions(t, sessionStatusValues), [t]);
}

export function useRequestRoleOptions() {
  const { t } = useTranslation();
  return useMemo(() => localizeOptions(t, requestRoleValues), [t]);
}

export function usePriorityOptions() {
  const { t } = useTranslation();
  return useMemo(() => localizeOptions(t, priorityValues), [t]);
}

/** @deprecated use useAssignmentTypeOptions */
export const assignmentTypeOptions = assignmentTypeValues.map((value) => ({ value, label: value }));
/** @deprecated use useAssignmentStatusOptions */
export const assignmentStatusOptions = assignmentStatusValues.map((value) => ({ value, label: value }));
/** @deprecated use useSessionTypeOptions */
export const sessionTypeOptions = sessionTypeValues.map((value) => ({ value, label: value }));
/** @deprecated use useSessionStatusOptions */
export const sessionStatusOptions = sessionStatusValues.map((value) => ({ value, label: value }));
/** @deprecated use useRequestRoleOptions */
export const requestRoleOptions = requestRoleValues.map((value) => ({ value, label: value }));
/** @deprecated use usePriorityOptions */
export const priorityOptions = priorityValues.map((value) => ({ value, label: value }));

export function Select({ value, onChange, options = [], disabled = false }) {
  return <select disabled={disabled} className={inputClass} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
}

export function AssignmentStatus({ value }) { return <StatusBadge value={value} />; }

export function MentorAssignmentForm({ form, setForm, mentors = [], groups = [], lockedGroupId = null }) {
  const { t } = useTranslation();
  const assignmentTypeOptions = useAssignmentTypeOptions();
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const group = groups.find((item) => String(item.id) === String(lockedGroupId || form.group_id));
  const mentor = mentors.find((item) => String(item.id) === String(form.mentor_id));
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("admin.mentorWorkflow.forms.group")}><Select disabled={!!lockedGroupId} value={lockedGroupId || form.group_id || ""} onChange={(value) => set("group_id", value)} options={[{ value: "", label: t("admin.mentorWorkflow.common.selectGroup") }, ...groups.map((item) => ({ value: String(item.id), label: `${item.group_name || item.group_code} · ${item.class_code || ""}` }))]} /></Field>
        <Field label={t("admin.mentorWorkflow.forms.mentor")}><Select value={form.mentor_id || ""} onChange={(value) => set("mentor_id", value)} options={[{ value: "", label: t("admin.mentorWorkflow.common.selectMentor") }, ...mentors.map((item) => ({ value: String(item.id), label: `${item.full_name} · ${t(`status.${item.mentor_type}`)}` }))]} /></Field>
        <Field label={t("admin.mentorWorkflow.forms.type")}><Select value={form.assignment_type || "primary"} onChange={(value) => set("assignment_type", value)} options={assignmentTypeOptions} /></Field>
        <Field label={t("admin.mentorWorkflow.forms.expectedSessions")}><input type="number" min="0" className={inputClass} value={form.expected_sessions ?? ""} onChange={(e) => set("expected_sessions", e.target.value === "" ? null : Number(e.target.value))} /></Field>
        <Field label={t("admin.mentorWorkflow.forms.startDate")}><input type="date" className={inputClass} value={form.start_date || ""} onChange={(e) => set("start_date", e.target.value)} /></Field>
        <Field label={t("admin.mentorWorkflow.forms.endDate")}><input type="date" className={inputClass} value={form.end_date || ""} onChange={(e) => set("end_date", e.target.value)} /></Field>
      </div>
      <Field label={t("admin.mentorWorkflow.forms.note")}><textarea className={inputClass} rows={3} value={form.note || ""} onChange={(e) => set("note", e.target.value)} /></Field>
      {group ? <InfoBox title={t("admin.mentorWorkflow.common.selectedGroup")} lines={[group.topic || group.group_name, group.category, group.class_code || group.class_name, group.semester_name || group.semester_code].filter(Boolean)} /> : null}
      {mentor ? <InfoBox title={t("admin.mentorWorkflow.common.selectedMentor")} lines={[mentor.email, mentor.organization, mentor.position_title, mentor.years_of_experience != null ? t("admin.mentorWorkflow.common.years", { count: mentor.years_of_experience }) : null].filter(Boolean)} /> : null}
    </div>
  );
}

export function SessionForm({ form, setForm, assignments = [] }) {
  const { t } = useTranslation();
  const sessionTypeOptions = useSessionTypeOptions();
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("admin.mentorWorkflow.forms.assignment")}><Select value={form.assignment_id || ""} onChange={(value) => set("assignment_id", value)} options={[{ value: "", label: t("admin.mentorWorkflow.common.selectAssignment") }, ...assignments.map((item) => ({ value: String(item.id), label: `${item.group_name} · ${t(`status.${item.assignment_type}`)}` }))]} /></Field>
        <Field label={t("admin.mentorWorkflow.forms.sessionType")}><Select value={form.session_type || "online"} onChange={(value) => set("session_type", value)} options={sessionTypeOptions} /></Field>
        <Field label={t("admin.mentorWorkflow.forms.title")}><input className={inputClass} value={form.title || ""} onChange={(e) => set("title", e.target.value)} required /></Field>
        <Field label={t("admin.mentorWorkflow.forms.meetingLink")}><input className={inputClass} value={form.meeting_link || ""} onChange={(e) => set("meeting_link", e.target.value)} /></Field>
        <Field label={t("admin.mentorWorkflow.forms.start")}><input type="datetime-local" className={inputClass} value={form.scheduled_start_at || ""} onChange={(e) => set("scheduled_start_at", e.target.value)} required /></Field>
        <Field label={t("admin.mentorWorkflow.forms.end")}><input type="datetime-local" className={inputClass} value={form.scheduled_end_at || ""} onChange={(e) => set("scheduled_end_at", e.target.value)} required /></Field>
        <Field label={t("admin.mentorWorkflow.forms.location")}><input className={inputClass} value={form.location || ""} onChange={(e) => set("location", e.target.value)} /></Field>
      </div>
      <Field label={t("admin.mentorWorkflow.forms.description")}><textarea className={inputClass} rows={3} value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></Field>
    </div>
  );
}

export function InfoBox({ title, lines = [] }) {
  return <div className="rounded-card border border-border bg-subtle p-3"><p className="text-label text-text-muted">{title}</p><div className="mt-1 space-y-0.5 text-sm text-text-secondary">{lines.map((line) => <p key={line}>{line}</p>)}</div></div>;
}

export function MetricCard({ label, value }) {
  return <div className="rounded-card bg-subtle p-4"><p className="text-label text-text-secondary">{label}</p><p className="mt-2 text-2xl font-medium text-text-primary">{value ?? 0}</p></div>;
}
