import { useMemo } from "react";
import { Users, Check, AlertTriangle, ArrowRight } from "lucide-react";

/**
 * GroupCard — thẻ nhóm (calm & gọn): identity + thành phần ngành + hành động.
 *
 * Props: name, classCode, topic, members, majors[{name,count,minRequired}], avatars[], onDetail
 */

function calcStatus(majors) {
  const unmet = majors.filter((m) => m.count < (m.minRequired ?? 1));
  return unmet.length === 0 ? "ok" : "attention";
}

export default function GroupCard({
  name      = "Nhóm Alpha",
  classCode = "EXE101 - 01",
  topic     = "",
  members   = 4,
  majors    = [],
  avatars   = [],
  onDetail,
}) {
  const displayMajors = useMemo(() => {
    const source = majors || [];
    const deMatch = source.find((m) => m.name === "DE");
    const de = deMatch ? deMatch.count : 0;
    const ds = source.find((m) => m.name === "DS")?.count || 0;
    const da = source.find((m) => m.name === "DA")?.count || 0;
    const dsdaMatch = source.find((m) => m.name === "DS/DA");
    const dsda = dsdaMatch ? dsdaMatch.count : ds + da;
    return [
      { name: "DE",    count: de,   minRequired: deMatch?.minRequired ?? 2 },
      { name: "DS/DA", count: dsda, minRequired: dsdaMatch?.minRequired ?? 2 },
    ];
  }, [majors]);

  const status = calcStatus(displayMajors);
  const ok = status === "ok";

  const shownAvatars = avatars.slice(0, 3);
  const placeholderCount = Math.max(0, Math.min(members, 3) - shownAvatars.length);
  const extraCount = Math.max(0, members - 3);

  return (
    <div className="group rounded-card bg-surface shadow-card px-5 py-5 sm:px-6 w-full flex flex-col gap-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="shrink-0 grid place-items-center w-11 h-11 rounded-xl bg-linear-to-br from-accent-100 to-accent-200 text-accent">
            <Users size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-text-primary leading-tight truncate">{name}</h3>
            <p className="text-xs text-text-muted mt-0.5 truncate">{classCode}</p>
          </div>
        </div>
        {ok ? (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-success-bg text-success-text px-2.5 py-1 text-[11px] font-medium">
            <Check size={12} /> Đủ điều kiện
          </span>
        ) : (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-warning-bg text-warning-text px-2.5 py-1 text-[11px] font-medium">
            <AlertTriangle size={12} /> Cần bổ sung
          </span>
        )}
      </div>

      {topic && <p className="text-sm text-text-secondary line-clamp-2 -mt-1">{topic}</p>}

      {/* Thành phần ngành — chip rõ ràng có ✓ / cần thêm */}
      <div className="flex flex-wrap gap-2">
        {displayMajors.map(({ name: mName, count, minRequired }) => {
          const met = count >= (minRequired ?? 1);
          return (
            <span
              key={mName}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${
                met ? "bg-subtle text-text-secondary" : "bg-warning-bg text-warning-text"
              }`}
            >
              <span className="font-semibold text-text-primary">{mName}</span>
              <span className="font-medium">{count}</span>
              {met ? (
                <Check size={13} className="text-success" />
              ) : (
                <span className="text-xs">· cần {minRequired}</span>
              )}
            </span>
          );
        })}
      </div>

      {/* Footer: avatars + CTA */}
      <div className="flex items-center justify-between gap-2 mt-1 pt-4 border-t border-border">
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {shownAvatars.map((src, i) => (
              <img key={`a-${i}`} src={src} alt="" className="w-8 h-8 rounded-full border-2 border-surface object-cover" style={{ zIndex: 10 - i }} />
            ))}
            {Array.from({ length: placeholderCount }).map((_, i) => (
              <div key={`p-${i}`} className="w-8 h-8 rounded-full border-2 border-surface bg-subtle flex items-center justify-center" style={{ zIndex: 5 - i }}>
                <Users size={13} className="text-text-muted" />
              </div>
            ))}
          </div>
          {extraCount > 0 && <span className="ml-2 text-xs text-text-muted font-medium">+{extraCount}</span>}
        </div>
        <button onClick={onDetail} className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover transition-colors cursor-pointer">
          Xem chi tiết
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
