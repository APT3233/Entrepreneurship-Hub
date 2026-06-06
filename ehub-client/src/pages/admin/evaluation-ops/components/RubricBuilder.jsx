import { useMemo } from "react";
import { useTranslation } from "@/context/TranslationContext";
import { inputClass, Field } from "@/pages/admin/components/FormModal";
import { getRubricStatusOptions } from "@/pages/admin/evaluation-ops/shared";

export default function RubricBuilder({ subjects = [], form, onChange, planned = false }) {
  const { t } = useTranslation();
  const setValue = (key, value) => onChange?.({ ...form, [key]: value });
  const statusOptions = useMemo(() => getRubricStatusOptions(t).filter((opt) => opt.value), [t]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:grid-cols-2">
        <Field label={t("admin.rubric.form.rubricName")}>
          <input
            className={inputClass}
            value={form.name || form.rubric_name || ""}
            onChange={(e) => setValue("name", e.target.value)}
            disabled={planned}
            required
          />
        </Field>
        <Field label={t("admin.columns.subject")}>
          <select
            className={inputClass}
            value={form.subject_id || ""}
            onChange={(e) => setValue("subject_id", e.target.value)}
            disabled={planned}
          >
            <option value="">{t("admin.rubric.form.selectSubject")}</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.subject_code} - {subject.subject_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("admin.columns.totalScore")}>
          <input
            type="number"
            min="0.01"
            step="0.01"
            className={inputClass}
            value={form.total_score || 10}
            onChange={(e) => setValue("total_score", e.target.value)}
            disabled={planned}
            required
          />
        </Field>
        <Field label={t("admin.fields.status")}>
          <select
            className={inputClass}
            value={form.status || "draft"}
            onChange={(e) => setValue("status", e.target.value)}
            disabled={planned}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label={t("admin.columns.description")}>
            <textarea
              className={inputClass}
              rows={4}
              value={form.description || ""}
              onChange={(e) => setValue("description", e.target.value)}
              disabled={planned}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
