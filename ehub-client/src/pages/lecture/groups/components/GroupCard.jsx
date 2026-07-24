import { useMemo } from "react";
import { Users, AlertCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { GroupIcon2 } from "@/components/icons/lecture";
import StatusBadge from "@/components/ui/StatusBadge";

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
  eligible:   { label: "Đủ điều kiện",       tone: "success" },
  warning:    { label: "Cần kiểm tra",       tone: "warning" },
  ineligible: { label: "Chưa đủ điều kiện",  tone: "danger" },
};

const WARNING_STYLE = {
  warning:    { bg: "bg-warning-bg", text: "text-warning-text", Icon: AlertCircle },
  ineligible: { bg: "bg-danger-bg",  text: "text-danger-text",  Icon: AlertTriangle },
};

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
  const { label, tone } = STATUS_CONFIG[status];
  const warnStyle = WARNING_STYLE[status];

  const shownAvatars = avatars.slice(0, 3);
  const placeholderCount = Math.max(0, Math.min(members, 3) - shownAvatars.length);
  const extraCount = Math.max(0, members - 3);

  return (
    <div className="bg-surface rounded-card border border-border px-4 sm:px-6 py-4 sm:py-5 w-full flex flex-col gap-4 sm:gap-5 transition-colors">

      {/* Row 1: Group info + status badge */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="shrink-0 mt-0.5 sm:mt-0">
            <GroupIcon2 status={status} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-base sm:text-lg font-medium text-text-primary leading-tight">
              {name} - {classCode}
            </h3>
            <p className="text-sm text-text-secondary mt-1 line-clamp-2 sm:line-clamp-none">{topic}</p>
          </div>
        </div>

        <div className="shrink-0 self-start sm:self-auto">
          <StatusBadge status={tone} label={label} />
        </div>
      </div>

      {/* Row 2: Major badges */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {displayMajors.map(({ name: mName, count }) => (
          <div key={mName} className="flex flex-col lg:flex-row lg:items-center justify-between px-3 sm:px-5 py-2 sm:py-3 rounded-control bg-subtle">
            <span className="text-sm font-medium text-text-primary">{mName}</span>
            <span className="text-label text-text-secondary mt-0.5 lg:mt-0">
              {count} Sinh viên
            </span>
          </div>
        ))}
      </div>

      {/* Row 3: Warning / error messages */}
      {warnings.length > 0 && warnStyle && (
        <div className={`flex flex-col gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-control ${warnStyle.bg}`}>
          {warnings.map((msg, i) => (
            <div key={i} className="flex items-start gap-2">
              <warnStyle.Icon size={14} className={`mt-0.5 shrink-0 ${warnStyle.text}`} />
              <p className={`text-xs font-medium ${warnStyle.text} leading-relaxed`}>{msg}</p>
            </div>
          ))}
        </div>
      )}

      {/* Row 4: Avatars + detail */}
      <div className="flex items-center justify-between mt-1 pt-1">
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {shownAvatars.map((src, i) => (
              <img key={`avatar-${i}`} src={src} alt=""
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2 border-surface object-cover"
                style={{ zIndex: 10 - i }}
              />
            ))}
            {Array.from({ length: placeholderCount }).map((_, i) => (
              <div key={`placeholder-${i}`}
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2 border-surface bg-subtle flex items-center justify-center"
                style={{ zIndex: 5 - i }}
              >
                <Users size={12} className="text-text-muted sm:w-[14px] sm:h-[14px]" />
              </div>
            ))}
          </div>
          {extraCount > 0 && (
            <div className="ml-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-subtle border border-border flex items-center justify-center">
               <span className="text-label text-text-secondary">+{extraCount}</span>
            </div>
          )}
        </div>

        <button
          onClick={onDetail}
          className="flex items-center gap-1 sm:gap-1.5 text-sm font-medium text-accent hover:text-accent-hover transition-colors cursor-pointer"
        >
          <span>Xem chi tiết</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
