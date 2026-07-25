import { ChevronDown } from "lucide-react";

/**
 * Select — control chọn dùng chung (presentational shell).
 * Chỉ lo phần vỏ/kiểu dáng theo token; logic tuỳ chọn để nơi gọi tự truyền.
 * (DropDown.jsx portal hiện có vẫn giữ nguyên cho các bộ lọc phức tạp.)
 *
 * Props:
 * - options : { value, label }[]
 * - value, onChange, disabled, className
 * - placeholder? : string
 */
export default function Select({
  options = [],
  value,
  onChange,
  disabled = false,
  placeholder,
  className = "",
}) {
  return (
    <div className={`relative inline-flex min-w-[120px] ${className}`}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="
          h-11 sm:h-9 w-full appearance-none
          rounded-control border border-border bg-surface
          pl-3 pr-9 text-sm font-medium text-text-primary
          hover:border-border-strong
          disabled:cursor-not-allowed disabled:bg-subtle disabled:text-text-muted
        "
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
      />
    </div>
  );
}

// ─── Ví dụ dùng ────────────────────────────────────────────────────────────
// <Select
//   value={sort}
//   onChange={(e) => setSort(e.target.value)}
//   options={[{ value: "new", label: "Mới nhất" }, { value: "old", label: "Cũ nhất" }]}
// />
