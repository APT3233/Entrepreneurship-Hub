import { X } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

export default function FormModal({ open, title, children, onClose, onSubmit, submitLabel = "Lưu", saving = false }) {
  const { t } = useTranslation();
  if (!open) return null;

  const finalSubmitLabel = submitLabel === "Lưu" ? t("common.save") : submitLabel;
  const finalCancelLabel = t("common.cancel");
  const finalSavingLabel = t("common.confirm") === "Xác nhận" ? "Đang lưu..." : "Saving...";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">
      <form
        onSubmit={onSubmit}
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 cursor-pointer" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-5 py-4">{children}</div>
        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer">
            {finalCancelLabel}
          </button>
          <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer">
            {saving ? finalSavingLabel : finalSubmitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">{label}</span>
      {children}
    </label>
  );
}

export const inputClass = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";
