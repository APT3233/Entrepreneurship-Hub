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
    <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      {showToolbar ? (
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-indigo-50/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="hidden shrink-0 items-center gap-2 text-slate-500 sm:flex">
              <Filter size={15} />
              <span className="text-[11px] font-bold uppercase tracking-wider">{t("filterBar.title")}</span>
            </div>
            {search ? <div className="min-w-0 flex-1">{search}</div> : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {activeFilterCount > 0 && onClear ? (
              <button
                type="button"
                onClick={onClear}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <X size={14} />
                {t("filterBar.clear")}
                <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
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
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
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
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <input
        type="date"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}
