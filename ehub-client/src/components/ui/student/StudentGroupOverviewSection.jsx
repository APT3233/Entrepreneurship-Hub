import { Pencil, Users, FileCheck2, Star, Crown } from "lucide-react";
import { LastNameAvatar } from "@/components/icons/ui";
import { formatDate } from "@/utils/dateTimeDisplay";
import StatusBadge from "@/components/ui/StatusBadge";

/** Một trường thông tin có nhãn, giá trị và nút "Yêu cầu đổi". */
function InfoField({ label, value, onRequestChange, muted = false }) {
  return (
    <div className="flex items-start justify-between gap-3 py-4 first:pt-0 last:pb-0 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-text-muted mb-1">{label}</p>
        <p className={`text-sm font-medium leading-relaxed ${muted ? "text-text-muted" : "text-text-primary"}`}>
          {value || "—"}
        </p>
      </div>
      {onRequestChange && (
        <button
          onClick={onRequestChange}
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-control text-text-secondary text-xs font-medium hover:bg-subtle transition-colors cursor-pointer"
        >
          <Pencil size={12} />
          Yêu cầu đổi
        </button>
      )}
    </div>
  );
}

export default function StudentGroupOverviewSection({ group }) {
  if (!group) return null;

  const members = Array.isArray(group.members) ? group.members : [];
  const activeMembers = Number(group.active_members) || 0;
  const maxMembers = Number(group.max_members) || 5;
  const memberPercent = maxMembers ? Math.round((activeMembers / maxMembers) * 100) : 0;
  const isEnoughMembers = activeMembers >= maxMembers;
  const groupName = group.group_name || "Nhóm chưa đặt tên";
  const initials = groupName.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const kpis = [
    { icon: Users, label: "Thành viên", value: `${activeMembers}/${maxMembers}`, percent: memberPercent, tone: "accent" },
    { icon: FileCheck2, label: "Bài tập đã nộp", value: "0/5", tone: "blue" },
    { icon: Star, label: "Điểm trung bình", value: "0/10", tone: "green" },
  ];
  const KPI_TONE = {
    accent: "bg-accent-bg text-accent",
    blue: "bg-secondary-bg text-secondary",
    green: "bg-success-bg text-success",
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* ── Hero: Team HQ ── */}
      <section className="rounded-card bg-surface shadow-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="shrink-0 grid place-items-center w-14 h-14 rounded-2xl bg-linear-to-br from-accent-500 to-accent-400 text-white font-bold text-lg shadow-sm">
              {initials || "N"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Nhóm của tôi{group.class_code ? ` · ${group.class_code}` : ""}
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">{groupName}</h1>
              {group.topic && (
                <p className="mt-1.5 text-sm text-text-secondary leading-relaxed line-clamp-2 max-w-2xl">{group.topic}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {group.category && (
                  <span className="rounded-full bg-secondary-bg text-secondary px-3 py-1 text-xs font-medium">{group.category}</span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-subtle px-3 py-1 text-xs font-medium text-text-secondary">
                  <LastNameAvatar name={group.mentor_display_name || "M"} index={7} size="xs" />
                  {group.mentor_display_name?.replace(/\s*\(.*?\)/g, "") || "Chưa có Mentor"}
                </span>
              </div>
            </div>
          </div>
          <StatusBadge status="success" label="Đã xác nhận" />
        </div>

        {/* KPI strip */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border pt-5">
          {kpis.map((k) => (
            <div key={k.label} className="flex items-center gap-3">
              <span className={`shrink-0 grid place-items-center w-10 h-10 rounded-xl ${KPI_TONE[k.tone]} [&_svg]:w-5 [&_svg]:h-5`}>
                <k.icon />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xl font-semibold text-text-primary leading-none">{k.value}</p>
                  <p className="text-xs text-text-muted">{k.label}</p>
                </div>
                {k.percent != null && (
                  <div className="mt-2 h-1.5 w-full rounded-full bg-subtle overflow-hidden">
                    <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${k.percent}%` }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!isEnoughMembers && (
          <p className="mt-4 text-xs text-warning-text bg-warning-bg rounded-lg px-3 py-2 inline-block">
            Nhóm chưa đủ thành viên — {activeMembers}/{maxMembers} đã tham gia.
          </p>
        )}
      </section>

      {/* ── Chi tiết + thành viên (nhịp bất đối xứng) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thông tin nhóm (có yêu cầu đổi) */}
        <div className="lg:col-span-1 rounded-card bg-surface shadow-card p-6">
          <h2 className="text-base font-semibold text-text-primary mb-2">Thông tin nhóm</h2>
          <div>
            <InfoField label="Tên nhóm" value={group.group_name} onRequestChange={() => {}} />
            <InfoField label="Lĩnh vực" value={group.category || "Chưa xác định"} muted={!group.category} onRequestChange={() => {}} />
            <InfoField label="Đề tài" value={group.topic || "Chưa có đề tài"} muted={!group.topic} onRequestChange={() => {}} />
            <InfoField label="Lớp" value={group.class_code} />
            <InfoField label="Học kỳ" value={group.semester_name} muted={!group.semester_name} />
          </div>
        </div>

        {/* Thành viên */}
        <div className="lg:col-span-2 rounded-card bg-surface shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-accent-bg text-accent">
                <Users size={17} />
              </span>
              <h2 className="text-base font-semibold text-text-primary">Thành viên nhóm</h2>
            </div>
            <span className="rounded-full bg-subtle px-3 py-1 text-xs font-medium text-text-secondary">
              {members.length} thành viên
            </span>
          </div>

          {members.length === 0 ? (
            <div className="py-12 text-center text-sm text-text-muted">Chưa có dữ liệu thành viên</div>
          ) : (
            <div className="flex flex-col gap-1">
              {members.map((m, idx) => (
                <div key={m.student_id || idx} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-subtle transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <LastNameAvatar name={m.full_name || "U"} index={idx} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">
                        {m.full_name?.replace(/\s*\(.*?\)/g, "") || "—"}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">{m.student_code || "—"}</p>
                    </div>
                  </div>
                  {m.role === "leader" ? (
                    <span className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-accent-bg text-accent px-2.5 py-1 text-xs font-medium">
                      <Crown size={12} /> Nhóm trưởng
                    </span>
                  ) : m.status === "pending" ? (
                    <span className="shrink-0 rounded-lg bg-warning-bg text-warning-text px-2.5 py-1 text-xs font-medium">Chờ xác nhận</span>
                  ) : (
                    <span className="shrink-0 rounded-lg bg-success-bg text-success-text px-2.5 py-1 text-xs font-medium">Thành viên</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
