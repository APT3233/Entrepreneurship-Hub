import { useState } from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { LastNameAvatar } from "@/components/icons/ui";

/**
 * CreateGroupModal
 *
 * Props:
 * - isOpen    : boolean
 * - onClose   : () => void
 * - onSubmit  : ({ name, mentor, category, topic, members }) => void
 * - students  : Array<{ id, name, mssv?, student_code?, major }>
 * - categories: string[]
 */

function SelectField({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-100 text-sm text-gray-600 hover:bg-gray-150 transition-colors"
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>{value || placeholder}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-white border border-gray-100 rounded-xl shadow-lg py-1 overflow-hidden">
          {options.map(opt => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                  ${opt === value ? "bg-indigo-50 text-indigo-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const DEFAULT_STUDENTS = [
  { id: 1, name: "Nguyễn Văn A", mssv: "DS180001", major: "IT" },
  { id: 2, name: "Nguyễn Văn C", mssv: "DS180002", major: "IT" },
  { id: 3, name: "Trần Huy B", mssv: "DS180003", major: "Design" },
  { id: 4, name: "Lê Thị V", mssv: "DS180463", major: "Kinh tế" },
  { id: 5, name: "Huỳnh Lê C", mssv: "DS180273", major: "Kinh Tế" },
  { id: 6, name: "Lê Ngọc H", mssv: "DE180473", major: "IT" },
];

const DEFAULT_CATEGORIES = ["Web Development", "Mobile App", "AI / ML", "Kinh doanh", "Thiết kế"];

function getMajorStatus(students, memberIds) {
  const selected = students.filter((s) => memberIds.includes(s.id));
  const majors = selected.map((s) => (s.major || "").toLowerCase());

  const hasDesign = majors.some((m) => m.includes("design"));
  const hasIT = majors.some((m) => m === "it");
  const hasEcon = majors.some((m) => m.includes("kinh"));

  return {
    hasDesign,
    hasIT,
    hasEcon,
    isValid: hasDesign && hasIT && hasEcon,
  };
}

export default function CreateGroupModal({
  isOpen = false,
  onClose,
  onSubmit,
  students = DEFAULT_STUDENTS,
  categories = DEFAULT_CATEGORIES,
}) {
  const [name, setName] = useState("");
  const [mentor, setMentor] = useState("");
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState("");
  const [members, setMembers] = useState([]);
  const [nameError, setNameError] = useState("");

  if (!isOpen) return null;

  const toggleMember = (id) => {
    setMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const { isValid } = getMajorStatus(students, members);

  const handleSubmit = () => {
    if (!name.trim()) {
      setNameError("* Vui lòng nhập tên nhóm");
      return;
    }

    setNameError("");
    onSubmit?.({ name, mentor, category, topic, members });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="
        relative w-full bg-white shadow-2xl flex flex-col
        rounded-t-2xl sm:rounded-2xl
        max-h-[95dvh] sm:max-h-[90vh]
        sm:mx-4 sm:max-w-xl lg:max-w-2xl
      ">
        {/* Drag handle mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="px-6 pt-4 sm:pt-6 pb-4 border-b border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
          <h2 className="text-base font-bold text-gray-900">Tạo nhóm mới</h2>
          <p className="text-xs text-gray-400 mt-0.5">Tạo nhóm và mời thành viên tham gia</p>
        </div>

        {/* Scrollable body */}
        <div className="px-6 py-5 flex flex-col gap-5">

          {/* Tên nhóm */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-900">
              Tên nhóm <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(""); }}
              placeholder="Ví dụ: Alpha"
              className={`w-full px-4 py-3 rounded-xl bg-gray-100 text-sm placeholder-gray-400
                outline-none border border-transparent transition-colors
                ${nameError ? "border-red-400" : "focus:border-indigo-300"}`}
            />
            {nameError && <p className="text-xs text-red-500">{nameError}</p>}
          </div>

          {/* Mentor + Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-900">Mentor</label>
              <input
                value={mentor}
                onChange={(e) => setMentor(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm placeholder-gray-400 outline-none border border-transparent focus:border-indigo-300 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-900">Categories</label>
              <SelectField
                value={category}
                onChange={setCategory}
                options={categories}
                placeholder="Web Development"
              />
            </div>
          </div>

          {/* Topic */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-900">Topic</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: Thiết kế web..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm placeholder-gray-400
                outline-none border border-transparent focus:border-indigo-300 transition-colors resize-none"
            />
          </div>

          {/* Mời thành viên */}
          <div className="flex flex-col gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Mời thành viên</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Nhóm cần ít nhất 1 thành viên từ mỗi chuyên ngành: Design, IT, Kinh tế
              </p>
              {members.length > 0 && (
                <p
                  className={`text-xs mt-0.5 ${isValid ? "text-emerald-500" : "text-red-500"
                    }`}
                >
                  {isValid
                    ? "✓ Đủ thành viên từ các chuyên ngành"
                    : "* Nhóm cần ít nhất 1 sinh viên ngành Design, 1 sinh viên ngành IT và 1 sinh viên ngành Kinh tế"}
                </p>
              )}
            </div>

            {/* Student list — chỉ hiển thị sinh viên chưa có nhóm */}
            <div className="border border-gray-100 rounded-xl overflow-y-auto divide-y divide-gray-100 max-h-64">
              {students.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  Tất cả sinh viên đã có nhóm. Không còn ai để thêm vào nhóm mới.
                </div>
              ) : (
                students.map((s, i) => {
                  const added = members.includes(s.id);
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <LastNameAvatar name={s.name} index={i} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.mssv || s.student_code || s.major}</p>
                      </div>
                      {added ? (
                        <button
                          type="button"
                          onClick={() => toggleMember(s.id)}
                          className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"
                        >
                          <Check size={16} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleMember(s.id)}
                          className="px-4 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-all duration-150 shrink-0"
                        >
                          Thêm
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className={`
              w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200
              ${isValid
                ? "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white shadow-md shadow-indigo-200"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"}
            `}
          >
            Tạo nhóm
          </button>
        </div>
      </div>
    </div>
  );
}