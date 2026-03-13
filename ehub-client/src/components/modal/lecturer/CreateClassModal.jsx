import { useState, useRef } from "react";
import { X, Upload, File, Trash2 } from "lucide-react";
import Dropdown from "@/components/ui/filter/DropDown";

const MON_HOC_OPTIONS = [
  { label: "EXE101", value: "EXE101" },
  { label: "EXE201", value: "EXE201" },
  // thêm môn học tại đây
];

const LOP_OPTIONS = Array.from({ length: 25 }, (_, i) => ({
  label: String(i + 1).padStart(2, "0"),   // "01", "02", ... "25"
  value: i + 1,
}));

export default function CreateClassModal({ isOpen, onClose, onCreate }) {
  const [monHoc, setMonHoc] = useState("");
  const [lop, setLop]       = useState(1);
  const [year, setYear]     = useState(1);
  const [ky, setKy]         = useState(1);
  const [files, setFiles]   = useState([]);
  const [dragging, setDrag] = useState(false);
  const [error, setError]   = useState("");
  const fileInputRef        = useRef(null);
  const backdropPressedRef  = useRef(false);

  if (!isOpen) return null;

  const handleBackdropMouseDown = (e) => {
    if (e.target === e.currentTarget) backdropPressedRef.current = true;
  };
  const handleBackdropMouseUp = (e) => {
    if (e.target === e.currentTarget) backdropPressedRef.current = false;
  };
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && backdropPressedRef.current) onClose();
    backdropPressedRef.current = false;
  };

  const addFiles = (incoming) => {
    const arr = Array.from(incoming).filter(f =>
      ["application/vnd.ms-excel",
       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
       "text/csv"].includes(f.type)
    );
    setFiles(prev => [...prev, ...arr]);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = () => {
    if (!monHoc) { setError("* Vui lòng nhập thông tin còn thiếu"); return; }
    setError("");
    onCreate?.({ monHoc, lop, year, ky, files });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
      onClick={handleBackdropClick}
    >
      <div className="
        relative w-full bg-white shadow-2xl
        rounded-t-2xl sm:rounded-2xl
        max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto
        sm:mx-4 sm:max-w-xl lg:max-w-2xl
      ">
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="px-5 sm:px-7 pt-4 sm:pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Tạo lớp mới</h2>
          <p className="text-xs text-gray-400 mt-0.5">Tạo lớp mới và mời thành viên tham gia</p>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-7 py-5 flex flex-col gap-5">

          {/* ── Môn học + Lớp ── */}
          <div className="flex flex-row items-end gap-5 w-fit">
            {/* Môn học — chiếm phần lớn chiều rộng */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <label className="text-sm font-semibold text-gray-800">
                Môn học <span className="text-red-500">*</span>
              </label>
              <Dropdown
                label="Chọn môn học"
                options={MON_HOC_OPTIONS}
                value={monHoc}
                onChange={(v) => { setMonHoc(v); setError(""); }}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            {/* Lớp — cố định 120 px */}
            <div className="flex flex-col gap-1.5 shrink-0" style={{ width: "120px" }}>
              <label className="text-sm font-semibold text-gray-800">
                Lớp <span className="text-red-500">*</span>
              </label>
              <Dropdown
                label="Lớp"
                options={LOP_OPTIONS}
                value={lop}
                onChange={setLop}
              />
            </div>
          </div>

          {/* ── Năm + Kỳ ── */}
          <div className="flex flex-row items-end gap-8 w-fit">
            <div className="flex flex-col gap-1.5" style={{ width: "140px" }}>
              <label className="text-sm font-semibold text-gray-800">Năm</label>
              <Dropdown
                label="Chọn năm học"
                options={[{ label: "2025", value: 1 }, { label: "2026", value: 2 }]}
                value={year}
                onChange={setYear}
              />
            </div>
            <div className="flex flex-col gap-1.5" style={{ width: "140px" }}>
              <label className="text-sm font-semibold text-gray-800">Kỳ</label>
              <Dropdown
                label="Kỳ"
                options={[{ label: "Spring", value: 1 }, { label: "Summer", value: 2 }, { label: "Fall", value: 3 }]}
                value={ky}
                onChange={setKy}
              />
            </div>
          </div>

          {/* ── Upload ── */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-800">Upload files</label>

            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl cursor-pointer
                flex flex-col items-center justify-center
                py-8 sm:py-12 gap-2 transition-colors
                ${dragging
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40"}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".xls,.xlsx,.csv"
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
              <div className="w-10 h-10 flex items-center justify-center text-indigo-600">
                <Upload size={28} strokeWidth={1.8} />
              </div>
              <p className="text-sm font-semibold text-gray-700">Drag your files to start uploading</p>
              <p className="text-xs text-gray-400">Or</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="px-5 py-1.5 rounded-lg border border-indigo-500 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-colors"
              >
                Browse files
              </button>
            </div>

            <p className="text-xs text-gray-400">Hỗ trợ định dạng: XLS, XLSX, CSV.</p>

            {files.length > 0 && (
              <ul className="flex flex-col gap-2 mt-1">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                    <File size={15} className="text-indigo-400 shrink-0" />
                    <span className="text-xs text-gray-600 flex-1 truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 pb-6 sm:pb-7 pt-2 sticky bottom-0 bg-white">
          <button
            onClick={handleSubmit}
            className="
              w-full py-3 rounded-xl
              bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]
              text-white text-sm font-bold tracking-wide
              shadow-md shadow-indigo-200 transition-all duration-200
            "
          >
            Tạo lớp
          </button>
        </div>
      </div>
    </div>
  );
}