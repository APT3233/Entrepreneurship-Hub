import { useMemo } from "react";
import { Plus, Trash2, UserRound } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { Field, inputClass } from "@/pages/admin/components/FormModal";
import Dropdown from "@/components/ui/filter/DropDown";

export const mentorTypeOptions = [
  { value: "business", label: "Business Mentor" },
  { value: "technical", label: "Technical Mentor" },
  { value: "internal_lecturer", label: "Internal Lecturer Mentor" },
  { value: "external_expert", label: "External Expert" },
];

export const mentorStatusOptions = ["pending", "active", "inactive", "rejected", "archived"].map((value) => ({ value, label: value }));
export const visibilityOptions = ["private", "internal", "public"].map((value) => ({ value, label: value }));
export const expertiseLevelOptions = ["beginner", "intermediate", "advanced", "expert"].map((value) => ({ value, label: value }));
export const documentTypeOptions = ["cv", "resume", "portfolio", "certificate", "other"].map((value) => ({ value, label: value }));
export const expertiseCategoryOptions = ["business", "technical", "product", "marketing", "finance", "legal", "ai", "data", "other"].map((value) => ({ value, label: value }));

const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function MentorAvatar({ mentor, size = "md" }) {
  const className = size === "lg" ? "h-16 w-16 text-lg" : "h-10 w-10 text-sm";
  if (mentor?.avatar_url) {
    return <img src={mentor.avatar_url} alt="" className={`${className} rounded-full border border-slate-100 object-cover`} />;
  }
  return (
    <div className={`${className} flex items-center justify-center rounded-full bg-teal-50 font-black text-teal-700`}>
      {(mentor?.full_name || "M").slice(0, 1).toUpperCase()}
    </div>
  );
}

export function ExpertiseTag({ label }) {
  return <span className="inline-flex rounded-full border border-teal-100 bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700">{label}</span>;
}

export function MentorHeader({ mentor }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <MentorAvatar mentor={mentor} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black text-slate-900">{mentor.full_name}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{mentor.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge value={mentor.status} />
              <StatusBadge value={mentor.mentor_type} />
              <StatusBadge value={mentor.visibility} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Metric value={mentor.total_expertise || 0} label={t("admin.mentors.expertise")} />
          <Metric value={mentor.active_availability_slots || 0} label={t("admin.mentors.slots") || "Slots"} tone="emerald" />
          <Metric value={mentor.total_documents || 0} label={t("admin.mentors.documents") || "Documents"} tone="amber" />
        </div>
      </div>
    </div>
  );
}

function Metric({ value, label, tone = "teal" }) {
  const tones = {
    teal: "bg-teal-50 text-teal-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className={`rounded-xl px-4 py-3 ${tones[tone] || tones.teal}`}>
      <p className="text-lg font-black">{value}</p>
      <p className="text-[11px] font-bold uppercase opacity-70">{label}</p>
    </div>
  );
}

export function MentorForm({ form, setForm, showStatus = false }) {
  const { t } = useTranslation();
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const localizedTypeOptions = useMemo(() => mentorTypeOptions.map((opt) => ({ value: opt.value, label: t(`status.${opt.value}`) })), [t]);
  const localizedVisibilityOptions = useMemo(() => visibilityOptions.map((v) => ({ value: v, label: t(`status.${v}`) })), [t]);
  const localizedStatusOptions = useMemo(() => mentorStatusOptions.map((s) => ({ value: s, label: t(`status.${s}`) })), [t]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><UserRound size={16} /></span>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{t("admin.mentors.tabs.profile")}</h3>
            <p className="text-xs text-slate-400">{t("admin.mentors.fields.profileSub") || "Mentor identity and public-facing information"}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field label={t("admin.mentors.fields.fullName")}><input className={inputClass} value={form.full_name || ""} onChange={(e) => set("full_name", e.target.value)} required /></Field>
          <Field label={t("admin.mentors.fields.email")}><input type="email" className={inputClass} value={form.email || ""} onChange={(e) => set("email", e.target.value)} required /></Field>
          <Field label={t("admin.mentors.fields.phone")}><input className={inputClass} value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label={t("admin.mentors.fields.mentorType")}><Select value={form.mentor_type || "business"} onChange={(value) => set("mentor_type", value)} options={localizedTypeOptions} /></Field>
          <Field label={t("admin.mentors.fields.visibility")}><Select value={form.visibility || "internal"} onChange={(value) => set("visibility", value)} options={localizedVisibilityOptions} /></Field>
          {showStatus ? <Field label={t("admin.mentors.fields.status")}><Select value={form.status || "pending"} onChange={(value) => set("status", value)} options={localizedStatusOptions} /></Field> : null}
          <Field label={t("admin.mentors.fields.organization")}><input className={inputClass} value={form.organization || ""} onChange={(e) => set("organization", e.target.value)} /></Field>
          <Field label={t("admin.mentors.fields.position")}><input className={inputClass} value={form.position_title || ""} onChange={(e) => set("position_title", e.target.value)} /></Field>
          <Field label={t("admin.mentors.fields.yearsOfExperience")}><input type="number" min="0" className={inputClass} value={form.years_of_experience ?? ""} onChange={(e) => set("years_of_experience", e.target.value === "" ? null : Number(e.target.value))} /></Field>
          <Field label={t("admin.mentors.fields.avatarUrl")}><input className={inputClass} value={form.avatar_url || ""} onChange={(e) => set("avatar_url", e.target.value)} /></Field>
          <Field label={t("admin.mentors.fields.linkedinUrl")}><input className={inputClass} value={form.linkedin_url || ""} onChange={(e) => set("linkedin_url", e.target.value)} /></Field>
          <Field label={t("admin.mentors.fields.portfolioUrl")}><input className={inputClass} value={form.portfolio_url || ""} onChange={(e) => set("portfolio_url", e.target.value)} /></Field>
        </div>
        <div className="mt-4">
          <Field label={t("admin.mentors.fields.bio")}><textarea className={inputClass} rows={4} value={form.bio || ""} onChange={(e) => set("bio", e.target.value)} /></Field>
        </div>
      </div>
    </div>
  );
}

export function Select({ value, onChange, options = [], disabled = false }) {
  const normalizedValue = value !== null && value !== undefined ? String(value) : "";
  const normalizedOptions = options.map((opt) => ({ ...opt, value: String(opt.value) }));
  const selectedOpt = normalizedOptions.find((opt) => opt.value === normalizedValue);
  const label = selectedOpt ? selectedOpt.label : "";

  return (
    <div className="w-full [&>div]:w-full [&>div>button]:h-[42px] [&>div>button]:rounded-xl [&>div>button]:border-gray-200 [&>div>button]:text-gray-800 [&>div>button]:font-normal">
      <Dropdown
        label={label}
        value={normalizedValue}
        onChange={onChange}
        options={normalizedOptions}
        disabled={disabled}
      />
    </div>
  );
}

export function ExpertiseEditor({ areas = [], items = [], setItems, disabled = false }) {
  const { t } = useTranslation();
  const areaOptions = useMemo(() => areas.map((area) => ({ value: String(area.id), label: `${area.name} · ${t("status." + area.category, area.category)}` })), [areas, t]);
  const addRow = () => setItems([...(items || []), { expertise_id: areaOptions[0]?.value || "", level: "intermediate", years_experience: null, note: "" }]);
  const update = (index, patch) => setItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const remove = (index) => setItems(items.filter((_, i) => i !== index));
  const localizedLevelOptions = useMemo(() => expertiseLevelOptions.map((l) => ({ value: l, label: t(`status.${l}`) })), [t]);

  return (
    <div className="space-y-3">
      {(items || []).map((item, index) => (
        <div key={`${item.expertise_id}-${index}`} className="grid gap-3 rounded-xl border border-slate-100 bg-white p-3 md:grid-cols-[1.5fr_1fr_1fr_1.4fr_auto]">
          <Select disabled={disabled} value={String(item.expertise_id || "")} onChange={(value) => update(index, { expertise_id: value })} options={areaOptions} />
          <Select disabled={disabled} value={item.level || "intermediate"} onChange={(value) => update(index, { level: value })} options={localizedLevelOptions} />
          <input disabled={disabled} type="number" min="0" className={inputClass} placeholder={t("admin.mentors.expertiseEditor.yearsPlaceholder") || "Years"} value={item.years_experience ?? ""} onChange={(e) => update(index, { years_experience: e.target.value === "" ? null : Number(e.target.value) })} />
          <input disabled={disabled} className={inputClass} placeholder={t("admin.mentors.expertiseEditor.notePlaceholder") || "Note"} value={item.note || ""} onChange={(e) => update(index, { note: e.target.value })} />
          <button disabled={disabled} type="button" onClick={() => remove(index)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 disabled:opacity-40"><Trash2 size={16} /></button>
        </div>
      ))}
      <button disabled={disabled || !areaOptions.length} type="button" onClick={addRow} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
        <Plus size={16} /> {t("admin.mentors.expertiseEditor.addExpertise") || "Add expertise"}
      </button>
    </div>
  );
}

export function AvailabilityEditor({ items = [], setItems, disabled = false }) {
  const { t } = useTranslation();
  const addRow = () => setItems([...(items || []), { day_of_week: 1, start_time: "09:00", end_time: "10:00", timezone: "Asia/Ho_Chi_Minh", max_sessions_per_week: null, note: "", status: "active" }]);
  const update = (index, patch) => setItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const remove = (index) => setItems(items.filter((_, i) => i !== index));
  return (
    <div className="space-y-3">
      {(items || []).map((item, index) => (
        <div key={index} className="grid gap-3 rounded-xl border border-slate-100 bg-white p-3 md:grid-cols-[1fr_0.8fr_0.8fr_1fr_0.8fr_1.2fr_auto]">
          <Select disabled={disabled} value={String(item.day_of_week || 1)} onChange={(value) => update(index, { day_of_week: Number(value) })} options={[1,2,3,4,5,6,7].map((num) => ({ value: String(num), label: t(`admin.mentors.days.${num}`) }))} />
          <input disabled={disabled} type="time" className={inputClass} value={item.start_time || ""} onChange={(e) => update(index, { start_time: e.target.value })} />
          <input disabled={disabled} type="time" className={inputClass} value={item.end_time || ""} onChange={(e) => update(index, { end_time: e.target.value })} />
          <input disabled={disabled} className={inputClass} value={item.timezone || "Asia/Ho_Chi_Minh"} onChange={(e) => update(index, { timezone: e.target.value })} />
          <input disabled={disabled} type="number" min="0" className={inputClass} placeholder={t("admin.mentors.availabilityEditor.maxPerWeekPlaceholder") || "Max/wk"} value={item.max_sessions_per_week ?? ""} onChange={(e) => update(index, { max_sessions_per_week: e.target.value === "" ? null : Number(e.target.value) })} />
          <input disabled={disabled} className={inputClass} placeholder={t("admin.mentors.availabilityEditor.notePlaceholder") || "Note"} value={item.note || ""} onChange={(e) => update(index, { note: e.target.value })} />
          <button disabled={disabled} type="button" onClick={() => remove(index)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 disabled:opacity-40"><Trash2 size={16} /></button>
        </div>
      ))}
      <button disabled={disabled} type="button" onClick={addRow} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
        <Plus size={16} /> {t("admin.mentors.availabilityEditor.addAvailability") || "Add availability"}
      </button>
    </div>
  );
}
