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
 *
 * Status được tự động tính từ majors:
 *   - Tất cả ngành >= minRequired (default 1) → "eligible"   (xanh)
 *   - Có ngành = 0                            → "ineligible" (đỏ)
 *   - Có ngành < minRequired nhưng > 0        → "warning"    (vàng)
 */

const MAJOR_STYLE = {
  "Design":  { text: "text-blue-600",   bg: "bg-blue-50",   emptyBg: "bg-gray-50", emptyText: "text-gray-400" },
  "IT":      { text: "text-purple-600", bg: "bg-purple-50", emptyBg: "bg-gray-50", emptyText: "text-gray-400" },
  "Kinh tế": { text: "text-green-700",  bg: "bg-green-50",  emptyBg: "bg-gray-50", emptyText: "text-gray-400" },
};

function majorStyle(name, isEmpty) {
  const s = MAJOR_STYLE[name] ?? { text: "text-gray-600", bg: "bg-gray-50", emptyBg: "bg-gray-50", emptyText: "text-gray-400" };
  return isEmpty
    ? { text: s.emptyText, bg: s.emptyBg }
    : { text: s.text, bg: s.bg };
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
  eligible:   { label: "Đủ điều kiện",      icon: CheckCircle2,   color: "text-green-600"  },
  warning:    { label: "Cần kiểm tra",       icon: AlertTriangle,  color: "text-yellow-500" },
  ineligible: { label: "Chưa đủ điều kiện", icon: XCircle,        color: "text-red-500"    },
};

const WARNING_STYLE = {
  warning:    { bg: "bg-yellow-50",  border: "border-yellow-200", text: "text-yellow-700", Icon: AlertCircle,   iconColor: "text-yellow-500" },
  ineligible: { bg: "bg-red-50",     border: "border-red-200",    text: "text-red-600",    Icon: AlertTriangle, iconColor: "text-red-500"    },
};


const DEFAULT_MAJORS = [
  { name: "Design",  count: 1, minRequired: 1 },
  { name: "IT",      count: 3, minRequired: 1 },
  { name: "Kinh tế", count: 2, minRequired: 1 },
];

export default function GroupCard({
  name      = "Nhóm Alpha",
  classCode = "GD18D01",
  members   = 6,
  majors    = DEFAULT_MAJORS,
  avatars   = [],
  onDetail,
}) {
  const status   = calcStatus(majors);
  const warnings = buildWarnings(majors);
  const { label, icon: StatusIcon, color } = STATUS_CONFIG[status];
  const warnStyle = WARNING_STYLE[status];

  const shownAvatars = avatars.slice(0, 3);
  const extraCount   = Math.max(0, members - shownAvatars.length);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 w-full flex flex-col gap-4">

      {/* Row 1: Group info + status badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <GroupIcon2 status={status} />
          <div>
            <p className="text-sm font-bold text-gray-900">{name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{classCode} · {members} thành viên</p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 shrink-0 ${color}`}>
          <StatusIcon size={15} />
          <span className="text-xs font-semibold">{label}</span>
        </div>
      </div>

      {/* Row 2: Major badges */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${majors.length}, 1fr)` }}>
        {majors.map(({ name: mName, count }) => {
          const isEmpty = count === 0;
          const { text, bg } = majorStyle(mName, isEmpty);
          return (
            <div key={mName} className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${isEmpty ? "border-gray-200" : "border-transparent"} ${bg}`}>
              <span className={`text-sm font-bold ${text}`}>{mName}</span>
              <span className={`text-xs ${isEmpty ? "text-gray-300" : "text-gray-400"}`}>
                {count} Student{count !== 1 ? "s" : ""}
              </span>
            </div>
          );
        })}
      </div>

      {/* Row 3: Warning / error messages */}
      {warnings.length > 0 && warnStyle && (
        <div className={`flex flex-col gap-1.5 px-4 py-3 rounded-xl border ${warnStyle.bg} ${warnStyle.border}`}>
          {warnings.map((msg, i) => (
            <div key={i} className="flex items-start gap-2">
              <warnStyle.Icon size={14} className={`mt-0.5 shrink-0 ${warnStyle.iconColor}`} />
              <p className={`text-xs font-medium ${warnStyle.text}`}>{msg}</p>
            </div>
          ))}
        </div>
      )}

      {/* Row 4: Avatars + detail */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {shownAvatars.length > 0
            ? shownAvatars.map((src, i) => (
                <img key={i} src={src} alt=""
                  style={{ marginLeft: i === 0 ? 0 : "-8px", zIndex: 10 - i }}
                  className="relative w-8 h-8 rounded-full border-2 border-white object-cover"
                />
              ))
            : [0, 1, 2].map((i) => (
                <div key={i}
                  style={{ marginLeft: i === 0 ? 0 : "-8px", zIndex: 10 - i }}
                  className="relative w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center"
                >
                  <Users size={12} className="text-gray-400" />
                </div>
              ))
          }
          {extraCount > 0 && (
            <span className="ml-2 text-xs text-gray-400 font-medium">+{extraCount}</span>
          )}
        </div>

        <button
          onClick={onDetail}
          className="flex items-center gap-1 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
        >
          Xem chi tiết
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}