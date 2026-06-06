import { useTranslation } from "@/context/TranslationContext";
import { Field, inputClass } from "@/pages/admin/components/FormModal";

export default function RubricCriterionFields({ form, onChange, disabled = false }) {
  const { t } = useTranslation();
  const setValue = (key, value) => onChange({ ...form, [key]: value });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label={t("admin.rubric.form.criterionName")}>
        <input
          className={inputClass}
          value={form.name || ""}
          onChange={(e) => setValue("name", e.target.value)}
          disabled={disabled}
          required
        />
      </Field>
      <Field label={t("admin.rubric.form.maxScore")}>
        <input
          type="number"
          min="0.01"
          step="0.01"
          className={inputClass}
          value={form.max_score || ""}
          onChange={(e) => setValue("max_score", e.target.value)}
          disabled={disabled}
          required
        />
      </Field>
      <Field label={t("admin.rubric.form.weight")}>
        <input
          type="number"
          min="0"
          step="0.0001"
          className={inputClass}
          value={form.weight ?? 1}
          onChange={(e) => setValue("weight", e.target.value)}
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-gray-400">{t("admin.rubric.form.weightHint")}</p>
      </Field>
      <Field label={t("admin.rubric.form.order")}>
        <input
          type="number"
          min="1"
          className={inputClass}
          value={form.order_index || 1}
          onChange={(e) => setValue("order_index", e.target.value)}
          disabled={disabled}
        />
      </Field>
      <label className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2.5 text-sm font-semibold text-gray-700 sm:col-span-2">
        <input
          type="checkbox"
          checked={Boolean(form.is_required_feedback)}
          onChange={(e) => setValue("is_required_feedback", e.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600"
        />
        {t("admin.rubric.form.requireFeedback")}
      </label>
      <div className="sm:col-span-2">
        <Field label={t("admin.columns.description")}>
          <textarea
            className={inputClass}
            rows={4}
            value={form.description || ""}
            onChange={(e) => setValue("description", e.target.value)}
            disabled={disabled}
          />
        </Field>
      </div>
    </div>
  );
}
