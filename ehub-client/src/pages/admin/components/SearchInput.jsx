import { Search } from "lucide-react";

export default function SearchInput({ value, onChange, placeholder = "Tìm kiếm..." }) {
  return (
    <label className="relative block w-full min-w-0">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-control border border-border bg-surface pl-9 pr-3 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
      />
    </label>
  );
}
