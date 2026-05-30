import { useEffect, useState } from "react";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";

export default function GradeModal({ open, submission, maxScore, onClose, onSubmit, saving }) {
  const [form, setForm] = useState({ score: "", feedback: "" });

  useEffect(() => {
    if (open) {
      setForm({
        score: submission?.score ?? "",
        feedback: submission?.feedback || "",
      });
    }
  }, [open, submission]);

  const submit = (event) => {
    event.preventDefault();
    onSubmit?.({
      score: Number(form.score),
      feedback: form.feedback,
    });
  };

  return (
    <FormModal open={open} title="Grade submission" onClose={onClose} onSubmit={submit} saving={saving}>
      <div className="space-y-4">
        <Field label={`Score (0-${Number(maxScore || 0)})`}>
          <input
            type="number"
            min="0"
            max={Number(maxScore || 0)}
            step="0.01"
            className={inputClass}
            value={form.score}
            onChange={(e) => setForm({ ...form, score: e.target.value })}
            required
          />
        </Field>
        <Field label="Feedback">
          <textarea
            className={inputClass}
            rows={4}
            value={form.feedback}
            onChange={(e) => setForm({ ...form, feedback: e.target.value })}
            required
          />
        </Field>
      </div>
    </FormModal>
  );
}
