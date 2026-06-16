import { useState, useRef, useEffect, useMemo } from "react";
import { X, ChevronDown, Check, FileText, FileArchive, FileImage, FileSpreadsheet, Presentation, File, Upload, Paperclip, Trash2 } from "lucide-react";
import AssignmentApi from "@/api/assignment";
import { useToast } from "@/components/ui/Toast";
import {
  parseLecturerAttachmentUrls,
  serializeLecturerAttachmentUrls,
  getAttachmentDisplayFileName,
  LECTURER_ATTACH_MAX_FILES,
  LECTURER_ATTACH_MAX_BYTES,
} from "@/utils/lecturerAttachments";
import { toDatetimeLocalInput, resolveCheckpointOpenAt } from "@/utils/formatDateTime";

function formatDatetimeLocalValue(d = new Date()) {
  return toDatetimeLocalInput(d);
}

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

function SelectField({ value, onChange, options, placeholder, disabledOptions = [] }) {
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
            {options.map(opt => {
              const isDisabled = disabledOptions.includes(opt.value) && opt.value !== value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between
                      ${isDisabled ? "opacity-30 cursor-not-allowed bg-gray-50 text-gray-400" : (opt.value === value ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-gray-100")}`}
                  >
                    <span>{opt.label}</span>
                    {isDisabled && <span className="text-[9px] font-bold uppercase opacity-50"></span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function ClassSelect({ value = [], onChange, options, disabledOptions = [] }) {
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
          w-full flex items-center justify-between px-4 py-2.5 rounded-xl
          bg-gray-50 border border-gray-200 text-sm transition-all duration-150
          ${open
            ? "border-indigo-400 ring-2 ring-indigo-100 bg-white"
            : "hover:bg-gray-100"}
        `}
      >
        <div className="flex flex-wrap gap-1 items-center overflow-hidden">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((opt) => (
              <span key={opt.value} className="text-gray-700 font-medium whitespace-nowrap bg-white px-2 py-0.5 rounded-lg border border-gray-100 text-[10px] uppercase">
                {opt.label}
              </span>
            ))
          ) : (
            <span className="text-gray-400">Chọn lớp...</span>
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
              const disabledInfo = disabledOptions.find(d => d.value === opt.value);
              const isDisabled = !!disabledInfo;

              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (isSelected) {
                        onChange(value.filter((v) => v !== opt.value));
                      } else {
                        onChange([...value, opt.value]);
                      }
                    }}
                    className={`
                      w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors duration-100
                      ${isDisabled 
                        ? "opacity-50 cursor-not-allowed bg-gray-50 text-gray-400" 
                        : (isSelected ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50")}
                    `}
                  >
                    <div className="flex flex-col items-start">
                      <span>{opt.label}</span>
                      {isDisabled && (
                        <span className="text-[9px] text-rose-500 font-bold uppercase mt-0.5">
                          {disabledInfo.reason}
                        </span>
                      )}
                    </div>
                    {isSelected && !isDisabled && <Check size={16} className="text-indigo-600" />}
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

const STATUS_OPTIONS = [
  { value: "draft", label: "Bản nháp" },
  { value: "open", label: "Đang mở" },
  { value: "closed", label: "Đã đóng" },
];

export default function EditCheckpointForm({ isOpen, checkpoint, onClose, onSave, loading, existingOrders = [], classOptions = [], allCheckpoints = [] }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [existingAttachmentUrls, setExistingAttachmentUrls] = useState([]);

  useEffect(() => {
    setPendingFiles([]);
  }, [checkpoint?.id]);

  useEffect(() => {
    if (!isOpen) {
      setPendingFiles([]);
      setExistingAttachmentUrls([]);
      setPrevCheckpointId(undefined);
    }
  }, [isOpen]);

  const CHECKPOINT_TYPE_OPTIONS = [
    { value: 1, label: "Checkpoint 1" },
    { value: 2, label: "Checkpoint 2" },
    { value: 3, label: "Checkpoint 3" },
    { value: 4, label: "Checkpoint 4" },
  ];

  const firstAvailableOrder = CHECKPOINT_TYPE_OPTIONS
    .map(o => o.value)
    .find(n => !existingOrders.includes(n)) || 1;
  const [prevCheckpointId, setPrevCheckpointId] = useState();
  const [formData, setFormData] = useState({
    class_ids: [],
    title: checkpoint?.title || "",
    description: checkpoint?.description || "",
    order_index: checkpoint?.order_index || firstAvailableOrder,
    deadline: toDatetimeLocalInput(checkpoint?.deadline),
    open_at: toDatetimeLocalInput(resolveCheckpointOpenAt(checkpoint)),
    max_score: checkpoint?.max_score || 10,
    weight: checkpoint?.weight || 0.25,
    required_file_types: checkpoint?.required_file_types || "pdf,docx",
    max_file_size_mb: checkpoint?.max_file_size_mb || 15,
    max_files: checkpoint?.max_files || 3,
    status: checkpoint?.status || "draft",
    attachment_url: checkpoint?.attachment_url || "",
  });

  // Calculate disabled classes based on selected order_index
  const conflictedClasses = useMemo(() => {
    if (checkpoint) return []; // Don't block classes when editing a single checkpoint
    
    return allCheckpoints
      .filter(cp => cp.order_index === Number(formData.order_index))
      .map(cp => ({
        value: cp.class_id,
        reason: `Đã có Checkpoint ${formData.order_index}`
      }));
  }, [allCheckpoints, formData.order_index, checkpoint]);

  // If order_index changes and previously selected classes now have conflict, remove them
  useEffect(() => {
    if (!checkpoint && formData.class_ids.length > 0) {
      const filtered = formData.class_ids.filter(id => !conflictedClasses.some(c => c.value === id));
      if (filtered.length !== formData.class_ids.length) {
        setFormData(prev => ({ ...prev, class_ids: filtered }));
        if (filtered.length === 0) {
          toast.info(`Các lớp vừa chọn đều đã có Checkpoint ${formData.order_index}.`);
        }
      }
    }
  }, [conflictedClasses, checkpoint, formData.order_index]);

  useEffect(() => {
    if (checkpoint?.id !== prevCheckpointId) {
      setPrevCheckpointId(checkpoint?.id);
      const currentMaxSize = checkpoint?.max_file_size_mb || 15;
      setFormData({
        class_ids: [],
        title: checkpoint?.title || "",
        description: checkpoint?.description || "",
        order_index: checkpoint?.order_index || firstAvailableOrder,
        deadline: toDatetimeLocalInput(checkpoint?.deadline),
        open_at: toDatetimeLocalInput(resolveCheckpointOpenAt(checkpoint)),
        max_score: checkpoint?.max_score || 10,
        weight: checkpoint?.weight || 0.25,
        required_file_types: checkpoint?.required_file_types || "pdf,docx",
        // Force 15 if it's the old default (20) or if it's not set, otherwise cap at 25
        max_file_size_mb: currentMaxSize === 20 ? 15 : Math.min(currentMaxSize, 25),
        max_files: checkpoint?.max_files || 3,
        status: checkpoint?.status || "draft",
        attachment_url: checkpoint?.attachment_url || "",
      });
      const urls = checkpoint?.attachmentUrls?.length
        ? checkpoint.attachmentUrls
        : parseLecturerAttachmentUrls(checkpoint?.attachment_url || "");
      setExistingAttachmentUrls(checkpoint ? urls : []);
      setPendingFiles([]);
    }
  }, [checkpoint, prevCheckpointId, firstAvailableOrder]);

  // Ensure order_index is valid when existingOrders changes
  useEffect(() => {
    if (!checkpoint && existingOrders.includes(formData.order_index)) {
      setFormData(prev => ({ ...prev, order_index: firstAvailableOrder }));
    }
  }, [existingOrders, checkpoint, firstAvailableOrder, formData.order_index]);

  if (!isOpen) return null;

  const minDeadlineLocal = formatDatetimeLocalValue(new Date());

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
    if (!checkpoint && formData.class_ids.length === 0) {
      toast.error("Vui lòng chọn ít nhất một lớp học.");
      return;
    }

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
      toast.error("Vui lòng nhập tiêu đề checkpoint.");
      return;
    }

    if (!formData.deadline) {
      toast.error("Vui lòng chọn hạn nộp bài.");
      return;
    }

    if (formData.open_at) {
      const openAtMs = new Date(formData.open_at).getTime();
      const deadlineMs = new Date(formData.deadline).getTime();
      if (Number.isNaN(openAtMs)) {
        toast.error("Thời gian mở không hợp lệ.");
        return;
      }
      if (!Number.isNaN(deadlineMs) && openAtMs > deadlineMs) {
        toast.error("Thời gian mở phải trước hạn nộp.");
        return;
      }
    }

    const deadlineMs = new Date(formData.deadline).getTime();
    if (Number.isNaN(deadlineMs) || deadlineMs <= Date.now()) {
      toast.error("Hạn nộp phải sau thời điểm hiện tại.");
      return;
    }

    const maxScore = Number(formData.max_score);
    if (isNaN(maxScore) || maxScore <= 0) {
      toast.error("Thang điểm phải là số dương.");
      return;
    }

    const weight = Number(formData.weight);
    if (isNaN(weight) || weight < 0 || weight > 1) {
      toast.error("Trọng số phải nằm trong khoảng 0 - 1.");
      return;
    }

    if (!formData.required_file_types || formData.required_file_types.trim() === "") {
      toast.error("Vui lòng chọn ít nhất một loại file chấp nhận.");
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

    await Promise.resolve(onSave({
      ...formData,
      attachment_url: attachmentUrl,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : formData.deadline,
      open_at: formData.open_at ? new Date(formData.open_at).toISOString() : null,
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-4 border-b border-gray-50 shrink-0">
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-2xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all active:scale-95">
            <X size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {checkpoint ? "Chỉnh sửa Checkpoint" : "Thêm Checkpoint mới"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Cấu hình các thông số và yêu cầu cho mốc nộp bài này</p>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-6 overflow-y-auto custom-scrollbar pb-32">
          
          {/* Class selection (only for Create) */}
          {!checkpoint && (
            <div className="space-y-1.5 overflow-visible">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Chọn lớp áp dụng</label>
                {conflictedClasses.length > 0 && (
                  <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 animate-pulse">
                    Một số lớp đã bị vô hiệu hóa do trùng checkpoint
                  </span>
                )}
              </div>
              <ClassSelect 
                value={formData.class_ids} 
                onChange={(vals) => setFormData(p => ({ ...p, class_ids: vals }))} 
                options={classOptions} 
                disabledOptions={conflictedClasses}
              />
            </div>
          )}

          {/* Row 1: Type, Title */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Phân loại</label>
              <SelectField 
                value={formData.order_index} 
                onChange={(v) => setFormData(prev => ({...prev, order_index: v}))} 
                options={CHECKPOINT_TYPE_OPTIONS} 
                placeholder="Chọn loại..." 
                disabledOptions={existingOrders}
              />
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tiêu đề nội dung</label>
              <input name="title" value={formData.title} onChange={handleChange} placeholder="Ví dụ: Business Model Canvas" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium" />
            </div>
          </div>

          {/* Row 2: Open at, Deadline, Accepted File Types */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Thời gian mở</label>
              <input
                type="datetime-local"
                name="open_at"
                value={formData.open_at}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Hạn nộp bài</label>
              <input
                type="datetime-local"
                name="deadline"
                min={minDeadlineLocal}
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1.5 overflow-visible">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Loại file chấp nhận</label>
              <MultiSelectFileType value={formData.required_file_types} onChange={(v) => setFormData(prev => ({...prev, required_file_types: v}))} />
            </div>
          </div>

          {/* Row 3: Score, Max Size, Max Files */}
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

          {/* Row 4: Weight, Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Trọng số (0-1)</label>
              <input type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Trạng thái</label>
              <SelectField value={formData.status} onChange={(v) => setFormData(prev => ({...prev, status: v}))} options={STATUS_OPTIONS} placeholder="Chọn trạng thái" />
            </div>
          </div>

          {/* Attachment */}
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
                          <p className="text-sm font-bold text-indigo-900 truncate">{getAttachmentDisplayFileName(url)}</p>
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
                          <p className="text-[11px] text-amber-700">
                            {checkpoint ? "Sẽ tải lên khi bấm Lưu thay đổi" : "Sẽ tải lên khi bấm Tạo Checkpoint"}
                          </p>
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

          <div className="space-y-1.5 pb-20">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Mô tả hướng dẫn</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={5} placeholder="Nhập hướng dẫn cụ thể cho sinh viên..." className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium resize-none min-h-[120px]" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all active:scale-95 cursor-pointer">
            Hủy bỏ
          </button>
          <button onClick={handleSave} disabled={loading || isUploading} className="px-8 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 cursor-pointer">
            {loading || isUploading
              ? (isUploading ? "Đang tải lên..." : "Đang xử lý...")
              : (checkpoint ? "Lưu thay đổi" : "Tạo Checkpoint")}
          </button>
        </div>
      </div>
    </div>
  );
}
