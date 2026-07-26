import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { gradingConfigService } from "@/api/adminEvaluationOps";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import { inputClass } from "@/pages/admin/components/FormModal";
import PlannedState from "@/pages/admin/evaluation-ops/components/PlannedState";

const initialConfig = {
  feedback_required: true,
  min_feedback_length: 15,
  allow_resubmit: true,
  allow_late_submission: true,
  allow_grade_after_closed: false,
  final_score_calculation: "manual",
  ai_suggestion_enabled: false,
  ai_auto_grading_enabled: false,
};

const toForm = (rows = []) => rows.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), { ...initialConfig });

function ToggleField({ label, helper, checked, onChange, disabled = false }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-card border border-border bg-surface p-4">
      <span>
        <span className="block text-sm font-bold text-gray-900">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-gray-500">{helper}</span>
      </span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-5 w-5 accent-accent" />
    </label>
  );
}

export default function AdminGradingConfig() {
  const { t } = useTranslation();
  const toast = useToast();
  const [form, setForm] = useState(initialConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    gradingConfigService.get()
      .then((res) => setForm(toForm(res?.data || [])))
      .catch((err) => toast.error(err.message || t("admin.gradingConfigPage.loadError")))
      .finally(() => setLoading(false));
  }, [toast, t]);

  const setValue = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (event) => {
    event.preventDefault();
    if (Number(form.min_feedback_length) < 0) {
      toast.error(t("admin.gradingConfigPage.minFeedbackInvalid"));
      return;
    }
    setSaving(true);
    try {
      await gradingConfigService.update({ ...form, ai_auto_grading_enabled: false });
      toast.success(t("admin.gradingConfigPage.saveSuccess"));
    } catch (err) {
      toast.error(err.message || t("admin.gradingConfigPage.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-card border border-border bg-surface p-8 text-center text-sm text-gray-400">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <PlannedState
        title={t("admin.gradingConfigPage.plannedTitle")}
        message={t("admin.gradingConfigPage.plannedMessage")}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ToggleField
          label={t("admin.gradingConfigPage.feedbackRequired")}
          helper={t("admin.gradingConfigPage.feedbackRequiredHelper")}
          checked={form.feedback_required}
          onChange={(value) => setValue("feedback_required", value)}
        />
        <ToggleField
          label={t("admin.gradingConfigPage.allowResubmit")}
          helper={t("admin.gradingConfigPage.allowResubmitHelper")}
          checked={form.allow_resubmit}
          onChange={(value) => setValue("allow_resubmit", value)}
        />
        <ToggleField
          label={t("admin.gradingConfigPage.allowLateSubmission")}
          helper={t("admin.gradingConfigPage.allowLateSubmissionHelper")}
          checked={form.allow_late_submission}
          onChange={(value) => setValue("allow_late_submission", value)}
        />
        <ToggleField
          label={t("admin.gradingConfigPage.allowGradeAfterClosed")}
          helper={t("admin.gradingConfigPage.allowGradeAfterClosedHelper")}
          checked={form.allow_grade_after_closed}
          onChange={(value) => setValue("allow_grade_after_closed", value)}
        />
        <ToggleField
          label={t("admin.gradingConfigPage.aiSuggestionEnabled")}
          helper={t("admin.gradingConfigPage.aiSuggestionEnabledHelper")}
          checked={form.ai_suggestion_enabled}
          onChange={(value) => setValue("ai_suggestion_enabled", value)}
        />
        <ToggleField
          label={t("admin.gradingConfigPage.aiAutoGradingEnabled")}
          helper={t("admin.gradingConfigPage.aiAutoGradingEnabledHelper")}
          checked={false}
          onChange={() => null}
          disabled
        />
      </div>
      <div className="grid grid-cols-1 gap-4 rounded-card border border-border bg-surface p-5 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t("admin.gradingConfigPage.minFeedbackLength")}
          </span>
          <input type="number" min="0" className={inputClass} value={form.min_feedback_length} onChange={(e) => setValue("min_feedback_length", Number(e.target.value))} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t("admin.gradingConfigPage.finalScoreCalculation")}
          </span>
          <select className={inputClass} value={form.final_score_calculation} onChange={(e) => setValue("final_score_calculation", e.target.value)}>
            <option value="manual">{t("admin.gradingConfigPage.finalScoreManual")}</option>
            <option value="weighted_sum">{t("admin.gradingConfigPage.finalScoreWeightedSum")}</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50">
          <Save size={16} /> {saving ? t("common.saving") : t("admin.gradingConfigPage.saveConfig")}
        </button>
      </div>
    </form>
  );
}
