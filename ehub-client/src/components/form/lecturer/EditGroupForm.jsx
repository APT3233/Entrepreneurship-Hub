import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

/**
 * EditGroupForm Component
 * - Displays a form to edit group information.
 * - Matches the design provided in the user's image.
 */
function SelectField({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 text-sm text-gray-800 hover:bg-gray-100 transition-all border border-gray-200 focus:border-accent-300 focus:ring-2 focus:ring-accent-100 outline-none"
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <ChevronDown 
          size={18} 
          className={`text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`} 
        />
      </button>
      {open && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)} 
          />
          <ul className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 bg-surface border border-gray-200 rounded-xl shadow-lg py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {options.map(opt => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                    ${opt === value ? "bg-accent-50 text-accent-700 font-medium" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

const DEFAULT_CATEGORIES = ["Web Development", "Mobile App", "AI / ML", "Kinh doanh", "Thiết kế"];

export default function EditGroupForm({
  isOpen = false,
  onClose,
  onSubmit,
  groupData = {},
  categories = DEFAULT_CATEGORIES,
  loading = false,
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState("");
  const [topicDesc, setTopicDesc] = useState("");
  const [zaloLink, setZaloLink] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && groupData) {
      console.log("Loading groupData into modal:", groupData);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(groupData.name || "");
      setCategory(groupData.category || "");
      setTopic(groupData.topic || "");
      setTopicDesc(groupData.topic_desc || "");
      setZaloLink(groupData.zalo_link || "");
      setErrors({});
    }
  }, [isOpen, groupData.name, groupData.category, groupData.topic, groupData.topic_desc, groupData.zalo_link]);

  const [mouseDownTarget, setMouseDownTarget] = useState(null);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Vui lòng nhập tên nhóm";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSubmit?.({ name, category, topic, topic_desc: topicDesc, zalo_link: zaloLink });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300"
      onMouseDown={(e) => setMouseDownTarget(e.target)}
      onMouseUp={(e) => {
        if (mouseDownTarget === e.currentTarget && e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div 
        className="bg-surface rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all active:scale-95"
          >
            <X size={20} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
            Chỉnh sửa thông tin
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Cập nhật các thông tin cơ bản của nhóm
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Tên nhóm */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 block">
              Tên nhóm <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({...errors, name: ""}); }}
              placeholder="Ví dụ: Alpha"
              className={`w-full px-4 py-2.5 rounded-xl bg-surface text-sm text-gray-800 placeholder-gray-400
                outline-none border transition-all
                ${errors.name ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-gray-200 focus:border-accent-400 focus:ring-2 focus:ring-accent-100"}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Categories */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 block">
              Categories
            </label>
            <SelectField
              value={category}
              onChange={setCategory}
              options={categories}
              placeholder="Web Development"
            />
          </div>

          {/* Topic */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 block">
              Topic
            </label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: E-commerce Platform..."
              className="w-full px-4 py-2.5 rounded-xl bg-surface text-sm text-gray-800 placeholder-gray-400
                outline-none border border-gray-200 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all"
            />
          </div>

          {/* Link Zalo */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 block">
              Link Zalo
            </label>
            <input
              value={zaloLink}
              onChange={(e) => setZaloLink(e.target.value)}
              placeholder="Ví dụ: https://zalo.me/g/xxxxxx"
              className="w-full px-4 py-2.5 rounded-xl bg-surface text-sm text-gray-800 placeholder-gray-400
                outline-none border border-gray-200 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all"
            />
          </div>

          {/* Topic Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 block">
              Topic Description
            </label>
            <textarea
              value={topicDesc}
              onChange={(e) => setTopicDesc(e.target.value)}
              placeholder="Ví dụ: Mô tả chi tiết về dự án..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-surface text-sm text-gray-800 placeholder-gray-400
                outline-none border border-gray-200 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex flex-row-reverse gap-3 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className={`
              px-5 py-2 rounded-xl text-sm font-medium transition-all
              ${loading 
                ? "bg-gray-300 text-white cursor-not-allowed" 
                : "bg-accent hover:bg-accent-hover text-white shadow-sm shadow-accent-200 active:scale-[0.98]"}
            `}
          >
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-medium text-gray-600 bg-surface border border-gray-200 hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
