import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

// ── Dropdown dùng chung (Sử dụng Portal để tránh lỗi overflow) ────────────────
function Dropdown({ label, options, value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

  const updateCoords = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (open) {
      updateCoords();
      window.addEventListener("resize", updateCoords);
      window.addEventListener("scroll", updateCoords, true);
    }
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target) && !e.target.closest(".portal-dropdown")) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  const handleToggle = () => {
    if (!disabled) {
      if (!open) updateCoords();
      setOpen(!open);
    }
  };

  return (
    <div ref={ref} className="relative flex-1 min-w-0 md:flex-none md:w-auto md:min-w-[120px]">
      {/* Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          flex items-center justify-between gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg border text-sm font-medium w-full
          transition-all duration-150
          ${disabled
            ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-white cursor-pointer " + (open
              ? "border-indigo-400 ring-2 ring-indigo-100 text-gray-700"
              : "border-gray-200 text-gray-600 hover:border-gray-300")
          }
        `}
      >
        <span className="text-left truncate">
          {selected ? selected.label : label}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown list - Render via Portal */}
      {open && !disabled && createPortal(
        <div 
          className="portal-dropdown fixed z-[9999] bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden animate-in fade-in duration-100"
          style={{
            top: coords.top - window.scrollY + 6,
            left: coords.left,
            width: coords.width,
          }}
        >
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
        </div>,
        document.body
      )}
    </div>
  );
}

export default Dropdown;