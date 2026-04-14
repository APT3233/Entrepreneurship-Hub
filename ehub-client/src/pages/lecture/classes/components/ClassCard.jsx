import { useMemo } from "react";
import { Users, BarChart2 } from "lucide-react";
import { GroupIcon } from "@/components/icons/lecture";

const CARD_HEADER_COLORS = [
  { bg: "bg-blue-500", text: "text-blue-100" },
  { bg: "bg-indigo-500", text: "text-indigo-100" },
  { bg: "bg-violet-500", text: "text-violet-100" },
  { bg: "bg-purple-500", text: "text-purple-100" },
  { bg: "bg-fuchsia-500", text: "text-fuchsia-100" },
  { bg: "bg-pink-500", text: "text-pink-100" },
  { bg: "bg-rose-500", text: "text-rose-100" },
  { bg: "bg-amber-500", text: "text-amber-100" },
  { bg: "bg-emerald-500", text: "text-emerald-100" },
  { bg: "bg-teal-500", text: "text-teal-100" },
  { bg: "bg-cyan-500", text: "text-cyan-100" },
  { bg: "bg-sky-500", text: "text-sky-100" },
];

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i) | 0;
  return Math.abs(h);
}

/**
 * ClassCard
 *
 * Props:
 * - code        : string   — Mã lớp (vd: "GD18D01")
 * - subject     : string   — Môn + học kỳ (vd: "EXE101 - Học kì Fall 2026")
 * - students    : number
 * - groups      : number
 * - completion  : number   — % hoàn thành (0–100)
 * - avatars     : string[] — mảng URL ảnh đại diện (tối đa hiển thị 3)
 * - onDetail    : () => void
 */
export default function ClassCard({
  code       = "GD18D01",
  subject    = "EXE101 - Học kì Fall 2026",
  students   = 32,
  groups     = 6,
  completion = 85,
  avatars    = [],
  semesterStatus = null,
  onDetail,
}) {
  const shownAvatars = avatars.slice(0, 3);
  const extraCount = Math.max(0, students - 3);
  
  // If no actual avatars are provided, we show up to 3 placeholder avatars based on student count
  const placeholderCount = shownAvatars.length === 0 ? Math.min(students, 3) : 0;
  const placeholders = Array.from({ length: placeholderCount });

  const headerColor = useMemo(() => {
    const idx = hashCode(code) % CARD_HEADER_COLORS.length;
    return CARD_HEADER_COLORS[idx];
  }, [code]);

  return (
    <div className="w-full min-w-0 rounded-2xl overflow-hidden border border-gray-100 shadow-md bg-white hover:shadow-lg transition-shadow">

      {/* ── Header (màu cố định theo code) ── */}
      <div className={`${headerColor.bg} px-4 py-4 sm:px-5 sm:py-5 relative`}>
        {semesterStatus === "upcoming" && (
          <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Sắp diễn ra</span>
          </div>
        )}
        {semesterStatus === "ongoing" && (
          <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-green-400/20 backdrop-blur-md border border-green-400/30">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Đang diễn ra</span>
          </div>
        )}
        <h2 className="text-lg sm:text-xl font-bold text-white truncate">{code}</h2>
        <p className={`text-xs sm:text-sm ${headerColor.text} mt-0.5 line-clamp-2`}>{subject}</p>
      </div>

      {/* ── Body ── */}
      <div className="px-4 py-4 sm:px-5 sm:py-5 flex flex-col gap-4 sm:gap-5">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
          <div className="flex flex-col items-center gap-1.5 sm:gap-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users size={20} className="text-blue-500 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{students}</p>
              <p className="text-[10px] sm:text-xs text-gray-400">Sinh viên</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5 sm:gap-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <GroupIcon />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{groups}</p>
              <p className="text-[10px] sm:text-xs text-gray-400">Nhóm</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5 sm:gap-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <BarChart2 size={20} className="text-green-500 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{completion}%</p>
              <p className="text-[10px] sm:text-xs text-gray-400">Hoàn thành</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Footer: avatars + button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center min-w-0">
            {shownAvatars.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                style={{ marginLeft: i === 0 ? 0 : "-8px", zIndex: shownAvatars.length - i }}
                className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white object-cover shrink-0"
              />
            ))}
            {placeholders.map((_, i) => (
              <div
                key={i}
                style={{ marginLeft: i === 0 ? 0 : "-8px", zIndex: 3 - i }}
                className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center shrink-0"
              >
                <Users size={12} className="text-gray-400" />
              </div>
            ))}
            {extraCount > 0 && (
              <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs text-gray-400 font-medium shrink-0">+{extraCount}</span>
            )}
          </div>
          <button
            onClick={onDetail}
            className="px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-semibold transition-all duration-150 shrink-0 cursor-pointer"
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}

