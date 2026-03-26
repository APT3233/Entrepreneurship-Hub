import { useState, useEffect } from "react";
import { X, ChevronDown, Calendar, Check } from "lucide-react";

// ── Class selector (styled like a full-width dropdown) ────────────────────────
function ClassSelect({ value = [], onChange, options }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!e.target.closest("[data-class-select]")) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selectedOptions = options.filter((o) => value.includes(o.value));

  return (
    <div data-class-select className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          w-full flex items-center justify-between px-4 py-3 rounded-xl
          bg-gray-100 border border-transparent text-sm transition-all duration-150
          ${open
            ? "border-indigo-400 ring-2 ring-indigo-100 bg-white"
            : "hover:bg-gray-200/70"}
        `}
      >
        <div className="flex flex-wrap gap-x-3 gap-y-1 overflow-hidden">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((opt) => (
              <span key={opt.value} className="text-gray-700 font-medium whitespace-nowrap">
                [ {opt.label} ]
              </span>
            ))
          ) : (
            <span className="text-gray-400">Lớp</span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
          <ul className="py-1 max-h-52 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = value.includes(opt.value);
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        onChange(value.filter((v) => v !== opt.value));
                      } else {
                        onChange([...value, opt.value]);
                      }
                    }}
                    className={`
                      w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors duration-100
                      ${isSelected
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-600 hover:bg-gray-50"}
                    `}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={16} className="text-indigo-600" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-800">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Input styles ──────────────────────────────────────────────────────────────
const inputCls = `
  w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent text-sm
  text-gray-800 placeholder-gray-400
  focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
  transition-all duration-150
`;

// ── Default form state ────────────────────────────────────────────────────────
const DEFAULT_FORM = {
  classCodes: [],
  title: "",
  description: "",
  deadline: "",
  maxScore: "",
};

// ── CLASS_OPTIONS — replace / inject from parent as needed ───────────────────
const CLASS_OPTIONS = [
  { value: "EXE101-01", label: "EXE101-01" },
  { value: "EXE101-02", label: "EXE101-02" },
  { value: "EXE202-01", label: "EXE202-01" },
];

// ── CreateAssignmentModal ─────────────────────────────────────────────────────
/**
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onSubmit: (formData) => void   ← called with validated data
 *  - classOptions?: { value, label }[]   ← override default list
 *  - initialData?: Partial<FormData>     ← for edit mode
 */
export default function CreateAssignmentForm({
  open,
  onClose,
  onSubmit,
  classOptions = CLASS_OPTIONS,
  initialData,
}) {
  const [form, setForm] = useState(() =>
    initialData ? { ...DEFAULT_FORM, ...initialData } : DEFAULT_FORM
  );
  const [errors, setErrors] = useState({});

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.classCodes || form.classCodes.length === 0) errs.classCodes = "Vui lòng chọn ít nhất một lớp.";
    if (!form.title.trim()) errs.title       = "Vui lòng nhập tên bài tập.";
    if (!form.deadline) {
      errs.deadline = "Vui lòng chọn deadline.";
    } else if (form.deadline < today) {
      errs.deadline = "Deadline không được ở trong quá khứ.";
    }
    if (!form.maxScore || isNaN(Number(form.maxScore)) || Number(form.maxScore) <= 0)
      errs.maxScore = "Thang điểm phải là số dương.";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    await onSubmit({ ...form, maxScore: Number(form.maxScore) });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200">

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 pb-0">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            {initialData ? "Chỉnh sửa bài tập" : "Tạo bài tập"}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">Nhập tên và mô tả bài tập</p>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-6 space-y-5">

          {/* Class select */}
          <Field label="Chọn đối tượng" error={errors.classCodes}>
            <ClassSelect
              value={form.classCodes}
              onChange={(val) => setForm((p) => ({ ...p, classCodes: val }))}
              options={classOptions}
            />
          </Field>

          {/* Title */}
          <Field label="Tên bài tập" error={errors.title}>
            <input
              type="text"
              value={form.title}
              onChange={set("title")}
              placeholder="Ví dụ: Báo cáo tiến độ tuần 3"
              className={inputCls}
            />
          </Field>

          {/* Description */}
          <Field label="Mô tả chi tiết" error={errors.description}>
            <textarea
              value={form.description}
              onChange={set("description")}
              placeholder="Mô tả yêu cầu, nội dung, chi tiết đánh giá..."
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </Field>

          {/* Deadline + Max score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Deadline" error={errors.deadline}>
              <div className="relative">
                <input
                  type="datetime-local"
                  min={today}
                  value={form.deadline}
                  onChange={set("deadline")}
                  className={`${inputCls} pr-10`}
                />
                <Calendar
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </Field>

            <Field label="Thang điểm" error={errors.maxScore}>
              <input
                type="number"
                min="1"
                value={form.maxScore}
                onChange={set("maxScore")}
                placeholder="10"
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors duration-150 cursor-pointer"
          >
            Lưu
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-sm font-semibold transition-colors duration-150"
          >
            Hủy
          </button>
        </div>

      </div>
    </div>
  );
}