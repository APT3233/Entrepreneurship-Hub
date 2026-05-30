import { inputClass, Field } from "@/pages/admin/components/FormModal";
import PlannedState from "./PlannedState";

export default function RubricBuilder({ subjects = [], form, onChange, planned = true }) {
  const setValue = (key, value) => onChange?.({ ...form, [key]: value });

  return (
    <div className="space-y-4">
      {planned ? (
        <PlannedState
          title="Rubric API is not implemented yet"
          message="DB hiện chưa có rubrics, rubric_criteria, rubric_scores. Form này giữ cấu trúc tích hợp cho Phase Module 3 nhưng không ghi dữ liệu production."
        />
      ) : null}
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:grid-cols-2">
        <Field label="Rubric name">
          <input className={inputClass} value={form.rubric_name || ""} onChange={(e) => setValue("rubric_name", e.target.value)} disabled={planned} />
        </Field>
        <Field label="Subject">
          <select className={inputClass} value={form.subject_id || ""} onChange={(e) => setValue("subject_id", e.target.value)} disabled={planned}>
            <option value="">Chọn subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.subject_code} - {subject.subject_name}</option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select className={inputClass} value={form.type || "checkpoint"} onChange={(e) => setValue("type", e.target.value)} disabled={planned}>
            <option value="checkpoint">Checkpoint</option>
            <option value="assignment">Assignment</option>
            <option value="final">Final</option>
          </select>
        </Field>
        <Field label="Total score">
          <input type="number" min="0" step="0.01" className={inputClass} value={form.total_score || 10} onChange={(e) => setValue("total_score", e.target.value)} disabled={planned} />
        </Field>
        <Field label="Status">
          <select className={inputClass} value={form.status || "draft"} onChange={(e) => setValue("status", e.target.value)} disabled={planned}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description">
            <textarea className={inputClass} rows={4} value={form.description || ""} onChange={(e) => setValue("description", e.target.value)} disabled={planned} />
          </Field>
        </div>
      </div>
    </div>
  );
}
