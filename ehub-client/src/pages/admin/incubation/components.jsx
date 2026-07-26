import { FileText, Rocket, Save, Trash2, Upload } from "lucide-react";
import AdminTable from "@/pages/admin/components/AdminTable";
import { Field, inputClass } from "@/pages/admin/components/FormModal";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import { useTranslation } from "@/context/TranslationContext";
import { formatDate } from "@/utils/dateTimeDisplay";
import Dropdown from "@/components/ui/filter/DropDown";

export const productStageOptions = ["idea", "prototype", "mvp", "beta", "launched", "revenue", "company"].map((value) => ({ value, label: value }));
export const startupStatusOptions = ["candidate", "incubating", "active", "on_hold", "graduated", "archived", "rejected"].map((value) => ({ value, label: value }));
export const sourceOptions = ["module3_selection", "manual_nomination", "showcase", "alumni", "other"].map((value) => ({ value, label: value }));
export const reviewStatusOptions = ["pending", "approved", "rejected", "needs_more_info"].map((value) => ({ value, label: value }));
export const reviewSourceOptions = ["evaluation_result", "manual", "showcase", "mentor_recommendation", "ai_suggestion"].map((value) => ({ value, label: value }));
export const documentTypeOptions = ["pitch_deck", "business_plan", "demo_video", "logo", "certificate", "report", "other"].map((value) => ({ value, label: value }));
export const visibilityOptions = ["private", "internal", "public"].map((value) => ({ value, label: value }));
export const milestoneTypeOptions = ["product", "business", "team", "revenue", "funding", "award", "partnership", "legal", "other"].map((value) => ({ value, label: value }));
export const progressTypeOptions = ["product", "business", "customer", "revenue", "team", "mentor", "market", "legal", "other"].map((value) => ({ value, label: value }));
export const supportNeedTypeOptions = ["business", "technical", "mentor", "funding_connection", "legal_advice", "marketing", "product", "other"].map((value) => ({ value, label: value }));
export const supportPriorityOptions = ["low", "normal", "high", "urgent"].map((value) => ({ value, label: value }));
export const supportStatusOptions = ["open", "in_progress", "resolved", "cancelled"].map((value) => ({ value, label: value }));
export const supportActivityTypeOptions = ["mentor_session", "workshop", "partner_intro", "investor_intro", "review_meeting", "demo_day", "other"].map((value) => ({ value, label: value }));
export const eventTypeOptions = ["demo_day", "pitching_day", "showcase", "workshop", "networking", "competition", "other"].map((value) => ({ value, label: value }));
export const eventStatusOptions = ["draft", "published", "completed", "cancelled", "archived"].map((value) => ({ value, label: value }));
export const participantStatusOptions = ["invited", "confirmed", "presented", "absent", "withdrawn"].map((value) => ({ value, label: value }));
export const judgeTypeOptions = ["lecturer", "mentor", "partner", "investor", "guest"].map((value) => ({ value, label: value }));
export const interestLevelOptions = ["none", "low", "medium", "high", "follow_up"].map((value) => ({ value, label: value }));
export const awardTypeOptions = ["winner", "runner_up", "best_pitch", "best_technology", "best_business_model", "social_impact", "other"].map((value) => ({ value, label: value }));
export const mediaTypeOptions = ["image", "video", "document", "link", "other"].map((value) => ({ value, label: value }));

export function SelectField({ value, onChange, options = [], className = "", disabled = false }) {
  const normalizedValue = value !== null && value !== undefined ? String(value) : "";
  const normalizedOptions = options.map((opt) => ({ ...opt, value: String(opt.value) }));
  const selectedOpt = normalizedOptions.find((opt) => opt.value === normalizedValue);
  const label = selectedOpt ? selectedOpt.label : "";

  return (
    <div className={`w-full [&>div]:w-full [&>div>button]:h-[42px] [&>div>button]:rounded-control [&>div>button]:border-border [&>div>button]:text-text-primary [&>div>button]:font-normal ${className}`}>
      <Dropdown
        label={label}
        value={normalizedValue}
        onChange={onChange}
        options={normalizedOptions}
        disabled={disabled}
        className="relative min-w-0 w-full"
      />
    </div>
  );
}

export function StartupLogo({ startup, size = "md" }) {
  const cls = size === "lg" ? "h-16 w-16 text-xl" : "h-10 w-10 text-sm";
  if (startup?.logo_url) return <img src={startup.logo_url} alt="" className={`${cls} rounded-card border border-border object-cover`} />;
  return <div className={`${cls} flex items-center justify-center rounded-card bg-accent-bg font-medium text-accent`}><Rocket size={size === "lg" ? 28 : 18} /></div>;
}

export function StartupHeader({ startup }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <StartupLogo startup={startup} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-h1 font-medium text-text-primary">{startup.startup_name}</h2>
            <p className="mt-1 text-sm text-text-secondary">{startup.tagline || startup.topic || startup.short_description || t("admin.ecosystem.shared.noTagline")}</p>
            <div className="mt-2 flex flex-wrap gap-2"><StatusBadge value={startup.startup_status} /><StatusBadge value={startup.product_stage} />{startup.current_stage_name ? <StatusBadge value={startup.current_stage_code || startup.current_stage_name} /> : null}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Metric value={startup.founder_count || 0} label={t("admin.ecosystem.shared.founders")} />
          <Metric value={startup.milestone_count || 0} label={t("admin.ecosystem.columns.milestones")} tone="emerald" />
          <Metric value={startup.document_count || 0} label={t("admin.ecosystem.shared.docs")} tone="amber" />
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
export function Metric({ value, label, tone = "indigo" }) {
  return <div className="rounded-card bg-subtle px-4 py-3"><p className="text-lg font-medium text-text-primary">{value ?? 0}</p><p className="text-[11px] text-text-secondary">{label}</p></div>;
}

export function Panel({ title, actions, children }) {
  return <div className="rounded-card border border-border bg-surface p-5"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-sm font-medium text-text-primary">{title}</h3>{actions}</div>{children}</div>;
}

export function StartupForm({ form, setForm, showStatus = true }) {
  const { t } = useTranslation();
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const f = (key) => t(`admin.ecosystem.form.${key}`);
  const localize = (options) => options.map((opt) => {
    const key = `status.${opt.value}`;
    const label = t(key, { defaultValue: opt.label });
    return { ...opt, label: label === key ? opt.label : label };
  });
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={f("startupName")}><input required className={inputClass} value={form.startup_name || ""} onChange={(e) => set("startup_name", e.target.value)} /></Field>
          <Field label={f("slug")}><input className={inputClass} value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} /></Field>
          <Field label={f("tagline")}><input className={inputClass} value={form.tagline || ""} onChange={(e) => set("tagline", e.target.value)} /></Field>
          <Field label={f("logoUrl")}><input className={inputClass} value={form.logo_url || ""} onChange={(e) => set("logo_url", e.target.value)} /></Field>
          <Field label={f("category")}><input className={inputClass} value={form.category || ""} onChange={(e) => set("category", e.target.value)} /></Field>
          <Field label={f("industry")}><input className={inputClass} value={form.industry || ""} onChange={(e) => set("industry", e.target.value)} /></Field>
        </div>
        <Field label={f("shortDescription")}><textarea className={inputClass} rows={3} value={form.short_description || ""} onChange={(e) => set("short_description", e.target.value)} /></Field>
        <Field label={f("fullDescription")}><textarea className={inputClass} rows={5} value={form.full_description || ""} onChange={(e) => set("full_description", e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={f("problem")}><textarea className={inputClass} rows={4} value={form.problem_statement || ""} onChange={(e) => set("problem_statement", e.target.value)} /></Field>
          <Field label={f("solution")}><textarea className={inputClass} rows={4} value={form.solution_description || ""} onChange={(e) => set("solution_description", e.target.value)} /></Field>
          <Field label={f("targetCustomers")}><textarea className={inputClass} rows={4} value={form.target_customers || ""} onChange={(e) => set("target_customers", e.target.value)} /></Field>
          <Field label={f("businessModel")}><textarea className={inputClass} rows={4} value={form.business_model || ""} onChange={(e) => set("business_model", e.target.value)} /></Field>
        </div>
      </div>
      <div className="space-y-4">
        <Field label={f("productStage")}><SelectField value={form.product_stage || "idea"} onChange={(v) => set("product_stage", v)} options={localize(productStageOptions)} /></Field>
        {showStatus ? <Field label={t("common.status")}><SelectField value={form.startup_status || "candidate"} onChange={(v) => set("startup_status", v)} options={localize(startupStatusOptions)} /></Field> : null}
        <Field label={f("source")}><SelectField value={form.source || "manual_nomination"} onChange={(v) => set("source", v)} options={localize(sourceOptions)} /></Field>
        <Field label={f("website")}><input className={inputClass} value={form.website_url || ""} onChange={(e) => set("website_url", e.target.value)} /></Field>
        <Field label={f("github")}><input className={inputClass} value={form.github_url || ""} onChange={(e) => set("github_url", e.target.value)} /></Field>
        <Field label={f("demo")}><input className={inputClass} value={form.demo_url || ""} onChange={(e) => set("demo_url", e.target.value)} /></Field>
        <Field label={f("pitchDeckUrl")}><input className={inputClass} value={form.pitch_deck_url || ""} onChange={(e) => set("pitch_deck_url", e.target.value)} /></Field>
        <Field label={f("videoUrl")}><input className={inputClass} value={form.video_url || ""} onChange={(e) => set("video_url", e.target.value)} /></Field>
        <Field label={f("technologyTags")}><input className={inputClass} value={(form.technology_tags || []).join(", ")} onChange={(e) => set("technology_tags", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} placeholder="ai, mobile, fintech" /></Field>
      </div>
    </div>
  );
}

export function SaveButton({ saving, children }) {
  const { t } = useTranslation();
  return <button disabled={saving} className="inline-flex items-center gap-2 rounded-control bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"><Save size={16} /> {children || t("admin.ecosystem.common.save")}</button>;
}

export function DocumentUploadForm({ upload, setUpload, onSubmit, saving }) {
  const { t } = useTranslation();
  return (
    <form onSubmit={onSubmit} className="mb-4 grid gap-3 rounded-card bg-subtle p-3 md:grid-cols-[170px_150px_1fr_auto]">
      <Field label={t("admin.ecosystem.common.type")}><SelectField value={upload.document_type} onChange={(value) => setUpload((prev) => ({ ...prev, document_type: value }))} options={documentTypeOptions} /></Field>
      <Field label={t("admin.ecosystem.common.visibility")}><SelectField value={upload.visibility} onChange={(value) => setUpload((prev) => ({ ...prev, visibility: value }))} options={visibilityOptions} /></Field>
      <Field label={t("admin.ecosystem.shared.file")}><input type="file" className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-control file:border-0 file:bg-accent-bg file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent" onChange={(e) => setUpload((prev) => ({ ...prev, file: e.target.files?.[0] || null }))} /></Field>
      <button disabled={saving} className="mt-5 inline-flex items-center justify-center gap-2 rounded-control bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"><Upload size={16} /> {t("admin.ecosystem.shared.upload")}</button>
    </form>
  );
}

export function DocumentsTable({ documents, onDelete }) {
  const { t } = useTranslation();
  const columns = [
    { key: "document_type", label: t("admin.ecosystem.common.type"), width: 130, render: (row) => <StatusBadge value={row.document_type} /> },
    { key: "file_name", label: t("admin.ecosystem.shared.file"), render: (row) => <a href={row.file_url} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">{row.file_name}</a> },
    { key: "visibility", label: t("admin.ecosystem.common.visibility"), width: 120, render: (row) => <StatusBadge value={row.visibility} /> },
    { key: "uploaded_by_name", label: t("admin.ecosystem.shared.uploadedBy"), width: 160, render: (row) => row.uploaded_by_name || "-" },
    { key: "created_at", label: t("admin.ecosystem.columns.created"), width: 150, render: (row) => formatDate(row.created_at) },
    { key: "actions", label: "", width: 80, render: (row) => <button type="button" onClick={() => onDelete(row)} className="rounded-control p-2 text-danger-text hover:bg-danger-bg"><Trash2 size={16} /></button> },
  ];
  return <AdminTable columns={columns} rows={documents || []} emptyText={t("admin.ecosystem.shared.noDocuments")} />;
}

export function EmptyPlaceholder({ text }) {
  return <div className="rounded-card border border-dashed border-border bg-subtle p-8 text-center text-sm font-medium text-text-muted"><FileText className="mx-auto mb-2 text-text-muted" />{text}</div>;
}
