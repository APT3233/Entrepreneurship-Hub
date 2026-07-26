import { X } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

export default function FormModal({ open, title, children, onClose, onSubmit, submitLabel = "Lưu", saving = false }) {
  const { t } = useTranslation();
  if (!open) return null;

  const finalSubmitLabel = submitLabel === "Lưu" ? t("common.save") : submitLabel;
  const finalCancelLabel = t("common.cancel");
  const finalSavingLabel = t("common.saving");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">
      <form
        onSubmit={onSubmit}
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-card border border-border bg-surface"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-h1 font-medium text-text-primary">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-control p-2 text-text-muted hover:bg-subtle hover:text-text-secondary cursor-pointer" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-5 py-4">{children}</div>
        <div className="flex justify-end gap-2 border-t border-border bg-subtle px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-control px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-subtle cursor-pointer">
            {finalCancelLabel}
          </button>
          <button type="submit" disabled={saving} className="rounded-control bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 cursor-pointer">
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
      <span className="mb-1.5 block text-label font-medium text-text-secondary">{label}</span>
      {children}
    </label>
  );
}

export const inputClass = "w-full rounded-control border border-border px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent";
