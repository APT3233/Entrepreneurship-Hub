import { useState } from "react";
import { X, UserPlus } from "lucide-react";

/**
 * ManualStudentForm
 * Form thêm/sửa sinh viên thủ công vào lớp học
 */
export default function ManualStudentForm({ isOpen, onClose, onSubmit, initialData = null, loading = false }) {
  // Track previous initialData to detect changes
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  const [formData, setFormData] = useState({
    student_code: initialData?.mssv || initialData?.student_code || "",
    full_name: initialData?.name || initialData?.full_name || "",
    email: initialData?.email || "",
    major: initialData?.major || "",
  });

  const [errors, setErrors] = useState({});

  // Sync state if initialData prop changes (during render)
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setFormData({
      student_code: initialData?.mssv || initialData?.student_code || "",
      full_name: initialData?.name || initialData?.full_name || "",
      email: initialData?.email || "",
      major: initialData?.major || "",
    });
    setErrors({});
  }

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.student_code.trim()) newErrors.student_code = "Mã sinh viên là bắt buộc";
    if (!formData.full_name.trim()) newErrors.full_name = "Họ tên là bắt buộc";
    if (!formData.email.trim()) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit?.(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-4">
      <div className="relative w-full max-w-md bg-surface rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-accent-600">
            <UserPlus size={20} />
            <h2 className="text-base font-bold text-gray-900">
              {initialData ? "Sửa thông tin sinh viên" : "Thêm sinh viên thủ công"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mã sinh viên (MSSV) *</label>
            <input
              name="student_code"
              value={formData.student_code}
              onChange={handleChange}
              placeholder="Ví dụ: DE180001"
              className={`px-4 py-2.5 rounded-xl bg-gray-50 border text-sm outline-none transition-all ${
                errors.student_code ? "border-red-300 bg-red-50" : "border-gray-100 focus:border-accent-300 focus:bg-surface"
              }`}
            />
            {errors.student_code && <p className="text-[10px] text-red-500 font-medium">{errors.student_code}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Họ và tên *</label>
            <input
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Ví dụ: Nguyễn Văn A"
              className={`px-4 py-2.5 rounded-xl bg-gray-50 border text-sm outline-none transition-all ${
                errors.full_name ? "border-red-300 bg-red-50" : "border-gray-100 focus:border-accent-300 focus:bg-surface"
              }`}
            />
            {errors.full_name && <p className="text-[10px] text-red-500 font-medium">{errors.full_name}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email *</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ví dụ: sv@fpt.edu.vn"
              className={`px-4 py-2.5 rounded-xl bg-gray-50 border text-sm outline-none transition-all ${
                errors.email ? "border-red-300 bg-red-50" : "border-gray-100 focus:border-accent-300 focus:bg-surface"
              }`}
            />
            {errors.email && <p className="text-[10px] text-red-500 font-medium">{errors.email}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chuyên ngành</label>
            <input
              name="major"
              value={formData.major}
              onChange={handleChange}
              placeholder="Ví dụ: IT, Kinh tế..."
              className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm outline-none focus:border-accent-300 focus:bg-surface transition-all"
            />
          </div>

          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gray-50 text-gray-600 text-sm font-bold hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent-hover shadow-md shadow-accent-100 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : initialData ? "Cập nhật sinh viên" : "Thêm sinh viên"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
