import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/context/TranslationContext";

export default function LanguageSwitcher() {
  const { language, changeLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative select-none shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all text-xs font-bold text-slate-700 shadow-sm cursor-pointer animate-in fade-in duration-200"
      >
        <span>{language === "vi" ? "🇻🇳 VI" : "🇺🇸 EN"}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 w-32 bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
          <button
            type="button"
            onClick={() => { changeLanguage("vi"); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer ${language === "vi" ? "text-indigo-600 bg-indigo-50/50" : "text-slate-600"}`}
          >
            <span>🇻🇳 Tiếng Việt</span>
          </button>
          <button
            type="button"
            onClick={() => { changeLanguage("en"); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer ${language === "en" ? "text-indigo-600 bg-indigo-50/50" : "text-slate-600"}`}
          >
            <span>🇺🇸 English</span>
          </button>
        </div>
      )}
    </div>
  );
}
