import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

/* Cờ SVG (Windows không render flag emoji) */
function FlagVI({ className = "" }) {
  return (
    <svg viewBox="0 0 640 480" className={className} aria-hidden>
      <path fill="#da251d" d="M0 0h640v480H0z" />
      <path fill="#ff0" d="M320 120l35.3 108.6h114.2l-92.4 67.1 35.3 108.6L320 345l-92.4 67.1 35.3-108.6-92.4-67.1h114.2z" />
    </svg>
  );
}
function FlagEN({ className = "" }) {
  return (
    <svg viewBox="0 0 640 480" className={className} aria-hidden>
      <rect width="640" height="480" fill="#fff" />
      <g fill="#b22234">
        {[0, 2, 4, 6, 8, 10, 12].map((i) => (
          <rect key={i} y={i * 36.9} width="640" height="36.9" />
        ))}
      </g>
      <rect width="256" height="258" fill="#3c3b6e" />
    </svg>
  );
}

const LANGS = {
  vi: { label: "Tiếng Việt", Flag: FlagVI },
  en: { label: "English", Flag: FlagEN },
};

export default function LanguageSwitcher() {
  const { language, changeLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const cur = LANGS[language] || LANGS.vi;
  const CurFlag = cur.Flag;

  return (
    <div ref={ref} className="relative select-none shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-full border border-border bg-surface hover:bg-subtle transition-colors text-sm font-medium text-text-primary cursor-pointer"
      >
        <span className="w-[18px] h-[13px] rounded-[2px] overflow-hidden shrink-0 ring-1 ring-black/5 grid">
          <CurFlag className="w-full h-full" />
        </span>
        <span className="hidden sm:inline">{cur.label}</span>
        <ChevronDown size={14} className={`text-text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-surface border border-border rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
          {Object.entries(LANGS).map(([code, { label, Flag }]) => {
            const active = language === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => { changeLanguage(code); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                  active ? "text-accent bg-accent-bg/60" : "text-text-secondary hover:bg-subtle"
                }`}
              >
                <span className="w-[18px] h-[13px] rounded-[2px] overflow-hidden shrink-0 ring-1 ring-black/5 grid">
                  <Flag className="w-full h-full" />
                </span>
                <span className="flex-1">{label}</span>
                {active && <Check size={15} className="text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
