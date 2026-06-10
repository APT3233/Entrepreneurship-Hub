import { useMemo } from "react";
import { useTranslation } from "@/context/TranslationContext";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { Field, inputClass } from "@/pages/admin/components/FormModal";
import { Select, usePriorityOptions } from "@/pages/admin/mentor-workflow/components";

const mentorTypeValues = ["any", "business", "technical"];
const matchingStatusValues = ["pending", "generated", "approved", "rejected", "converted_to_assignment", "cancelled"];

function localizeOptions(t, values) {
  return values.map((value) => ({ value, label: t(`status.${value}`) }));
}

export function useMentorTypeOptions() {
  const { t } = useTranslation();
  return useMemo(() => localizeOptions(t, mentorTypeValues), [t]);
}

export function useMatchingStatusOptions() {
  const { t } = useTranslation();
  return useMemo(() => localizeOptions(t, matchingStatusValues), [t]);
}

/** @deprecated use useMentorTypeOptions */
export const mentorTypeOptions = mentorTypeValues.map((value) => ({ value, label: value }));
export { usePriorityOptions } from "@/pages/admin/mentor-workflow/components";
/** @deprecated use usePriorityOptions */
export { priorityOptions } from "@/pages/admin/mentor-workflow/components";
/** @deprecated use useMatchingStatusOptions */
export const matchingStatusOptions = matchingStatusValues.map((value) => ({ value, label: value }));

export function MatchingRequestForm({ form, setForm, groups = [], expertise = [], lockedGroupId = null }) {
  const { t } = useTranslation();
  const mentorTypeOptions = useMentorTypeOptions();
  const priorityOptions = usePriorityOptions();
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const selectedExpertise = new Set((form.required_expertise || []).map(String));
  const toggleExpertise = (id) => {
    const next = new Set(selectedExpertise);
    if (next.has(String(id))) next.delete(String(id));
    else next.add(String(id));
    set("required_expertise", [...next].map(Number));
  };
  const groupId = lockedGroupId || form.group_id || "";
  const group = groups.find((item) => String(item.id) === String(groupId));
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("admin.mentorMatching.forms.group")}><Select disabled={!!lockedGroupId} value={groupId} onChange={(value) => set("group_id", value)} options={[{ value: "", label: t("admin.mentorWorkflow.common.selectGroup") }, ...groups.map((item) => ({ value: String(item.id), label: `${item.group_name || item.group_code} · ${item.class_code || ""}` }))]} /></Field>
        <Field label={t("admin.mentorMatching.forms.preferredMentorType")}><Select value={form.preferred_mentor_type || "any"} onChange={(value) => set("preferred_mentor_type", value)} options={mentorTypeOptions} /></Field>
        <Field label={t("admin.mentorMatching.forms.priority")}><Select value={form.priority || "normal"} onChange={(value) => set("priority", value)} options={priorityOptions} /></Field>
      </div>
      <Field label={t("admin.mentorMatching.forms.supportNeeded")}><textarea className={inputClass} rows={4} value={form.support_needed || ""} onChange={(event) => set("support_needed", event.target.value)} required /></Field>
      {expertise.length ? <Field label={t("admin.mentorMatching.forms.requiredExpertise")}><div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3">{expertise.map((item) => <button type="button" key={item.id} onClick={() => toggleExpertise(item.id)} className={`rounded-full px-3 py-1 text-xs font-bold ${selectedExpertise.has(String(item.id)) ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{item.name}</button>)}</div></Field> : null}
      {group ? <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600"><p className="font-black text-slate-900">{group.topic || group.group_name}</p><p>{group.category || t("admin.mentorWorkflow.common.noCategory")}</p></div> : null}
    </div>
  );
}

export function ScoreBadge({ score }) {
  const value = Number(score || 0);
  const tone = value >= 85 ? "bg-emerald-50 text-emerald-700" : value >= 70 ? "bg-teal-50 text-teal-700" : value >= 50 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${tone}`}>{value.toFixed(1)}</span>;
}

export function SuggestionSummary({ suggestion }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2"><ScoreBadge score={suggestion.score} /><StatusBadge value={suggestion.match_level} /><StatusBadge value={suggestion.matching_method} /></div>
      <p className="text-sm font-medium text-slate-700">{suggestion.reason}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <ListBox title={t("admin.mentorMatching.suggestion.strengths")} items={suggestion.strengths} empty={t("admin.mentorMatching.suggestion.noStrengths")} />
        <ListBox title={t("admin.mentorMatching.suggestion.risks")} items={suggestion.risks} empty={t("admin.mentorMatching.suggestion.noRisks")} />
      </div>
    </div>
  );
}

function ListBox({ title, items = [], empty }) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-xs font-black uppercase text-slate-400">{title}</p><div className="mt-2 space-y-1 text-sm font-medium text-slate-700">{items?.length ? items.map((item) => <p key={item}>- {item}</p>) : <p>{empty}</p>}</div></div>;
}
