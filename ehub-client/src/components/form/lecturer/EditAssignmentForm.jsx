import { useState, useEffect, useRef } from "react";
import { X, ChevronDown, FileText, FileArchive, FileImage, FileSpreadsheet, Presentation, Upload, Paperclip, Trash2 } from "lucide-react";
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
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 text-sm text-gray-800 hover:bg-gray-100 transition-all border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
      >
        <div className="flex flex-wrap gap-1 items-center overflow-hidden">
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

function SelectField({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 text-sm text-gray-800 hover:bg-gray-100 transition-all border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {options.find(o => o.value === value)?.label || placeholder}
        </span>
        <ChevronDown 
          size={18} 
          className={`text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`} 
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <ul className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 max-h-60 overflow-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {options.map(opt => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                    ${opt.value === value ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: "open", label: "Đang mở" },
  { value: "closed", label: "Đã đóng" },
  { value: "archived", label: "Lưu trữ" },
];

import { useToast } from "@/components/ui/Toast";

const getDisplayFileName = (url = "") => {
  const fileWithQuery = String(url).split("/").pop() || "";
  const fileName = decodeURIComponent(fileWithQuery.split("?")[0] || "");
  return fileName.replace(/^\d+_/, "");
};

export default function EditAssignmentForm({ isOpen, assignment, onClose, onSave, loading }) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: "",
    max_score: 10,
    required_file_types: "pdf,docx",
    max_file_size_mb: 15,
    max_files: 3,
    status: "open",
    attachment_url: "",
  });

  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [existingAttachmentUrls, setExistingAttachmentUrls] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPendingFiles([]);
  }, [assignment?.id]);

  useEffect(() => {
    if (!isOpen) {
      setPendingFiles([]);
      setExistingAttachmentUrls([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (assignment) {
      const currentMaxSize = assignment.max_file_size_mb || 15;
      setFormData({
        title: assignment.title || "",
        description: assignment.description || "",
        deadline: assignment.deadline ? assignment.deadline.slice(0, 16) : "",
        max_score: assignment.maxScore || 10,
        required_file_types: assignment.required_file_types || "pdf,docx",
        max_file_size_mb: currentMaxSize === 20 ? 15 : Math.min(currentMaxSize, 25),
        max_files: assignment.max_files || 3,
        status: assignment.status || "open",
        attachment_url: assignment.attachment_url || "",
      });
      const urls = assignment.attachmentUrls?.length
        ? assignment.attachmentUrls
        : parseLecturerAttachmentUrls(assignment.attachment_url || "");
      setExistingAttachmentUrls(urls);
      setPendingFiles([]);
    }
  }, [assignment]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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

  const handleSave = async () => {
    // Validation for file rules
    const maxFileSize = Number(formData.max_file_size_mb);
    if (isNaN(maxFileSize) || maxFileSize <= 0 || maxFileSize > 25) {
      toast.error("Dung lượng tối đa phải từ 1-25 MB.");
      return;
    }

    const maxFilesCount = Number(formData.max_files);
    if (isNaN(maxFilesCount) || maxFilesCount <= 0 || maxFilesCount > 5) {
      toast.error("Số lượng file tối đa phải từ 1-5 file.");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tên bài tập.");
      return;
    }

    let attachmentUrl = formData.attachment_url;
    if (pendingFiles.length > 0) {
      try {
        setIsUploading(true);
        const urls = [...existingAttachmentUrls];
        for (const file of pendingFiles) {
          // eslint-disable-next-line no-await-in-loop
          const res = await AssignmentApi.uploadAttachmentDirect(file);
          const u = res?.data?.url ?? "";
          if (!u) throw new Error("Missing url");
          urls.push(u);
        }
        attachmentUrl = serializeLecturerAttachmentUrls(urls);
        setFormData((prev) => ({ ...prev, attachment_url: attachmentUrl }));
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

    onSave({ ...formData, attachment_url: attachmentUrl });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-4 border-b border-gray-50">
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-2xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all active:scale-95">
            <X size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Chỉnh sửa Bài tập
          </h2>
          <p className="text-sm text-gray-500 mt-1">Cấu hình các thông số và yêu cầu cho bài tập này</p>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-6 overflow-y-auto custom-scrollbar pb-32">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tiêu đề bài tập</label>
            <input name="title" value={formData.title} onChange={handleChange} placeholder="Ví dụ: Báo cáo cuối kỳ" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Mô tả bài tập</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Nhập hướng dẫn cụ thể cho sinh viên..." className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium resize-none min-h-[100px]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Hạn nộp</label>
              <input type="datetime-local" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium" />
            </div>
            <div className="space-y-1.5 overflow-visible">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Loại file chấp nhận</label>
              <MultiSelectFileType value={formData.required_file_types} onChange={(v) => setFormData(prev => ({...prev, required_file_types: v}))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Điểm tối đa</label>
              <input type="number" name="max_score" value={formData.max_score} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Dung lượng tối đa (MB)</label>
              <input type="number" name="max_file_size_mb" value={formData.max_file_size_mb} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Số file tối đa</label>
              <input type="number" name="max_files" value={formData.max_files} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Trạng thái</label>
            <SelectField value={formData.status} onChange={(v) => setFormData(prev => ({...prev, status: v}))} options={STATUS_OPTIONS} placeholder="Chọn trạng thái" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">File đính kèm từ giảng viên</label>
              <span className="text-[10px] text-gray-400">
                {existingAttachmentUrls.length + pendingFiles.length}/{LECTURER_ATTACH_MAX_FILES} · tối đa 25MB/file
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {(existingAttachmentUrls.length > 0 || pendingFiles.length > 0) && (
                <ul className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                  {existingAttachmentUrls.map((url, idx) => (
                    <li key={`ex-${idx}`} className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-100">
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
                        onClick={() => setExistingAttachmentUrls((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))}
                  {pendingFiles.map((file, idx) => (
                    <li key={`p-${file.name}-${idx}`} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/80 border border-amber-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <Upload size={16} className="text-amber-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-amber-900 truncate">{file.name}</p>
                          <p className="text-[11px] text-amber-700">Sẽ tải lên khi bấm Lưu</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPendingFiles((p) => p.filter((_, i) => i !== idx))}
                        className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 shrink-0"
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
                  className="w-full py-5 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:border-indigo-300 hover:bg-indigo-50/30 text-gray-500 hover:text-indigo-600"
                >
                  <Upload size={22} className="text-indigo-400" />
                  <span className="text-sm font-bold">Thêm file đính kèm</span>
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
        <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all active:scale-95 cursor-pointer">
            Hủy bỏ
          </button>
          <button onClick={handleSave} disabled={loading || isUploading} className="px-8 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 cursor-pointer">
            {loading || isUploading ? (isUploading ? "Đang tải lên..." : "Đang xử lý...") : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
