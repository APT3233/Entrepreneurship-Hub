import { Filter, X } from "lucide-react";
import Dropdown from "@/components/ui/filter/DropDown";
import { useTranslation } from "@/context/TranslationContext";

export default function FilterBar({
  children,
  right,
  search,
  activeFilterCount = 0,
  onClear,
}) {
  const { t } = useTranslation();
  const showToolbar = search || right || (activeFilterCount > 0 && onClear);

  return (
    <div className="mb-5 overflow-hidden rounded-card border border-border bg-surface">
      {showToolbar ? (
        <div className="flex flex-col gap-3 border-b border-border bg-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="hidden shrink-0 items-center gap-2 text-text-secondary sm:flex">
              <Filter size={15} />
              <span className="text-[11px] font-medium uppercase tracking-wider">{t("filterBar.title")}</span>
            </div>
            {search ? <div className="min-w-0 flex-1">{search}</div> : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {activeFilterCount > 0 && onClear ? (
              <button
                type="button"
                onClick={onClear}
                className="inline-flex items-center gap-1.5 rounded-control border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-border-strong hover:bg-subtle"
              >
                <X size={14} />
                {t("filterBar.clear")}
                <span className="rounded-full bg-accent-bg px-1.5 py-0.5 text-[10px] font-medium text-accent">
                  {activeFilterCount}
                </span>
              </button>
            ) : null}
            {right}
          </div>
        </div>
      ) : null}
      {children ? (
        <div className="p-4">
          <div className="grid items-end grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options = [], className = "", disabled = false }) {
  const normalizedValue = value !== null && value !== undefined ? String(value) : "";
  const normalizedOptions = options.map((opt) => ({ ...opt, value: String(opt.value) }));

  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">{label}</span>
      <Dropdown
        label={label}
        value={normalizedValue}
        onChange={onChange}
        options={normalizedOptions}
        disabled={disabled}
        className="relative w-full min-w-0"
      />
    </div>
  );
}

export function AdminSemesterFilterGroup({
  filterYear,
  semesterId,
  yearOptions,
  semesterOptions,
  onYearChange,
  onSemesterChange,
}) {
  const { t } = useTranslation();

  return (
    <>
      <FilterSelect
        label={t("filterLabels.year")}
        value={filterYear ?? ""}
        onChange={onYearChange}
        options={yearOptions}
      />
      <FilterSelect
        label={t("filterLabels.semester")}
        value={semesterId}
        onChange={onSemesterChange}
        options={semesterOptions}
        disabled={filterYear == null}
      />
    </>
  );
}

export function FilterDateField({ label, value, onChange }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">{label}</span>
      <input
        type="date"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-control border border-border bg-surface px-3 text-sm text-text-secondary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
      />
    </div>
  );
}
