import { useState, useEffect } from "react";
import { X, ChevronDown, Check, Crown } from "lucide-react";
import { LastNameAvatar } from "@/components/icons/ui";
import GroupApi from "@/api/group";

/**
 * CreateGroupForm
 *
 * Props:
 * - isOpen    : boolean
 * - onClose   : () => void
 * - onSubmit  : ({ name, mentor, mentorDept, category, topic, topic_desc, zalo_link, members, leaderId }) => void
 * - students  : Array<{ id, name, student_code?, major }>
 * - categories: string[]
 * - loading   : boolean  — đang gửi form
 * Trong modal chỉ hiển thị trạng thái thiếu/đủ thành viên; thông báo thành công/lỗi dùng toast bên ngoài.
 */

function MentorSelectField({ value, onChange, options, placeholder, loading }) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-100 text-sm text-gray-600 hover:bg-gray-150 transition-colors text-left"
      >
        <span className={selectedOption ? "text-gray-800" : "text-gray-400 truncate pr-2"}>
          {selectedOption ? `${selectedOption.full_name} (${selectedOption.organization || "Không rõ bộ phận"})` : placeholder}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <ul className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-surface border border-gray-100 rounded-xl shadow-lg py-1 max-h-60 overflow-y-auto">
            {loading ? (
              <li className="px-4 py-2.5 text-sm text-gray-400">Đang tải danh sách...</li>
            ) : options.length === 0 ? (
              <li className="px-4 py-2.5 text-sm text-gray-400">Không có mentor khả dụng</li>
            ) : (
              <>
                <li>
                  <button
                    type="button"
                    onClick={() => { onChange(""); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                      ${!value ? "bg-accent-50 text-accent-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    Không phân công (None)
                  </button>
                </li>
                {options.map(opt => (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => { onChange(opt.id); setOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                        ${opt.id === value ? "bg-accent-50 text-accent-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      <div className="font-semibold text-gray-800">{opt.full_name}</div>
                      <div className="text-xs text-gray-400 truncate">{opt.organization || opt.position_title || "Mentor"}</div>
                    </button>
                  </li>
                ))}
              </>
            )}
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
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-100 text-sm text-gray-600 hover:bg-gray-150 transition-colors"
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>{value || placeholder}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-surface border border-gray-100 rounded-xl shadow-lg py-1 overflow-hidden">
          {options.map(opt => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                  ${opt === value ? "bg-accent-50 text-accent-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
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
  { id: 1, name: "Nguyễn Văn A", student_code: "DS180001", major: "IT" },
  { id: 2, name: "Nguyễn Văn C", student_code: "DS180002", major: "IT" },
  { id: 3, name: "Trần Huy B", student_code: "DS180003", major: "Design" },
  { id: 4, name: "Lê Thị V", student_code: "DS180463", major: "Kinh tế" },
  { id: 5, name: "Huỳnh Lê C", student_code: "DS180273", major: "Kinh Tế" },
  { id: 6, name: "Lê Ngọc H", student_code: "DE180473", major: "IT" },
];

const DEFAULT_CATEGORIES = ["Web Development", "Mobile App", "AI / ML", "Kinh doanh", "Thiết kế"];

function getCompositionStatus(students, memberIds) {
  const selected = students.filter((s) => memberIds.includes(s.id));
  const codes = selected.map((s) => (s.student_code || s.mssv || "").toUpperCase());

  const deCount = codes.filter((c) => c.startsWith("DE")).length;
  const dsDaCount = codes.filter((c) => c.startsWith("DS") || c.startsWith("DA")).length;

  const count = selected.length;
  const isSizeValid = count >= 4 && count <= 6;
  const isCompositionValid = deCount >= 2 && dsDaCount >= 2;

  let message = "";
  if (count === 0) {
    message = "Vui lòng chọn thành viên cho nhóm.";
  } else if (!isSizeValid) {
    message = `Số lượng thành viên không hợp lệ (${count}/6). Nhóm cần từ 4 đến 6 người.`;
  } else if (!isCompositionValid) {
    const missing = [];
    if (deCount < 2) missing.push(`${2 - deCount} SV ngành DE`);
    if (dsDaCount < 2) missing.push(`${2 - dsDaCount} SV ngành DS/DA`);
    message = `Nhóm cần thêm: ${missing.join(" và ")}. (Hiện tại: ${deCount} DE, ${dsDaCount} DS/DA)`;
  } else {
    message = "✓ Đủ số lượng và thành phần (2 DE, 2 DS/DA).";
  }

  return {
    deCount,
    dsDaCount,
    isSizeValid,
    isCompositionValid,
    isValid: isSizeValid && isCompositionValid,
    message,
  };
}

export default function CreateGroupForm({
  isOpen = false,
  onClose,
  onSubmit,
  students = DEFAULT_STUDENTS,
  categories = DEFAULT_CATEGORIES,
  loading = false,
}) {
  const [name, setName] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [availableMentors, setAvailableMentors] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState("");
  const [topicDesc, setTopicDesc] = useState("");
  const [zaloLink, setZaloLink] = useState("");
  const [members, setMembers] = useState([]);
  const [leaderId, setLeaderId] = useState(null);
  const [nameError, setNameError] = useState("");

  const [mouseDownTarget, setMouseDownTarget] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setLoadingMentors(true);
      GroupApi.getAvailableMentors()
        .then((res) => {
          const data = res?.data ?? [];
          setAvailableMentors(data);
        })
        .catch((err) => {
          console.error("Failed to fetch available mentors:", err);
        })
        .finally(() => {
          setLoadingMentors(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleMember = (id) => {
    setMembers(prev => {
      const isRemoving = prev.includes(id);
      if (isRemoving) {
        if (leaderId === id) setLeaderId(null);
        return prev.filter(m => m !== id);
      } else {
        const next = [...prev, id];
        // Auto set leader if it's the first member
        if (next.length === 1) setLeaderId(id);
        return next;
      }
    });
  };

  const status = getCompositionStatus(students, members);
  const isValid = status.isValid && leaderId != null;

  const handleSubmit = () => {
    if (!name.trim()) {
      setNameError("* Vui lòng nhập tên nhóm");
      return;
    }

    setNameError("");
    const selectedMentor = availableMentors.find(m => m.id === selectedMentorId);
    onSubmit?.({
      name,
      mentorId: selectedMentor ? selectedMentor.id : null,
      mentor: selectedMentor ? selectedMentor.full_name : "",
      mentorDept: selectedMentor ? (selectedMentor.organization || "Khoa Hệ thống Thông tin") : "",
      category,
      topic,
      topic_desc: topicDesc,
      zalo_link: zaloLink,
      members,
      leaderId
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onMouseDown={(e) => setMouseDownTarget(e.target)}
      onMouseUp={(e) => {
        if (mouseDownTarget === e.currentTarget && e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div 
        className="
          relative w-full bg-surface shadow-2xl flex flex-col
          rounded-t-2xl sm:rounded-2xl
          max-h-[95dvh] sm:max-h-[90vh]
          sm:mx-4 sm:max-w-xl lg:max-w-2xl
        "
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
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
        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto">

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
                ${nameError ? "border-red-400" : "focus:border-accent-300"}`}
            />
            {nameError && <p className="text-xs text-red-500">{nameError}</p>}
          </div>

          {/* Mentor + Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-900">Mentor</label>
              <MentorSelectField
                value={selectedMentorId}
                onChange={setSelectedMentorId}
                options={availableMentors}
                placeholder="Chọn Mentor"
                loading={loadingMentors}
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
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: E-commerce Platform..."
              className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm placeholder-gray-400 outline-none border border-transparent focus:border-accent-300 transition-colors"
            />
          </div>

          {/* Link Zalo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-900">Link Zalo</label>
            <input
              value={zaloLink}
              onChange={(e) => setZaloLink(e.target.value)}
              placeholder="Ví dụ: https://zalo.me/g/xxxxxx"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm placeholder-gray-400 outline-none border border-transparent focus:border-accent-300 transition-colors"
            />
          </div>

          {/* Topic Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-900">Topic Description</label>
            <textarea
              value={topicDesc}
              onChange={(e) => setTopicDesc(e.target.value)}
              placeholder="Ví dụ: Mô tả chi tiết về dự án..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm placeholder-gray-400
                outline-none border border-transparent focus:border-accent-300 transition-colors resize-none"
            />
          </div>

          {/* Mời thành viên */}
          <div className="flex flex-col gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Mời thành viên</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Nhóm cần 4 - 6 thành viên: tối thiểu 2 DE và 2 DS/DA.
              </p>
              <p className="text-[10px] text-accent-500 font-medium mt-1">
                * Sau khi thêm, hãy nhấn biểu tượng <Crown size={10} className="inline mb-0.5" /> để chọn trưởng nhóm.
              </p>
              <p
                className={`text-xs mt-1.5 font-medium ${
                  isValid ? "text-emerald-500" : "text-amber-500"
                }`}
              >
                {status.message} {!leaderId && members.length > 0 && "(Thiếu trưởng nhóm)"}
              </p>
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
                  const isLeader = leaderId === s.id;
                  return (
                    <div key={s.id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${added ? "bg-accent-50/30" : "hover:bg-gray-50"}`}>
                      <LastNameAvatar name={s.name} index={i} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                           <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                           {isLeader && <span className="text-[9px] bg-accent-100 text-accent-600 px-1.5 py-0.5 rounded font-bold uppercase">Leader</span>}
                        </div>
                        <p className="text-xs text-gray-400">{s.student_code || s.mssv || s.major}</p>
                      </div>
                      
                      {added && (
                        <button
                          type="button"
                          onClick={() => setLeaderId(s.id)}
                          title={isLeader ? "Đang là trưởng nhóm" : "Chọn làm trưởng nhóm"}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isLeader ? "text-amber-500 bg-amber-50" : "text-gray-300 hover:text-amber-400 hover:bg-gray-100"}`}
                        >
                          <Crown size={18} fill={isLeader ? "currentColor" : "none"} />
                        </button>
                      )}

                      {added ? (
                        <button
                          type="button"
                          onClick={() => toggleMember(s.id)}
                          className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 hover:bg-emerald-200"
                        >
                          <Check size={16} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleMember(s.id)}
                          className="px-4 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-accent-300 hover:text-accent-600 transition-all duration-150 shrink-0"
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
            disabled={!isValid || loading}
            className={`
              w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200
              ${isValid && !loading
                ? "bg-accent hover:bg-accent-hover active:scale-[0.99] text-white shadow-md shadow-accent-200"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"}
            `}
          >
            {loading ? "Đang tạo..." : "Tạo nhóm"}
          </button>
        </div>
      </div>
    </div>
  );
}