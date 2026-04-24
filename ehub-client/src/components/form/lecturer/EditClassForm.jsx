import { useState, useEffect } from "react";
import { X, Settings2 } from "lucide-react";
import Dropdown from "@/components/ui/filter/DropDown";
import SubjectApi from "@/api/subject";

const CLASS_OPTIONS = Array.from({ length: 25 }, (_, i) => ({
  label: String(i + 1).padStart(2, "0"),
  value: i + 1,
}));

const SEMESTER_OPTIONS = [
  { label: "Spring", value: 1 },
  { label: "Summer", value: 2 },
  { label: "Fall", value: 3 },
];

// Map prefix mã học kỳ (SP/SU/FA) → loại kỳ tương ứng để khớp Joi server-side
const SEMESTER_TYPE_FROM_PREFIX = { SP: 1, SU: 2, FA: 3 };

export default function EditClassForm({ isOpen, onClose, onUpdate, initialData, loading = false }) {
  const currentYear = new Date().getFullYear();
  const YEAR_OPTIONS = Array.from({ length: 2 }, (_, i) => {
    const y = currentYear + i;
    return { label: String(y), value: y };
  });

  const [subjects, setSubjects] = useState([]);


  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const resp = await SubjectApi.list();
        if (resp.data) {
          setSubjects(resp.data.map((s) => ({ label: s.subject_code, value: s.subject_code })));
        }
      } catch (err) {
        console.error("Failed to fetch subjects:", err);
      }
    };
    if (isOpen) fetchSubjects();
  }, [isOpen]);

  // Helper to parse subject and section from class data
  const parseClassData = (data) => {
    // Backend trả `subject` dạng "EXE101 - Tên môn"; tách lấy mã môn để khớp dropdown subjects
    const subjectField = data?.subject || "";
    const subjectCode = subjectField.includes(" - ")
      ? subjectField.split(" - ")[0].trim()
      : subjectField;
    const classCode = data?.classCode || "";
    let section = 1;
    if (classCode.includes("_")) {
      section = parseInt(classCode.split("_")[1], 10) || 1;
    } else if (classCode.includes("-")) {
      section = parseInt(classCode.split("-")[1], 10) || 1;
    }
    // Derive loại kỳ (1/2/3) từ prefix semester_code do BE trả về (SP/SU/FA),
    // tránh dùng semester_id (ID DB) vì sẽ rớt Joi validate ở server.
    const prefix = String(data?.semester_code || "").slice(0, 2).toUpperCase();
    const semesterType = SEMESTER_TYPE_FROM_PREFIX[prefix] || 1;
    return {
      subject: subjectCode,
      classSection: section,
      year: data?.year || currentYear,
      semester: semesterType,
    };
  };

  // Track previous initialData to detect changes
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  // Initialize state directly from props
  const [formData, setFormData] = useState(() => parseClassData(initialData));

  // Sync state if initialData prop changes (during render)
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setFormData(parseClassData(initialData));
  }

  if (!isOpen) return null;

  const handleSubmit = () => {
    onUpdate?.(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <Settings2 size={20} />
            <h2 className="text-base font-bold text-gray-900">Sửa thông tin lớp học</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Môn học</label>
              <Dropdown
                options={subjects}
                value={formData.subject}
                onChange={(v) => setFormData(prev => ({ ...prev, subject: v }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Số thứ tự lớp</label>
              <Dropdown
                options={CLASS_OPTIONS}
                value={formData.classSection}
                onChange={(v) => setFormData(prev => ({ ...prev, classSection: v }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Năm học</label>
              <Dropdown
                options={YEAR_OPTIONS}
                value={formData.year}
                onChange={(v) => setFormData(prev => ({ ...prev, year: v }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Học kỳ</label>
              <Dropdown
                options={SEMESTER_OPTIONS}
                value={formData.semester}
                onChange={(v) => setFormData(prev => ({ ...prev, semester: v }))}
              />
            </div>
          </div>

          <p className="text-[10px] text-gray-400 italic">
            * Lưu ý: Việc thay đổi thông tin môn học và số lớp sẽ cập nhật lại Mã lớp hiển thị.
          </p>

          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gray-50 text-gray-600 text-sm font-bold hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-[2] py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Đang cập nhật..." : "Cập nhật lớp"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
