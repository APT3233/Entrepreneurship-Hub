import { useState } from "react";
import * as XLSX from "xlsx";
import { evaluationExportService } from "@/api/adminEvaluationOps";
import { useToast } from "@/components/ui/Toast";
import FormModal from "@/pages/admin/components/FormModal";

const exportOptions = [
  { value: "results", label: "Điểm tổng hợp" },
  { value: "sessions", label: "Evaluation sessions" },
  { value: "progress", label: "Grading progress" },
  { value: "rubric_usage", label: "Rubric usage" },
  { value: "grade_audit", label: "Grade audit" },
  { value: "criteria_scores", label: "Criteria scores" },
];

const getTimestamp = () => {
  const date = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
};

const downloadCsv = (rows, fileName) => {
  const keys = Array.from(rows.reduce((set, row) => {
    Object.keys(row || {}).forEach((key) => set.add(key));
    return set;
  }, new Set()));
  const escape = (value) => {
    if (value === null || value === undefined) return "";
    const text = typeof value === "object" ? JSON.stringify(value) : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csv = [keys.join(","), ...rows.map((row) => keys.map((key) => escape(row[key])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export default function ExportScoreModal({ open, onClose, filters = {}, defaultType = "results" }) {
  const toast = useToast();
  const [form, setForm] = useState({ export_type: defaultType, format: "csv" });
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await evaluationExportService.exportScores({ ...form, filters });
      const payload = res?.data || {};
      const rows = payload.rows || [];
      const baseName = `${payload.export_type || form.export_type}_${getTimestamp()}`;
      if (form.format === "xlsx") {
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Export");
        XLSX.writeFile(workbook, `${baseName}.xlsx`);
      } else {
        downloadCsv(rows, `${baseName}.csv`);
      }
      toast.success(`Đã export ${rows.length} dòng.`);
      onClose?.();
    } catch (err) {
      toast.error(err.message || "Không export được dữ liệu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal open={open} title="Export Scores" onClose={onClose} onSubmit={submit} saving={saving} submitLabel="Export">
      <div className="grid gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-gray-600">Loại dữ liệu</span>
          <select
            value={form.export_type}
            onChange={(event) => setForm((prev) => ({ ...prev, export_type: event.target.value }))}
            className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          >
            {exportOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-gray-600">Định dạng</span>
          <select
            value={form.format}
            onChange={(event) => setForm((prev) => ({ ...prev, format: event.target.value }))}
            className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="csv">CSV</option>
            <option value="xlsx">XLSX</option>
          </select>
        </label>
        <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
          Export dùng đúng filter hiện tại của màn hình.
        </p>
      </div>
    </FormModal>
  );
}
