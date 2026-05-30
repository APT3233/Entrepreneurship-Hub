import Dropdown from "@/components/ui/filter/DropDown";

export default function FilterBar({ children, right }) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options = [] }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500 font-medium">{label}</span>
      <Dropdown
        label={label}
        value={value}
        onChange={onChange}
        options={options}
      />
    </div>
  );
}

