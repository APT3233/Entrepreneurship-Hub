import { Search } from "lucide-react";

export default function SearchInput({ value, onChange, placeholder = "Tìm kiếm..." }) {
  return (
    <label className="relative block w-full sm:w-80">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm text-gray-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}
