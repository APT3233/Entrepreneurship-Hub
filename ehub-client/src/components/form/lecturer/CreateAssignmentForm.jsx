import { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Calendar, Check, FileText, FileArchive, FileImage, FileSpreadsheet, Presentation, Upload, Paperclip, Trash2 } from "lucide-react";
import AssignmentApi from "@/api/assignment";
import {
  parseLecturerAttachmentUrls,
  serializeLecturerAttachmentUrls,
  LECTURER_ATTACH_MAX_FILES,
  LECTURER_ATTACH_MAX_BYTES,
} from "@/utils/lecturerAttachments";

const FILE_TYPE_OPTIONS = [
  { value: "pdf", label: "PDF", icon: <FileText size={14} className="text-rose-500" /> },
  { value: "docx", label: "Word", icon: <FileText size={14} className="text-blue-500" /> },
  { value: "pptx", label: "PowerPoint", icon: <Presentation size={14} className="text-orange-500" /> },
  { value: "xlsx", label: "Excel", icon: <FileSpreadsheet size={14} className="text-emerald-500" /> },
  { value: "zip", label: "Zip", icon: <FileArchive size={14} className="text-amber-500" /> },
  { value: "png", label: "Image", icon: <FileImage size={14} className="text-indigo-500" /> },
];

function MultiSelectFileType({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selectedValues = value ? value.split(",") : [];

  const toggleValue = (val) => {
    let newValues;
    if (selectedValues.includes(val)) {
      newValues = selectedValues.filter(v => v !== val);
    } else {
      newValues = [...selectedValues, val];
    }
    onChange(newValues.join(","));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-3 rounded-xl bg-gray-100 text-sm text-gray-800 hover:bg-gray-200/70 transition-all border border-transparent focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
      >
        <div className="flex flex-wrap gap-1 items-center overflow-hidden text-xs">
          {selectedValues.length === 0 ? (
            <span className="text-gray-400">Chọn loại file...</span>
          ) : (
            selectedValues.map(val => {
              const opt = FILE_TYPE_OPTIONS.find(o => o.value === val);
              return opt ? (
                <div key={val} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-gray-100 shadow-sm">
                  {opt.icon}
                  <span className="text-[10px] font-bold text-gray-600 uppercase">{opt.value}</span>
                </div>
              ) : null;
            })
          )}
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <ul className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 max-h-60 overflow-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {FILE_TYPE_OPTIONS.map(opt => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => toggleValue(opt.value)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                    ${selectedValues.includes(opt.value) ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  {opt.icon}
                  <span className="flex-1 text-left">{opt.label}</span>
                  {selectedValues.includes(opt.value) && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

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
function Field({ label, error, children, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
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
  max_score: "10",
  required_file_types: "pdf,docx",
  max_file_size_mb: "15",
  max_files: "3",
  attachment_url: "",
};

// ── CLASS_OPTIONS — replace / inject from parent as needed ───────────────────
const CLASS_OPTIONS = [
  { value: "EXE101-01", label: "EXE101-01" },
  { value: "EXE101-02", label: "EXE101-02" },
  { value: "EXE202-01", label: "EXE202-01" },
];

import { useToast } from "@/components/ui/Toast";

const getDisplayFileName = (url = "") => {
  const fileWithQuery = String(url).split("/").pop() || "";
  const fileName = decodeURIComponent(fileWithQuery.split("?")[0] || "");
  return fileName.replace(/^\d+_/, "");
};

// ... (previous constants)

// ── CreateAssignmentForm ─────────────────────────────────────────────────────
export default function CreateAssignmentForm({
  open,
  onClose,
  onSubmit,
  classOptions = CLASS_OPTIONS,
  initialData,
}) {
  const toast = useToast();
  const [form, setForm] = useState(() =>
    initialData ? { ...DEFAULT_FORM, ...initialData } : DEFAULT_FORM
  );
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  /** File local chưa upload; khi bấm Lưu sẽ upload tối đa 5 file, mỗi file ≤ 25MB */
  const [pendingFiles, setPendingFiles] = useState([]);
  /** URL đã có (khi tạo từ bản mẫu / initialData) */
  const [existingAttachmentUrls, setExistingAttachmentUrls] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setPendingFiles([]);
      setExistingAttachmentUrls([]);
      return;
    }
    setPendingFiles([]);
    setExistingAttachmentUrls(
      initialData?.attachment_url ? parseLecturerAttachmentUrls(initialData.attachment_url) : []
    );
  }, [open, initialData?.attachment_url]);

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

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    setPendingFiles((prev) => {
      const next = [...prev];
      for (const file of incoming) {
        if (file.size > LECTURER_ATTACH_MAX_BYTES) {
          toast.error(`"${file.name}": vượt quá 25MB.`);
          continue;
        }
        if (existingAttachmentUrls.length + next.length >= LECTURER_ATTACH_MAX_FILES) {
          toast.error(`Tối đa ${LECTURER_ATTACH_MAX_FILES} file đính kèm.`);
          break;
        }
        next.push(file);
      }
      return next;
    });
  };

  const handleFileChange = (e) => {
    const input = e.target;
    try {
      addFiles(input.files);
    } finally {
      input.value = "";
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.classCodes || form.classCodes.length === 0) errs.classCodes = "Vui lòng chọn ít nhất một lớp.";
    if (!form.title.trim()) errs.title       = "Vui lòng nhập tên bài tập.";
    if (!form.deadline) {
      errs.deadline = "Vui lòng chọn deadline.";
    } else if (form.deadline < today) {
      errs.deadline = "Deadline không được ở trong quá khứ.";
    }
    if (!form.max_score || isNaN(Number(form.max_score)) || Number(form.max_score) <= 0)
      errs.max_score = "Thang điểm phải là số dương.";

    // File rules validation
    const maxFileSize = Number(form.max_file_size_mb);
    if (isNaN(maxFileSize) || maxFileSize <= 0 || maxFileSize > 25) {
      errs.max_file_size_mb = "Dung lượng tối đa phải từ 1-25 MB.";
    }

    const maxFilesCount = Number(form.max_files);
    if (isNaN(maxFilesCount) || maxFilesCount <= 0 || maxFilesCount > 5) {
      errs.max_files = "Số lượng file tối đa phải từ 1-5 file.";
    }

    if (!form.required_file_types || form.required_file_types.trim() === "") {
      errs.required_file_types = "Vui lòng chọn ít nhất một loại file chấp nhận.";
    }

    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { 
      setErrors(errs); 
      // Show first error as toast
      const firstError = Object.values(errs)[0];
      toast.error(firstError);
      return; 
    }
    let attachmentUrl = form.attachment_url;
    if (pendingFiles.length > 0) {
      try {
        setIsUploading(true);
        const urls = [...existingAttachmentUrls];
        for (const file of pendingFiles) {
          // eslint-disable-next-line no-await-in-loop
          const res = await AssignmentApi.uploadAttachmentDirect(file);
          const u = res?.data?.url ?? "";
          if (!u) throw new Error("Thiếu URL sau khi tải lên");
          urls.push(u);
        }
        attachmentUrl = serializeLecturerAttachmentUrls(urls);
        setForm((prev) => ({ ...prev, attachment_url: attachmentUrl }));
        setPendingFiles([]);
        setExistingAttachmentUrls(parseLecturerAttachmentUrls(attachmentUrl));
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error("Không thể tải file lên. Vui lòng thử lại.");
        return;
      } finally {
        setIsUploading(false);
      }
    } else {
      attachmentUrl = serializeLecturerAttachmentUrls(existingAttachmentUrls);
    }
    await onSubmit({ 
      ...form, 
      attachment_url: attachmentUrl,
      max_score: Number(form.max_score),
      max_file_size_mb: Number(form.max_file_size_mb),
      max_files: Number(form.max_files)
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150 z-10"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 pb-2 shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            {initialData ? "Chỉnh sửa bài tập" : "Tạo bài tập"}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">Thiết lập các thông số và yêu cầu cho bài tập mới</p>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-4 space-y-6 overflow-y-auto custom-scrollbar pb-32">

          {/* Class select */}
          <Field label="Chọn đối tượng" error={errors.classCodes} className="overflow-visible">
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

          {/* Deadline + File types */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

            <Field label="Loại file chấp nhận" error={errors.required_file_types} className="overflow-visible">
              <MultiSelectFileType 
                value={form.required_file_types} 
                onChange={(val) => setForm(p => ({ ...p, required_file_types: val }))} 
              />
            </Field>
          </div>

          {/* Max score + Max size + Max files */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Field label="Thang điểm" error={errors.max_score}>
              <input
                type="number"
                min="1"
                value={form.max_score}
                onChange={set("max_score")}
                placeholder="10"
                className={inputCls}
              />
            </Field>
            <Field label="Dung lượng tối đa (MB)">
               <input
                 type="number"
                 min="1"
                 value={form.max_file_size_mb}
                 onChange={set("max_file_size_mb")}
                 className={inputCls}
               />
             </Field>
             <Field label="Số lượng file tối đa">
               <input
                 type="number"
                 min="1"
                 value={form.max_files}
                 onChange={set("max_files")}
                 className={inputCls}
               />
             </Field>
          </div>

          {/* Attachment: tối đa 5 file, mỗi file ≤ 25MB */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">File đính kèm từ giảng viên</label>
              <span className="text-[10px] text-gray-400 font-medium">
                {existingAttachmentUrls.length + pendingFiles.length}/{LECTURER_ATTACH_MAX_FILES} · tối đa 25MB/file
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {(existingAttachmentUrls.length > 0 || pendingFiles.length > 0) && (
                <ul className="space-y-2">
                  {existingAttachmentUrls.map((url, idx) => (
                    <li
                      key={`ex-${url.slice(-40)}-${idx}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                          <Paperclip size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-indigo-900 truncate">{getDisplayFileName(url)}</p>
                          <a href={url} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-500 hover:underline">Mở</a>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setExistingAttachmentUrls((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                        aria-label="Bỏ file"
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))}
                  {pendingFiles.map((file, idx) => (
                    <li
                      key={`pend-${file.name}-${idx}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-amber-50/80 border border-amber-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                          <Upload size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-amber-900 truncate">{file.name}</p>
                          <p className="text-[11px] text-amber-700">Sẽ tải lên khi bấm Lưu</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPendingFiles((p) => p.filter((_, i) => i !== idx))}
                        className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                        aria-label="Bỏ file"
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {existingAttachmentUrls.length + pendingFiles.length < LECTURER_ATTACH_MAX_FILES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-5 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-gray-500 hover:text-indigo-600"
                >
                  <Upload size={22} className="text-indigo-400" />
                  <span className="text-sm font-bold">Thêm file đính kèm</span>
                  <span className="text-[10px] text-gray-400 px-2 text-center">docx, pdf, xlsx, ảnh, zip…</span>
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileChange}
                accept=".docx,.pdf,.xlsx,.png,.jpg,.jpeg,.zip,.rar"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isUploading}
            className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors duration-150 cursor-pointer disabled:opacity-50"
          >
            {isUploading ? "Đang tải lên..." : "Lưu"}
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