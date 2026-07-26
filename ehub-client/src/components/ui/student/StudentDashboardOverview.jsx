import React from "react";
import {
  Users,
  Target,
  Calendar,
  Clock,
  ChevronRight,
  ArrowUpRight,
  Layout,
  MessageCircle,
  FileText,
  CheckCircle2,
  Crown,
} from "lucide-react";
import { LastNameAvatar } from "@/components/icons/ui";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/ui/StatusBadge";
import Banner from "@/components/ui/Banner";

const KPI_TONES = {
  accent: { box: "bg-accent-bg", icon: "text-accent", bar: "bg-accent" },
  amber:  { box: "bg-warning-bg", icon: "text-warning", bar: "bg-warning" },
  green:  { box: "bg-success-bg", icon: "text-success", bar: "bg-success" },
  blue:   { box: "bg-secondary-bg", icon: "text-secondary", bar: "bg-secondary" },
};

function KpiCard({ icon: Icon, label, value, suffix, tone = "accent", progress, hint, to }) {
  const T = KPI_TONES[tone] || KPI_TONES.accent;
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-card bg-surface shadow-card p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="flex items-center justify-between">
        <span className={`grid place-items-center w-10 h-10 rounded-xl ${T.box} ${T.icon} transition-transform duration-200 group-hover:scale-105`}>
          <Icon size={19} />
        </span>
        <ArrowUpRight size={16} className="text-text-muted opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </div>
      <p className="mt-4 text-[26px] font-bold text-text-primary leading-none tracking-tight">
        {value}
        {suffix && <span className="text-sm font-medium text-text-muted ml-1">{suffix}</span>}
      </p>
      <p className="mt-1.5 text-xs text-text-muted">{label}</p>
      <div className="mt-3 min-h-[6px]">
        {progress != null ? (
          <div className="h-1.5 rounded-full bg-subtle overflow-hidden">
            <div className={`h-full rounded-full ${T.bar} transition-[width] duration-500`} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
        ) : hint ? (
          <p className="text-[11px] font-medium text-text-muted">{hint}</p>
        ) : null}
      </div>
    </Link>
  );
}

export default function StudentDashboardOverview({ group, user, statsData }) {
  if (!group) return null;

  const members = Array.isArray(group.members) ? group.members : [];
  const activeMembers = Number(group.active_members) || 0;
  const maxMembers = Number(group.max_members) || 5;

  const cpStats = { submitted: 0, total: 0, pending: 0, avgScore: 0, ...(statsData?.checkpointStats || {}) };
  const memberStats = statsData?.group?.memberStats || { status: "ineligible" };

  const groupInitials = (group.group_name || "N").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const stats = [
    {
      icon: FileText, label: "Bài tập nộp", value: `${cpStats.submitted}/${cpStats.total}`, tone: "accent",
      to: "/student/assignments", progress: cpStats.total ? (cpStats.submitted / cpStats.total) * 100 : 0,
    },
    {
      icon: Clock, label: "Checkpoint chờ", value: cpStats.pending > 0 ? `${cpStats.pending} bài` : "Đã xong", tone: "amber",
      to: "/student/assignments?tab=checkpoints", hint: cpStats.pending > 0 ? "Cần xử lý sớm" : "Hoàn tất",
    },
    {
      icon: Users, label: "Thành viên", value: `${activeMembers}/${maxMembers}`, tone: "green",
      to: "/student/groups", progress: maxMembers ? (activeMembers / maxMembers) * 100 : 0,
    },
    {
      icon: CheckCircle2, label: "Điểm trung bình", value: cpStats.avgScore.toFixed(1), suffix: "/10", tone: "blue",
      to: "/student/assignments", progress: (cpStats.avgScore / 10) * 100,
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "eligible": return <StatusBadge status="success" label="Đủ điều kiện" />;
      case "needs_review": return <StatusBadge status="warning" label="Cần review" />;
      default: return <StatusBadge status="danger" label="Chưa đạt" />;
    }
  };

  const mentorName = group.mentor_display_name?.replace(/\s*\(.*?\)/g, "") || null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Chào {user?.full_name?.replace(/\s*\(.*?\)/g, "") || "bạn"} 👋
          </h1>
          <p className="text-sm text-text-secondary mt-1">Chúc bạn một ngày học tập và làm việc hiệu quả.</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start bg-surface px-3.5 py-2 rounded-full shadow-card">
          <Calendar size={15} className="text-accent" />
          <span className="text-xs font-medium text-text-secondary">
            {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: project + KPIs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project card */}
          <div className="rounded-card bg-surface shadow-card p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="shrink-0 grid place-items-center w-12 h-12 rounded-2xl bg-linear-to-br from-accent-500 to-accent-400 text-white font-bold shadow-sm">
                {groupInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted mb-1.5">
                  <Target size={12} /> Dự án hiện tại
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-text-primary leading-tight">
                    {group.group_name || "Tên nhóm chưa cập nhật"}
                  </h2>
                  {getStatusBadge(memberStats.status)}
                </div>
                {group.topic && (
                  <p className="mt-1.5 text-sm text-text-secondary line-clamp-2 leading-relaxed max-w-xl">{group.topic}</p>
                )}
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-subtle pl-1 pr-3 py-1 text-xs font-medium text-text-secondary">
                  <LastNameAvatar name={mentorName || "M"} index={7} size="xs" />
                  {mentorName || "Chưa có Mentor"}
                </span>
                <span className="rounded-full bg-subtle px-3 py-1.5 text-xs font-medium text-text-secondary">Lớp {group.class_code || "—"}</span>
                {group.category && (
                  <span className="rounded-full bg-secondary-bg px-3 py-1.5 text-xs font-medium text-secondary">{group.category}</span>
                )}
              </div>
              <Link
                to="/student/groups"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control bg-accent text-white text-sm font-medium shadow-sm hover:bg-accent-hover hover:shadow-md transition-all duration-150"
              >
                Chi tiết nhóm
                <ChevronRight size={15} />
              </Link>
            </div>
          </div>

          {!group.topic && (
            <Banner variant="warning" icon={<Target size={16} />}>
              Đề tài dự án chưa được thiết lập. Hãy thảo luận với Mentor để cập nhật đề tài.
            </Banner>
          )}

          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, idx) => <KpiCard key={idx} {...s} />)}
          </div>
        </div>

        {/* Right: members + quick actions */}
        <div className="space-y-6">
          {/* Members */}
          <div className="rounded-card bg-surface shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid place-items-center w-8 h-8 rounded-lg bg-accent-bg text-accent"><Users size={17} /></span>
                <h3 className="text-base font-semibold text-text-primary">Thành viên <span className="text-text-muted font-normal">({members.length})</span></h3>
              </div>
              <Link to="/student/groups" className="text-xs font-medium text-accent hover:text-accent-hover transition-colors">Tất cả</Link>
            </div>

            <div className="flex flex-col gap-1">
              {members.map((m, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-subtle transition-colors group">
                  <LastNameAvatar name={m.full_name || "U"} index={idx} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">
                      {m.full_name?.replace(/\s*\(.*?\)/g, "")}
                    </p>
                    <p className="text-xs text-text-muted">{m.role === "leader" ? "Nhóm trưởng" : "Thành viên"}</p>
                  </div>
                  {m.role === "leader" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning-bg text-warning-text px-2 py-0.5 text-[10px] font-semibold">
                      <Crown size={11} /> Trưởng
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-card bg-surface shadow-card p-6">
            <h3 className="text-base font-semibold text-text-primary mb-4">Lối tắt nhanh</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/student/assignments"
                className="group flex flex-col gap-3 p-4 rounded-2xl ring-1 ring-border hover:ring-border-strong hover:-translate-y-0.5 hover:shadow-card transition-all duration-150"
              >
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-accent-bg text-accent group-hover:scale-105 transition-transform"><Layout size={18} /></span>
                <span className="text-sm font-medium text-text-primary">Nộp bài tập</span>
              </Link>

              <a
                href={group.zalo_link || undefined}
                target={group.zalo_link ? "_blank" : undefined}
                rel="noreferrer"
                title={group.zalo_link ? "Mở nhóm Zalo" : "Nhóm chưa có liên kết Zalo"}
                className={`group flex flex-col gap-3 p-4 rounded-2xl ring-1 ring-border transition-all duration-150 ${
                  group.zalo_link ? "hover:ring-border-strong hover:-translate-y-0.5 hover:shadow-card" : "opacity-50 cursor-not-allowed"
                }`}
              >
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-secondary-bg text-secondary group-hover:scale-105 transition-transform"><MessageCircle size={18} /></span>
                <span className="text-sm font-medium text-text-primary">Nhóm Zalo</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
