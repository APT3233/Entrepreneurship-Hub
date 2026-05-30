import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { gradingConfigService } from "@/api/adminEvaluationOps";
import { useToast } from "@/components/ui/Toast";
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
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <span>
        <span className="block text-sm font-bold text-gray-900">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-gray-500">{helper}</span>
      </span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-5 w-5 accent-indigo-600" />
    </label>
  );
}

export default function AdminGradingConfig() {
  const toast = useToast();
  const [form, setForm] = useState(initialConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    gradingConfigService.get()
      .then((res) => setForm(toForm(res?.data || [])))
      .catch((err) => toast.error(err.message || "Không tải được grading config"))
      .finally(() => setLoading(false));
  }, [toast]);

  const setValue = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (event) => {
    event.preventDefault();
    if (Number(form.min_feedback_length) < 0) {
      toast.error("min_feedback_length phải >= 0");
      return;
    }
    setSaving(true);
    try {
      await gradingConfigService.update({ ...form, ai_auto_grading_enabled: false });
      toast.success("Cập nhật grading config thành công");
    } catch (err) {
      toast.error(err.message || "Không lưu được grading config");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400">Đang tải...</div>;

  return (
    <form onSubmit={save} className="space-y-4">
      <PlannedState
        title="AI chỉ hỗ trợ gợi ý"
        message="Cấu hình AI auto grading luôn tắt trong MVP. Điểm chính thức vẫn do giảng viên/admin xác nhận."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ToggleField label="Feedback required" helper="Bắt buộc nhập feedback khi chấm điểm." checked={form.feedback_required} onChange={(value) => setValue("feedback_required", value)} />
        <ToggleField label="Allow resubmit" helper="Cho phép nhóm nộp lại sau lần nộp đầu." checked={form.allow_resubmit} onChange={(value) => setValue("allow_resubmit", value)} />
        <ToggleField label="Allow late submission" helper="Cho phép nộp sau deadline và đánh dấu late." checked={form.allow_late_submission} onChange={(value) => setValue("allow_late_submission", value)} />
        <ToggleField label="Allow grade after closed" helper="Cho phép chấm sau khi checkpoint/assignment đã đóng." checked={form.allow_grade_after_closed} onChange={(value) => setValue("allow_grade_after_closed", value)} />
        <ToggleField label="AI suggestion enabled" helper="Chuẩn bị cho gợi ý AI sau này, không tự quyết định điểm." checked={form.ai_suggestion_enabled} onChange={(value) => setValue("ai_suggestion_enabled", value)} />
        <ToggleField label="AI auto grading enabled" helper="Luôn tắt trong MVP." checked={false} onChange={() => null} disabled />
      </div>
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Min feedback length</span>
          <input type="number" min="0" className={inputClass} value={form.min_feedback_length} onChange={(e) => setValue("min_feedback_length", Number(e.target.value))} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Final score calculation</span>
          <select className={inputClass} value={form.final_score_calculation} onChange={(e) => setValue("final_score_calculation", e.target.value)}>
            <option value="manual">Manual</option>
            <option value="weighted_sum">Weighted sum</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
          <Save size={16} /> {saving ? "Đang lưu..." : "Lưu cấu hình"}
        </button>
      </div>
    </form>
  );
}
