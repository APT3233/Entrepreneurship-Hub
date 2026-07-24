import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

// ── Dropdown dùng chung (Sử dụng Portal để tránh lỗi overflow) ────────────────
function Dropdown({ label, options, value, onChange, disabled = false, direction = "down", className }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

  const updateCoords = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const isUp = direction === "up";
      setCoords({
        top: (isUp ? rect.top : rect.bottom) + window.scrollY,
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
  }, [open, direction]);

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
    <div ref={ref} className={className || "relative flex-1 min-w-0 md:flex-none md:w-auto md:min-w-[120px]"}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          flex items-center justify-between gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-control border text-sm font-medium w-full
          transition-colors duration-150
          ${disabled
            ? "bg-subtle border-border text-text-muted cursor-not-allowed"
            : "bg-surface cursor-pointer " + (open
              ? "border-accent ring-2 ring-accent/20 text-text-primary"
              : "border-border text-text-secondary hover:border-border-strong")
          }
        `}
      >
        <span className="text-left truncate">
          {selected ? selected.label : label}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-text-muted transition-transform duration-200 ${open ? (direction === "up" ? "-rotate-180" : "rotate-180") : ""}`}
        />
      </button>

      {/* Dropdown list - Render via Portal */}
      {open && !disabled && createPortal(
        <div 
          className="portal-dropdown fixed z-[9999] bg-surface border border-border rounded-control shadow-lg overflow-hidden animate-in fade-in duration-100"
          style={{
            top: coords.top - window.scrollY,
            left: coords.left,
            width: coords.width,
            transform: direction === "up" ? "translateY(-100%) translateY(-6px)" : "translateY(6px)",
          }}
        >
          {/* Header — hiện giá trị đang chọn */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <span className="text-sm font-medium text-text-primary">
              {selected ? selected.label : label}
            </span>
            <ChevronDown size={14} className={`text-text-muted ${direction === "up" ? "" : "rotate-180"}`} />
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
                        ? "bg-accent-bg text-accent"
                        : "text-text-secondary hover:bg-subtle"
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