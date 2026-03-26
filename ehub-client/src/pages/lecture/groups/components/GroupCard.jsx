import { useMemo } from "react";
import { Users, CheckCircle2, XCircle, AlertTriangle, AlertCircle, ArrowRight } from "lucide-react";
import { GroupIcon2 } from "@/components/icons/lecture";

/**
 * GroupCard
 *
 * Props:
 * - name      : string
 * - classCode : string
 * - members   : number
 * - majors    : Array<{ name, count, minRequired? }>
 * - avatars   : string[]
 * - onDetail  : () => void
 */

const MAJOR_STYLE = {
  "DE":    { text: "text-blue-600",   bg: "bg-[#F0F7FF]" },
  "DS/DA": { text: "text-purple-600", bg: "bg-[#F9F5FF]" },
  "Design":  { text: "text-blue-600",   bg: "bg-blue-50" },
  "IT":      { text: "text-purple-600", bg: "bg-purple-50" },
  "Kinh tế": { text: "text-green-700",  bg: "bg-green-50" },
};

function majorStyle(name) {
  return MAJOR_STYLE[name] ?? { text: "text-gray-600", bg: "bg-gray-50" };
}

// Tính status từ majors
function calcStatus(majors) {
  const missing  = majors.filter(m => m.count === 0);
  const underMin = majors.filter(m => m.count > 0 && m.count < (m.minRequired ?? 1));
  if (missing.length > 0)  return "ineligible";
  if (underMin.length > 0) return "warning";
  return "eligible";
}

// Tạo warning messages
function buildWarnings(majors) {
  return majors
    .filter(m => m.count < (m.minRequired ?? 1))
    .map(m =>
      m.count === 0
        ? `Thiếu sinh viên chuyên ngành ${m.name}. Cần thêm ít nhất ${m.minRequired ?? 1} sinh viên.`
        : `Cần thêm ít nhất ${(m.minRequired ?? 1) - m.count} sinh viên chuyên ngành ${m.name}.`
    );
}

const STATUS_CONFIG = {
  eligible:   { label: "Đủ điều kiện",      icon: CheckCircle2,   color: "text-green-500"  },
  warning:    { label: "Cần kiểm tra",       icon: AlertTriangle,  color: "text-yellow-500" },
  ineligible: { label: "Chưa đủ điều kiện", icon: XCircle,        color: "text-red-500"    },
};

const WARNING_STYLE = {
  warning:    { bg: "bg-yellow-50",  border: "border-yellow-200", text: "text-yellow-700", Icon: AlertCircle,   iconColor: "text-yellow-500" },
  ineligible: { bg: "bg-red-50",     border: "border-red-200",    text: "text-red-600",    Icon: AlertTriangle, iconColor: "text-red-500"    },
};


const DEFAULT_MAJORS = [
  { name: "DE",    count: 1, minRequired: 1 },
  { name: "DS/DA", count: 3, minRequired: 1 },
];

export default function GroupCard({
  name      = "Nhóm Alpha",
  classCode = "EXE101 - 01",
  topic     = "Mô tả ngắn gọn nội dung topic...",
  members   = 4,
  majors    = [],
  avatars   = [],
  onDetail,
}) {
  // Thống kê sinh viên chung cho DS/DA và DE riêng biệt theo yêu cầu
  const displayMajors = useMemo(() => {
    const source = majors || [];
    
    const deMatch = source.find(m => m.name === "DE");
    const de = deMatch ? deMatch.count : 0;
    
    const ds = source.find(m => m.name === "DS")?.count || 0;
    const da = source.find(m => m.name === "DA")?.count || 0;
    const dsdaMatch = source.find(m => m.name === "DS/DA");
    const dsda = dsdaMatch ? dsdaMatch.count : (ds + da);

    return [
      { name: "DE",    count: de,   minRequired: deMatch?.minRequired ?? 2 },
      { name: "DS/DA", count: dsda, minRequired: dsdaMatch?.minRequired ?? 2 }
    ];
  }, [majors]);

  const status   = calcStatus(displayMajors);
  const warnings = buildWarnings(displayMajors);
  const { label, icon: StatusIcon, color } = STATUS_CONFIG[status];
  const warnStyle = WARNING_STYLE[status];

  const shownAvatars = avatars.slice(0, 3);
  const extraCount   = Math.max(0, members - shownAvatars.length);

  return (
    <div className="bg-white rounded-2xl border-[1.5px] border-blue-400/60 shadow-sm px-4 sm:px-6 py-4 sm:py-5 w-full flex flex-col gap-4 sm:gap-5 transition-all">

      {/* Row 1: Group info + status badge */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="shrink-0 mt-0.5 sm:mt-0">
            <GroupIcon2 status={status} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
              {name} - {classCode}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 line-clamp-2 sm:line-clamp-none">{topic}</p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 shrink-0 self-start sm:self-auto bg-${color.replace('text-', '')}/10 sm:bg-transparent px-2.5 py-1 sm:px-0 sm:py-0 rounded-full sm:rounded-none ${color}`}>
          <StatusIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span className="text-xs sm:text-sm font-medium">{label}</span>
        </div>
      </div>

      {/* Row 2: Major badges */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {displayMajors.map(({ name: mName, count }) => {
          const { text, bg } = majorStyle(mName);
          return (
            <div key={mName} className={`flex flex-col lg:flex-row lg:items-center justify-between px-3 sm:px-5 py-2 sm:py-3 rounded-xl ${bg}`}>
              <span className={`text-sm sm:text-md font-bold ${text}`}>{mName}</span>
              <span className={`text-[11px] sm:text-sm ${text} opacity-80 font-medium mt-0.5 lg:mt-0`}>
                {count} Sinh viên
              </span>
            </div>
          );
        })}
      </div>

      {/* Row 3: Warning / error messages */}
      {warnings.length > 0 && warnStyle && (
        <div className={`flex flex-col gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border ${warnStyle.bg} ${warnStyle.border}`}>
          {warnings.map((msg, i) => (
            <div key={i} className="flex items-start gap-2">
              <warnStyle.Icon size={14} className={`mt-0.5 shrink-0 ${warnStyle.iconColor} w-[14px] h-[14px]`} />
              <p className={`text-[11px] sm:text-xs font-medium ${warnStyle.text} leading-relaxed`}>{msg}</p>
            </div>
          ))}
        </div>
      )}

      {/* Row 4: Avatars + detail */}
      <div className="flex items-center justify-between mt-1 pt-1">
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {shownAvatars.length > 0
              ? shownAvatars.map((src, i) => (
                  <img key={i} src={src} alt=""
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2 border-white object-cover shadow-sm"
                  />
                ))
              : [0, 1, 2].map((i) => (
                  <div key={i}
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center shadow-sm"
                  >
                    <Users size={12} className="text-gray-300 sm:w-[14px] sm:h-[14px]" />
                  </div>
                ))
            }
          </div>
          {extraCount > 0 && (
            <div className="ml-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
               <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold">+{extraCount}</span>
            </div>
          )}
        </div>

        <button
          onClick={onDetail}
          className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold text-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <span>Xem chi tiết</span>
          <ArrowRight size={14} className="sm:w-[16px] sm:h-[16px]" />
        </button>
      </div>
    </div>
  );
}