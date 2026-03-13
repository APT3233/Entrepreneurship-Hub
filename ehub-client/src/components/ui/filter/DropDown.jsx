import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

// ── Dropdown dùng chung ──────────────────────────────────────────────────────
function Dropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium pointer
          bg-white transition-all duration-150 min-w-[96px]
          ${open
            ? "border-indigo-400 ring-2 ring-indigo-100 text-gray-700"
            : "border-gray-200 text-gray-600 hover:border-gray-300"
          }
        `}
      >
        <span className="flex-1 text-left">
          {selected ? selected.label : label}
        </span>
        <ChevronDown
          size={15}
          className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown list */}
      {open && (
        <div className="
          absolute top-[calc(100%+6px)] left-0 z-50
          bg-white border border-gray-100 rounded-xl shadow-lg
          min-w-[140px] overflow-hidden
          animate-in fade-in slide-in-from-top-1 duration-150
        ">
          {/* Header — hiện giá trị đang chọn */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">
              {selected ? selected.label : label}
            </span>
            <ChevronDown size={14} className="text-gray-400 rotate-180" />
          </div>

          {/* Options */}
          <ul className="py-1 max-h-56 overflow-y-auto">
            {options.map((opt) => {
              const isActive = opt.value === value;
              return (
                <li key={opt.value}>
                  <button
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={`
                      w-full text-left px-4 py-2.5 text-sm font-medium
                      transition-colors duration-100 cursor-pointer
                      ${isActive
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-600 hover:bg-gray-50"
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Dropdown;