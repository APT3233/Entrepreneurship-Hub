import { BookOpen, ClipboardCheck, GraduationCap, ShieldCheck, UserRound } from "lucide-react";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { Field, inputClass } from "@/pages/admin/components/FormModal";
import Dropdown from "@/components/ui/filter/DropDown";
import { formatDate } from "@/utils/dateTimeDisplay";
import { useTranslation } from "@/context/TranslationContext";

export function LecturerAvatar({ lecturer, size = "md" }) {
  const className = size === "lg" ? "h-16 w-16 text-lg" : "h-10 w-10 text-sm";
  if (lecturer?.avatar_url) {
    return <img src={lecturer.avatar_url} alt="" className={`${className} rounded-full border border-border object-cover`} />;
  }
  return (
    <div className={`${className} flex items-center justify-center rounded-full bg-blue-50 font-black text-blue-700`}>
      {(lecturer?.full_name || lecturer?.username || "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

export function RoleBadge({ role }) {
  return (
    <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
      {role}
    </span>
  );
}

export function CountBadge({ value, tone = "slate" }) {
  const styles = {
    slate: "bg-slate-50 text-slate-700 border-border",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span className={`inline-flex min-w-8 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-bold ${styles[tone] || styles.slate}`}>
      {Number(value || 0)}
    </span>
  );
}

export function StatCard(props) {
  const { icon: Icon, label, value, sub } = props;
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{value ?? 0}</p>
          {sub ? <p className="mt-1 text-xs font-medium text-slate-500">{sub}</p> : null}
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

export function LecturerOverviewCards({ stats = {} }) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={GraduationCap} label={t("admin.fields.classesCount")} value={stats.total_classes} />
      <StatCard icon={BookOpen} label={t("admin.fields.activeClassesCount")} value={stats.active_classes} />
      <StatCard icon={ClipboardCheck} label={t("admin.fields.pendingGrading")} value={stats.pending_grading} />
      <StatCard icon={ShieldCheck} label={t("admin.fields.gradedSubmissionsCount")} value={stats.graded_submissions} />
    </div>
  );
}

export function LecturerForm({ form, setForm, mode = "create" }) {
  const { t } = useTranslation();
  const profile = form.profile || {};
  const setProfile = (patch) => setForm({ ...form, profile: { ...profile, ...patch } });
  return (
    <div className="space-y-5">
      {/* SECTION 1: ACCOUNT DETAILS */}
      <div className="rounded-card border border-border bg-slate-50/50 p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <UserRound size={16} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{t("profile.accountInfo")}</h3>
            <p className="text-xs text-slate-400">{t("admin.accountForm.subtitle")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Field label={t("admin.fields.fullName")}>
            <input className={inputClass} value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </Field>
          <Field label={t("admin.fields.username")}>
            <input className={inputClass} value={form.username || ""} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </Field>
          <Field label={t("admin.fields.email")}>
            <input type="email" className={inputClass} value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
          <Field label={t("admin.fields.phone")}>
            <input className={inputClass} value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label={t("admin.fields.status")}>
            <Dropdown
              label={t("admin.fields.status")}
              value={form.status || "active"}
              onChange={(value) => setForm({ ...form, status: value })}
              options={[
                { value: "active", label: t("status.active") },
                { value: "inactive", label: t("status.inactive") },
                { value: "locked", label: t("status.locked") },
              ]}
            />
          </Field>
          {mode === "create" ? (
            <Field label={t("admin.fields.password")}>
              <input type="password" className={inputClass} value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </Field>
          ) : null}
        </div>
      </div>

      {/* SECTION 2: PROFESSIONAL PROFILE */}
      <div className="rounded-card border border-border bg-slate-50/50 p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-bg text-accent">
            <GraduationCap size={16} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{t("profile.title")}</h3>
            <p className="text-xs text-slate-400">{t("admin.accountForm.profileSubtitle")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Field label={t("admin.fields.department")}>
            <input className={inputClass} value={profile.department || ""} onChange={(e) => setProfile({ department: e.target.value })} />
          </Field>
          <Field label={t("admin.fields.academicTitle")}>
            <input className={inputClass} value={profile.academic_title || ""} onChange={(e) => setProfile({ academic_title: e.target.value })} />
          </Field>
          <Field label={t("admin.fields.specialization")}>
            <input className={inputClass} value={profile.specialization || ""} onChange={(e) => setProfile({ specialization: e.target.value })} />
          </Field>
          <Field label={t("admin.fields.officeLocation")}>
            <input className={inputClass} value={profile.office_location || ""} onChange={(e) => setProfile({ office_location: e.target.value })} />
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("admin.fields.bio")}>
            <textarea className={inputClass} rows={2} value={profile.bio || ""} onChange={(e) => setProfile({ bio: e.target.value })} />
          </Field>
          <Field label={t("admin.fields.contactNote")}>
            <textarea className={inputClass} rows={2} value={profile.contact_note || ""} onChange={(e) => setProfile({ contact_note: e.target.value })} />
          </Field>
        </div>
      </div>
    </div>
  );
}

export function LecturerHeader({ lecturer }) {
  const { t } = useTranslation();
  return (
    <div className="mb-5 rounded-card border border-border bg-surface p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <LecturerAvatar lecturer={lecturer} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black text-slate-900">{lecturer.full_name}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{lecturer.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge value={lecturer.status} />
              {(lecturer.roles || []).map((role) => <RoleBadge key={role} role={role} />)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-lg font-black text-slate-900">{lecturer.total_active_classes || 0}</p>
            <p className="text-[11px] font-bold uppercase text-slate-400">{t("admin.fields.activeClassesCount")}</p>
          </div>
          <div className="rounded-xl bg-amber-50 px-4 py-3">
            <p className="text-lg font-black text-amber-700">{lecturer.total_pending_grading || 0}</p>
            <p className="text-[11px] font-bold uppercase text-amber-500">{t("admin.fields.pendingGradingCount")}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 px-4 py-3">
            <p className="text-lg font-black text-emerald-700">{lecturer.total_evaluated_submissions || 0}</p>
            <p className="text-[11px] font-bold uppercase text-emerald-500">{t("admin.fields.gradedSubmissionsCount")}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 text-xs font-medium text-slate-400">{t("admin.fields.lastLogin")}: {formatDate(lecturer.last_login_at)}</div>
    </div>
  );
}
